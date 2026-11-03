import { Hono } from 'hono';
import { z } from 'zod';
import type { Services } from '../services/index.js';
import { readJson } from './input.js';
import type { SessionCookies, SessionVariables } from './session.js';

/** A device's progress; the course has 10 lessons, so a longer list is not one. */
const progressBody = z.object({
	completedLessons: z.array(z.string().max(16)).max(50),
	examPassed: z.boolean()
});

/** `/api/progress`: the signed-in learner's progress (SPEC.md › Guests and progress sync). */
export function progressRoutes(services: Services, cookies: SessionCookies) {
	return new Hono<{ Variables: SessionVariables }>()
		.use(cookies.require(services.auth))
		.get('/', async (c) => c.json(await services.progress.get(c.var.session.userId)))
		.patch('/', async (c) => {
			const progress = await readJson(c, progressBody);
			return c.json(await services.progress.merge(c.var.session.userId, progress));
		})
		.delete('/', async (c) => {
			await services.progress.reset(c.var.session.userId);
			return c.body(null, 204);
		});
}

/** `/api/lessons`: the course, with what the signed-in learner completed. */
export function lessonRoutes(services: Services, cookies: SessionCookies) {
	return new Hono<{ Variables: SessionVariables }>()
		.use(cookies.require(services.auth))
		.get('/', async (c) => c.json(await services.lessons.list(c.var.session.userId)));
}
