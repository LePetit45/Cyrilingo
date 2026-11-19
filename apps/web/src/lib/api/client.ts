// Typed client of the Cyrilingo API (SPEC.md › REST API). The only module of the front end that
// talks to the back end: relative `/api` paths on the app's own origin, the session cookie sent by
// the browser. It never throws: every call resolves to a value or an error code, and the screens
// pick the sentence to show from that code (never from the response body).

/** What the API can answer, plus `network` (no answer at all) and `unknown` (anything else). */
export type ApiErrorCode =
	| 'invalid_credentials'
	| 'email_taken'
	| 'email_taken_google'
	| 'invalid_password'
	| 'wrong_password'
	| 'too_many_attempts'
	| 'too_many_sign_ups'
	| 'speech_quota_reached'
	| 'unknown_word'
	| 'payload_too_large'
	| 'unauthenticated'
	| 'invalid_input'
	| 'invalid_list_name'
	| 'list_limit_reached'
	| 'word_already_in_list'
	| 'list_full'
	| 'not_found'
	| 'network'
	| 'unknown';

/** Why a Google sign-in did not end in a session, as the API's callback tells the app. */
export type GoogleErrorCode =
	'google_failed' | 'google_unverified' | 'google_unavailable' | 'google_cancelled';

/** Starts Google sign-in: a full page load, since the API redirects to Google. */
export const GOOGLE_SIGN_IN_URL = '/api/auth/google';

export type ApiResult<T> = { ok: true; value: T } | { ok: false; error: ApiErrorCode };

/** `GET /api/me`. */
export interface Account {
	email: string;
	hasPassword: boolean;
	providers: 'google'[];
	features: { readAloud: boolean; google: boolean };
}

/** `GET /api/progress`, and the answer to `PATCH /api/progress`. */
export interface Progress {
	completedLessons: readonly string[];
	examPassed: boolean;
}

/** A word of a list: the Cyrillic text and its official Latin transliteration. */
export interface ListWord {
	cyrillic: string;
	latin: string;
}

/** `GET /api/word-lists`: one of the learner's personal word lists. */
export interface WordList {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	/** In the order they were added. */
	words: ListWord[];
}

/**
 * `POST /api/speech/recognitions`: the verdict on a read-aloud recording. Only a mismatch carries
 * the text heard, already validated by the API.
 */
export type SpeechCheck =
	| { outcome: 'match' }
	| { outcome: 'mismatch'; heard: string }
	| { outcome: 'not_understood' }
	| { outcome: 'unavailable' };

const KNOWN_CODES = new Set<string>([
	'invalid_credentials',
	'email_taken',
	'email_taken_google',
	'invalid_password',
	'wrong_password',
	'too_many_attempts',
	'too_many_sign_ups',
	'speech_quota_reached',
	'unknown_word',
	'payload_too_large',
	'unauthenticated',
	'invalid_input',
	'invalid_list_name',
	'list_limit_reached',
	'word_already_in_list',
	'list_full',
	'not_found'
]);

/**
 * A request still unanswered after this long counts as `network`: on a connection that hangs,
 * the screens say so instead of waiting, and the next progress sync is not held up.
 */
export const REQUEST_TIMEOUT_MS = 15_000;

export function createApiClient(fetchFn: typeof fetch = (...args) => fetch(...args)) {
	async function call<T>(
		method: string,
		path: string,
		body?: unknown,
		audio?: Uint8Array
	): Promise<ApiResult<T>> {
		const timeout = new AbortController();
		const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
		let response: Response;
		let data: unknown;
		try {
			response = await fetchFn(`/api${path}`, {
				method,
				headers: audio
					? { 'Content-Type': 'audio/wav' }
					: body === undefined
						? {}
						: { 'Content-Type': 'application/json' },
				body: audio
					? (audio as Uint8Array<ArrayBuffer>)
					: body === undefined
						? undefined
						: JSON.stringify(body),
				signal: timeout.signal
			});
			data = await response.json().catch(() => undefined);
			// The body stopped coming in: as unanswered as no response at all.
			if (timeout.signal.aborted) return { ok: false, error: 'network' };
		} catch {
			return { ok: false, error: 'network' };
		} finally {
			clearTimeout(timer);
		}
		if (response.ok) return { ok: true, value: data as T };
		const code = (data as { error?: { code?: unknown } } | undefined)?.error?.code;
		return {
			ok: false,
			error: typeof code === 'string' && KNOWN_CODES.has(code) ? (code as ApiErrorCode) : 'unknown'
		};
	}

	return {
		signUp: (email: string, password: string) =>
			call<void>('POST', '/auth/signup', { email, password }),
		signIn: (email: string, password: string) =>
			call<void>('POST', '/auth/login', { email, password }),
		signOut: () => call<void>('POST', '/auth/logout'),
		getAccount: () => call<Account>('GET', '/me'),
		setPassword: (passwords: { currentPassword?: string; newPassword: string }) =>
			call<void>('PUT', '/me/password', passwords),
		deleteAccount: () => call<void>('DELETE', '/me'),
		getProgress: () => call<Progress>('GET', '/progress'),
		mergeProgress: (progress: Progress) => call<Progress>('PATCH', '/progress', progress),
		resetProgress: () => call<void>('DELETE', '/progress'),
		getWordLists: () => call<WordList[]>('GET', '/word-lists'),
		createWordList: (name: string) => call<WordList>('POST', '/word-lists', { name }),
		renameWordList: (id: string, name: string) =>
			call<WordList>('PATCH', `/word-lists/${encodeURIComponent(id)}`, { name }),
		deleteWordList: (id: string) => call<void>('DELETE', `/word-lists/${encodeURIComponent(id)}`),
		addWordToList: (id: string, word: string) =>
			call<WordList>('POST', `/word-lists/${encodeURIComponent(id)}/words`, { word }),
		removeWordFromList: (id: string, word: string) =>
			call<WordList>(
				'DELETE',
				`/word-lists/${encodeURIComponent(id)}/words/${encodeURIComponent(word)}`
			),
		recognizeSpeech: (word: string, audio: Uint8Array) =>
			call<SpeechCheck>(
				'POST',
				`/speech/recognitions?word=${encodeURIComponent(word)}`,
				undefined,
				audio
			)
	};
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const api = createApiClient();
