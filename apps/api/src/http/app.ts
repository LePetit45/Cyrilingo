import { Hono } from 'hono';
import type { Config } from '../config.js';
import type { Services } from '../services/index.js';
import { errorResponse } from './errors.js';
import { healthRoutes } from './health.js';
import { requestLogger } from './logger.js';
import { requireSameOrigin } from './security.js';

export interface AppOptions {
	config: Pick<Config, 'publicUrl'>;
	services: Services;
	log?: (line: string) => void;
}

/** The whole HTTP API, under `/api`. */
export function createApp({ config, services, log }: AppOptions) {
	const app = new Hono().basePath('/api');

	app.use(requestLogger(log));
	app.use(requireSameOrigin(config.publicUrl));

	app.route('/health', healthRoutes(services));

	app.notFound((c) => errorResponse(c, 404, 'not_found', 'No such route'));
	app.onError((error, c) => {
		(log ?? console.error)(`Unhandled error on ${c.req.method} ${c.req.path}: ${error.name}`);
		return errorResponse(c, 500, 'internal', 'Internal error');
	});

	return app;
}
