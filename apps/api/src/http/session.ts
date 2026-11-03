import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { Authenticated, AuthService } from '../services/auth.js';
import { errorResponse } from './errors.js';

export const SESSION_COOKIE = 'session';

/** What `requireSession` puts in the context for the route. */
export type SessionVariables = { session: Authenticated & { token: string } };

/** Sets the session cookie: HttpOnly, Secure, SameSite=Lax, whole site (AC-13). */
export function setSessionCookie(c: Context, token: string, expiresAt: Date): void {
	setCookie(c, SESSION_COOKIE, token, {
		httpOnly: true,
		secure: true,
		sameSite: 'Lax',
		path: '/',
		expires: expiresAt
	});
}

export function clearSessionCookie(c: Context): void {
	deleteCookie(c, SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/' });
}

/**
 * Answers 401 unless the request carries a valid session cookie; otherwise puts the session in
 * `c.var.session`, and sends the cookie again when this use renewed the session.
 */
export function requireSession(
	auth: AuthService
): MiddlewareHandler<{ Variables: SessionVariables }> {
	return async (c, next) => {
		const token = getCookie(c, SESSION_COOKIE);
		const session = token ? await auth.authenticate(token) : null;
		if (!token || !session) {
			if (token) clearSessionCookie(c);
			return errorResponse(c, 401, 'unauthenticated', 'Sign in first');
		}
		if (session.renewedUntil) setSessionCookie(c, token, session.renewedUntil);
		c.set('session', { ...session, token });
		return next();
	};
}
