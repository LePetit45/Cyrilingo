import { Hono } from 'hono';
import { z } from 'zod';
import type { Services } from '../services/index.js';
import { clientIp, readJson } from './input.js';
import type { SessionCookies, SessionVariables } from './session.js';

// The length rule of passwords lives in the service; here, only the shape of the body.
const credentials = z.object({
	email: z.email().max(254),
	password: z.string()
});

/** `/api/auth`: local sign-up, sign-in and sign-out. */
export function authRoutes(
	services: Services,
	options: { trustProxy: boolean; cookies: SessionCookies }
) {
	const { cookies } = options;
	return new Hono<{ Variables: SessionVariables }>()
		.post('/signup', async (c) => {
			const { email, password } = await readJson(c, credentials);
			const session = await services.auth.signUp(email, password);
			cookies.set(c, session.token, session.expiresAt);
			return c.body(null, 201);
		})
		.post('/login', async (c) => {
			const { email, password } = await readJson(c, credentials);
			const session = await services.auth.signIn(email, password, clientIp(c, options.trustProxy));
			cookies.set(c, session.token, session.expiresAt);
			return c.body(null, 204);
		})
		.post('/logout', cookies.require(services.auth), async (c) => {
			await services.auth.signOut(c.var.session.token);
			cookies.clear(c);
			return c.body(null, 204);
		});
}
