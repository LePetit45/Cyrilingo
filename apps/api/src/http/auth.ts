import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import { ServiceError } from '../services/errors.js';
import type { Services } from '../services/index.js';
import { clientIp, readJson } from './input.js';
import type { SessionCookies, SessionVariables } from './session.js';

// The length rule of passwords lives in the service; here, only the shape of the body.
const credentials = z.object({
	email: z.email().max(254),
	password: z.string()
});

/** The app's page that ends a Google sign-in, with `?error=…` or `?notice=…` (SPEC.md › Auth). */
export const GOOGLE_RETURN_PAGE = '/signin/google';

/** Why a Google sign-in did not end in a session, as told to the app's page. */
export type GoogleOutcome =
	'google_failed' | 'google_unverified' | 'google_unavailable' | 'google_cancelled';

/** The state and the PKCE verifier wait in these cookies while the learner is at Google's. */
const GOOGLE_STATE_COOKIE = 'google_state';
const GOOGLE_VERIFIER_COOKIE = 'google_verifier';
/** Ten minutes to agree on Google's page. */
const GOOGLE_COOKIE_MAX_AGE_S = 10 * 60;

/** What Google sends back to the callback; anything else in the query is ignored. */
const callbackQuery = z.object({
	code: z.string().max(2048).optional(),
	state: z.string().max(128).optional(),
	error: z.string().max(256).optional()
});

/** `/api/auth`: local sign-up, sign-in and sign-out, and Google sign-in. */
export function authRoutes(
	services: Services,
	options: { trustProxy: boolean; secure: boolean; cookies: SessionCookies }
) {
	const { cookies } = options;
	// Sent back on Google's redirect to the callback, a top-level GET: SameSite=Lax lets them in.
	const googleCookie = {
		httpOnly: true,
		secure: options.secure,
		sameSite: 'Lax',
		path: '/api/auth/google'
	} as const;

	const backToApp = (c: Context, query: string) => c.redirect(`${GOOGLE_RETURN_PAGE}?${query}`);

	return new Hono<{ Variables: SessionVariables }>()
		.post('/signup', async (c) => {
			const { email, password } = await readJson(c, credentials);
			const session = await services.auth.signUp(email, password, clientIp(c, options.trustProxy));
			cookies.set(c, session.token, session.expiresAt);
			return c.body(null, 201);
		})
		.post('/login', async (c) => {
			const { email, password } = await readJson(c, credentials);
			const session = await services.auth.signIn(email, password, clientIp(c, options.trustProxy));
			cookies.set(c, session.token, session.expiresAt);
			return c.body(null, 204);
		})
		.get('/google', (c) => {
			if (!services.google) return backToApp(c, 'error=google_unavailable');
			const { url, state, codeVerifier } = services.google.start();
			const kept = { ...googleCookie, maxAge: GOOGLE_COOKIE_MAX_AGE_S };
			setCookie(c, GOOGLE_STATE_COOKIE, state, kept);
			setCookie(c, GOOGLE_VERIFIER_COOKIE, codeVerifier, kept);
			return c.redirect(url.toString());
		})
		.get('/google/callback', async (c) => {
			const expectedState = getCookie(c, GOOGLE_STATE_COOKIE);
			const codeVerifier = getCookie(c, GOOGLE_VERIFIER_COOKIE);
			// Used once, whatever happens next.
			deleteCookie(c, GOOGLE_STATE_COOKIE, googleCookie);
			deleteCookie(c, GOOGLE_VERIFIER_COOKIE, googleCookie);

			if (!services.google) return backToApp(c, 'error=google_unavailable');
			const query = callbackQuery.safeParse(c.req.query());
			if (!query.success) return backToApp(c, 'error=google_failed');
			// The learner said no on Google's page, or closed it.
			if (query.data.error) return backToApp(c, 'error=google_cancelled');

			try {
				const { session, passwordRemoved } = await services.google.finish({
					code: query.data.code,
					state: query.data.state,
					expectedState,
					codeVerifier
				});
				cookies.set(c, session.token, session.expiresAt);
				return backToApp(c, passwordRemoved ? 'notice=password_removed' : 'signed_in=1');
			} catch (error) {
				if (!(error instanceof ServiceError)) throw error;
				const outcome: GoogleOutcome =
					error.code === 'google_unverified' ? 'google_unverified' : 'google_failed';
				return backToApp(c, `error=${outcome}`);
			}
		})
		.post('/logout', cookies.require(services.auth), async (c) => {
			await services.auth.signOut(c.var.session.token);
			cookies.clear(c);
			return c.body(null, 204);
		});
}
