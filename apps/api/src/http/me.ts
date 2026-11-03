import { Hono } from 'hono';
import { z } from 'zod';
import type { Services } from '../services/index.js';
import { readJson } from './input.js';
import { clearSessionCookie, requireSession, type SessionVariables } from './session.js';

const passwordChange = z.object({
	/** Required by the service when the account already has a password. */
	currentPassword: z.string().optional(),
	newPassword: z.string()
});

/** `/api/me`: the signed-in learner's account. */
export function meRoutes(services: Services) {
	return new Hono<{ Variables: SessionVariables }>()
		.use(requireSession(services.auth))
		.get('/', async (c) => {
			const account = await services.account.get(c.var.session.userId);
			return c.json({ ...account, features: services.features });
		})
		.put('/password', async (c) => {
			const { currentPassword, newPassword } = await readJson(c, passwordChange);
			const { userId, sessionId } = c.var.session;
			await services.account.setPassword(userId, sessionId, {
				current: currentPassword,
				next: newPassword
			});
			return c.body(null, 204);
		})
		.delete('/', async (c) => {
			await services.account.remove(c.var.session.userId);
			clearSessionCookie(c);
			return c.body(null, 204);
		});
}
