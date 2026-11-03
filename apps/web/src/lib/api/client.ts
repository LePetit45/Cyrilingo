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
	| 'unauthenticated'
	| 'invalid_input'
	| 'network'
	| 'unknown';

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

const KNOWN_CODES = new Set<string>([
	'invalid_credentials',
	'email_taken',
	'email_taken_google',
	'invalid_password',
	'wrong_password',
	'too_many_attempts',
	'unauthenticated',
	'invalid_input'
]);

/**
 * A request still unanswered after this long counts as `network`: on a connection that hangs,
 * the screens say so instead of waiting, and the next progress sync is not held up.
 */
export const REQUEST_TIMEOUT_MS = 15_000;

export function createApiClient(fetchFn: typeof fetch = (...args) => fetch(...args)) {
	async function call<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
		const timeout = new AbortController();
		const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
		let response: Response;
		let data: unknown;
		try {
			response = await fetchFn(`/api${path}`, {
				method,
				headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
				body: body === undefined ? undefined : JSON.stringify(body),
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
		resetProgress: () => call<void>('DELETE', '/progress')
	};
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const api = createApiClient();
