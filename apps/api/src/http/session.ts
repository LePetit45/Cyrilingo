import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { Authenticated, AuthService } from '../services/auth.js';
import { errorResponse } from './errors.js';

export const SESSION_COOKIE = 'session';

/** What `requireSession` puts in the context for the route. */
export type SessionVariables = { session: Authenticated & { token: string } };

export type SessionCookies = ReturnType<typeof sessionCookies>;

/**
 * The session cookie: HttpOnly, SameSite=Lax, whole site, and Secure (AC-13) whenever the app is
 * served over HTTPS, as it always is once deployed. Plain HTTP is only for localhost in
 * development, where Safari would drop a Secure cookie.
 */
export function sessionCookies({ secure }: { secure: boolean }) {
	const attributes = { httpOnly: true, secure, sameSite: 'Lax', path: '/' } as const;

	function set(c: Context, token: string, expiresAt: Date): void {
		setCookie(c, SESSION_COOKIE, token, { ...attributes, expires: expiresAt });
	}

	function clear(c: Context): void {
		deleteCookie(c, SESSION_COOKIE, attributes);
	}

	/**
	 * Answers 401 unless the request carries a valid session cookie; otherwise puts the session in
	 * `c.var.session`, and sends the cookie again when this use renewed the session.
	 */
	function require(auth: AuthService): MiddlewareHandler<{ Variables: SessionVariables }> {
		return async (c, next) => {
			const token = getCookie(c, SESSION_COOKIE);
			const session = token ? await auth.authenticate(token) : null;
			if (!token || !session) {
				if (token) clear(c);
				return errorResponse(c, 401, 'unauthenticated', 'Sign in first');
			}
			if (session.renewedUntil) set(c, token, session.renewedUntil);
			c.set('session', { ...session, token });
			return next();
		};
	}

	return { set, clear, require };
}
