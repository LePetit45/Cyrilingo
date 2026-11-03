import { Hono } from 'hono';
import type { Services } from '../services/index.js';
import { errorResponse } from './errors.js';

/** `GET /api/health`: 200 when the database answers, 503 when it does not. */
export function healthRoutes(services: Services) {
	return new Hono().get('/', async (c) => {
		if (await services.health.isDatabaseUp()) return c.json({ status: 'ok' });
		return errorResponse(c, 503, 'database_unavailable', 'The database does not answer');
	});
}
