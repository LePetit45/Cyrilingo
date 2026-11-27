import { createGoogleClient, type GoogleClient } from '../auth/google.js';
import type { Config } from '../config.js';
import type { Db } from '../db/database.js';
import { createAzureSpeechClient, type SpeechClient } from '../speech/client.js';
import { createAccountService, type AccountService } from './account.js';
import { createAuthService, type AuthService } from './auth.js';
import { createGoogleAuthService, type GoogleAuthService } from './google-auth.js';
import { createHealthService, type HealthService } from './health.js';
import { createLessonService, type LessonService } from './lessons.js';
import { createLoginAttempts, createSignUpLimit } from './ip-limits.js';
import { createProgressService, type ProgressService } from './progress.js';
import { createSpeechService, SPEECH_TRIES_GLOBAL, type SpeechService } from './speech.js';
import { createWordListService, type WordListService } from './word-lists.js';

/** Every service, built once at start and handed to the HTTP routes and the MCP tools. */
export interface Services {
	health: HealthService;
	auth: AuthService;
	/** Null when Google sign-in is off (no client id or secret). */
	google: GoogleAuthService | null;
	account: AccountService;
	lessons: LessonService;
	progress: ProgressService;
	wordLists: WordListService;
	speech: SpeechService;
	/** Which optional features are on, from the configuration. */
	features: { readAloud: boolean; google: boolean };
}

export interface ServiceOptions {
	now?: () => Date;
	/** Stands in for Google in the tests; otherwise built from the configuration. */
	googleClient?: GoogleClient;
	/** Stands in for the speech provider in the tests; otherwise built from the configuration. */
	speechClient?: SpeechClient;
	/** Per-user speech limit, lowered by the tests. */
	speechTriesPerUser?: number;
}

export function createServices(
	db: Db,
	config: Pick<Config, 'publicUrl' | 'google' | 'azureSpeech'> &
		Partial<Pick<Config, 'speechDailyLimit'>> = {
		publicUrl: 'http://localhost',
		google: null,
		azureSpeech: null,
		speechDailyLimit: SPEECH_TRIES_GLOBAL
	},
	{ now, googleClient, speechClient, speechTriesPerUser }: ServiceOptions = {}
): Services {
	const google =
		googleClient ??
		(config.google &&
			createGoogleClient({
				...config.google,
				redirectUri: `${config.publicUrl}/api/auth/google/callback`
			}));
	const speech =
		speechClient ?? (config.azureSpeech && createAzureSpeechClient(config.azureSpeech));
	return {
		health: createHealthService(db),
		auth: createAuthService({
			db,
			loginAttempts: createLoginAttempts(),
			signUps: createSignUpLimit(),
			now
		}),
		google: google ? createGoogleAuthService(db, google, now) : null,
		account: createAccountService(db, now),
		lessons: createLessonService(db),
		progress: createProgressService(db, now),
		wordLists: createWordListService(db, now),
		speech: createSpeechService({
			db,
			client: speech,
			now,
			limits: { perUser: speechTriesPerUser, global: config.speechDailyLimit }
		}),
		features: { readAloud: speech !== null, google: google !== null }
	};
}
