import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { Config } from '../config.js';
import { ServiceError } from '../services/errors.js';
import type { Services } from '../services/index.js';
import { authRoutes } from './auth.js';
import { errorResponse, SERVICE_ERRORS } from './errors.js';
import { healthRoutes } from './health.js';
import { InvalidInput } from './input.js';
import { requestLogger } from './logger.js';
import { meRoutes } from './me.js';
import { lessonRoutes, progressRoutes } from './progress.js';
import { requireSameOrigin } from './security.js';
import { sessionCookies } from './session.js';

export interface AppOptions {
	config: Pick<Config, 'publicUrl' | 'trustProxy'>;
	services: Services;
	log?: (line: string) => void;
}

/** JSON bodies are small: credentials, names, ids. */
const JSON_BODY_LIMIT = 16 * 1024;

/** The whole HTTP API, under `/api`. */
export function createApp({ config, services, log }: AppOptions) {
	const app = new Hono().basePath('/api');

	app.use(requestLogger(log));
	app.use(requireSameOrigin(config.publicUrl));
	app.use(
		bodyLimit({
			maxSize: JSON_BODY_LIMIT,
			onError: (c) => errorResponse(c, 413, 'payload_too_large', 'The body is too large')
		})
	);

	app.route('/health', healthRoutes(services));
	const cookies = sessionCookies({ secure: config.publicUrl.startsWith('https:') });
	app.route('/auth', authRoutes(services, { trustProxy: config.trustProxy, cookies }));
	app.route('/me', meRoutes(services, cookies));
	app.route('/lessons', lessonRoutes(services, cookies));
	app.route('/progress', progressRoutes(services, cookies));

	app.notFound((c) => errorResponse(c, 404, 'not_found', 'No such route'));
	app.onError((error, c) => {
		if (error instanceof ServiceError) {
			const { status, message } = SERVICE_ERRORS[error.code];
			return errorResponse(c, status, error.code, message);
		}
		if (error instanceof InvalidInput) {
			return errorResponse(c, 400, 'invalid_input', `Invalid body: ${error.message}`);
		}
		(log ?? console.error)(`Unhandled error on ${c.req.method} ${c.req.path}: ${error.name}`);
		return errorResponse(c, 500, 'internal', 'Internal error');
	});

	return app;
}
