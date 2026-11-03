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

export function createApiClient(fetchFn: typeof fetch = (...args) => fetch(...args)) {
	async function call<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
		let response: Response;
		try {
			response = await fetchFn(`/api${path}`, {
				method,
				headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
				body: body === undefined ? undefined : JSON.stringify(body)
			});
		} catch {
			return { ok: false, error: 'network' };
		}
		const data: unknown = await response.json().catch(() => undefined);
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
		deleteAccount: () => call<void>('DELETE', '/me')
	};
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const api = createApiClient();
