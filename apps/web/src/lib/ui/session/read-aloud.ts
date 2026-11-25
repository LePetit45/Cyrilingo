// A read-aloud try, from the recording to the verdict shown (SPEC.md › The model feature).
import type { ApiResult, SpeechCheck } from '#lib/api/client.js';

/** Why a read-aloud question could not be checked; each has its own sentence. */
export type UnavailableReason = 'service' | 'quota' | 'denied' | 'missing';

export type ReadAloudResult =
	| { outcome: 'match' }
	| { outcome: 'mismatch'; heard: string }
	| { outcome: 'not_understood' }
	| { outcome: 'unavailable'; reason: UnavailableReason };

/** Tries per read-aloud question: after the second failed one, the question is passed. */
export const READ_ALOUD_TRIES = 2;

/** The verdict from the API's answer: any failure to get one means the feature is unavailable. */
export function resultOf(answer: ApiResult<SpeechCheck>): ReadAloudResult {
	if (!answer.ok) {
		return {
			outcome: 'unavailable',
			reason: answer.error === 'speech_quota_reached' ? 'quota' : 'service'
		};
	}
	const check = answer.value;
	return check.outcome === 'unavailable' ? { outcome: 'unavailable', reason: 'service' } : check;
}

/**
 * Sends the recording to the API once it is ready. A recording that could not be turned into
 * WAV (empty, cut short) is a try where nothing was heard.
 */
export async function checkRecording(
	recognize: (word: string, audio: Uint8Array) => Promise<ApiResult<SpeechCheck>>,
	word: string,
	recording: Promise<Uint8Array>
): Promise<ReadAloudResult> {
	let audio: Uint8Array;
	try {
		audio = await recording;
	} catch {
		return { outcome: 'not_understood' };
	}
	return resultOf(await recognize(word, audio));
}

/** Whether a failed try leaves another one (AC-43). */
export function canRetry(result: ReadAloudResult, triesMade: number): boolean {
	return (
		(result.outcome === 'mismatch' || result.outcome === 'not_understood') &&
		triesMade < READ_ALOUD_TRIES
	);
}
