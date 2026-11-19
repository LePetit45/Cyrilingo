import { isSameWord, validHeardText } from '@cyrilingo/core/speech.js';
import type { Db } from '../db/database.js';
import type { SpeechOutcome } from '../db/schema.js';
import { recordSpeechAttempt, setSpeechOutcome } from '../db/speech-attempts.js';
import { isCorpusWord } from '../db/word-lists.js';
import { SpeechProviderError, type SpeechClient } from '../speech/client.js';
import { ServiceError } from './errors.js';

/** A provider still silent after this long gives `unavailable` (AC-44). */
export const SPEECH_TIMEOUT_MS = 8_000;
/** Tries one user may make within the window (AC-46). */
export const SPEECH_TRIES_PER_USER = 60;
/** Tries all users together may make within the window, unless configured otherwise (AC-46). */
export const SPEECH_TRIES_GLOBAL = 500;
/** The limits count the tries of the last 24 hours, a rolling window. */
export const SPEECH_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * The verdict on a read-aloud try (SPEC.md › The model feature). Only a mismatch carries the
 * text heard, once validated: a match heard the expected word, and nothing else is ever shown.
 */
export type SpeechCheck =
	| { outcome: 'match' }
	| { outcome: 'mismatch'; heard: string }
	| { outcome: 'not_understood' }
	| { outcome: 'unavailable' };

export interface SpeechService {
	/**
	 * Checks a recording of the user reading `word` aloud. Refuses a word the corpus does not have
	 * (`unknown_word`) and a user over their limit (`speech_quota_reached`); any trouble with the
	 * provider, or the global limit, gives `unavailable`.
	 */
	check(userId: string, word: string, audio: Uint8Array): Promise<SpeechCheck>;
}

export interface SpeechDeps {
	db: Db;
	/** Null when read aloud is off: every try is then `unavailable`. */
	client: SpeechClient | null;
	now?: () => Date;
	limits?: { perUser?: number; global?: number };
	timeoutMs?: number;
	/** Where a refused key or an exhausted free tier is reported, for whoever runs the server. */
	log?: (line: string) => void;
}

export function createSpeechService({
	db,
	client,
	now = () => new Date(),
	limits = {},
	timeoutMs = SPEECH_TIMEOUT_MS,
	log = console.error
}: SpeechDeps): SpeechService {
	const perUser = limits.perUser ?? SPEECH_TRIES_PER_USER;
	const global = limits.global ?? SPEECH_TRIES_GLOBAL;

	/** What the provider heard, or null when it failed, refused or took too long. */
	async function recognize(speech: SpeechClient, audio: Uint8Array) {
		const signal = AbortSignal.timeout(timeoutMs);
		try {
			// Only the audio and the language: never the expected word, never the user (AC-47).
			return await speech.recognize(audio, 'bg-BG', signal);
		} catch (error) {
			if (error instanceof SpeechProviderError && [401, 403].includes(error.status)) {
				log(`Speech provider refused the request (${error.status}): check the key and the quota`);
			}
			return null;
		}
	}

	return {
		async check(userId, word, audio) {
			if (!(await isCorpusWord(db, word))) throw new ServiceError('unknown_word');
			if (!client) return { outcome: 'unavailable' };

			const attempt = await recordSpeechAttempt(db, userId, {
				at: now(),
				windowMs: SPEECH_WINDOW_MS,
				perUser,
				global
			});
			if (attempt === 'user_limit') throw new ServiceError('speech_quota_reached');
			if (attempt === 'global_limit') return { outcome: 'unavailable' };

			const result = verdict(await recognize(client, audio), word);
			await setSpeechOutcome(db, attempt.id, result.outcome satisfies SpeechOutcome);
			return result;
		}
	};
}

/** Validates what the provider heard, then compares it with the expected word (AC-42, AC-43). */
function verdict(
	recognition: Awaited<ReturnType<SpeechClient['recognize']>> | null,
	word: string
): SpeechCheck {
	if (!recognition) return { outcome: 'unavailable' };
	if (recognition.status !== 'success') return { outcome: 'not_understood' };
	const heard = validHeardText(recognition.text);
	if (heard === null) return { outcome: 'not_understood' };
	return isSameWord(heard, word) ? { outcome: 'match' } : { outcome: 'mismatch', heard };
}
