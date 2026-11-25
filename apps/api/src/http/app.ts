import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { Config } from '../config.js';
import { ServiceError } from '../services/errors.js';
import type { Services } from '../services/index.js';
import { authRoutes } from './auth.js';
import { errorResponse, SERVICE_ERRORS } from './errors.js';
import { healthRoutes } from './health.js';
import { mcpRoutes } from '../mcp/http.js';
import { InvalidInput } from './input.js';
import { requestLogger } from './logger.js';
import { meRoutes } from './me.js';
import { lessonRoutes, progressRoutes } from './progress.js';
import { requireSameOrigin } from './security.js';
import { sessionCookies } from './session.js';
import { speechRoutes } from './speech.js';
import { wordListRoutes } from './word-lists.js';

export interface AppOptions {
	config: Pick<Config, 'publicUrl' | 'trustProxy'>;
	services: Services;
	log?: (line: string) => void;
}

/** JSON bodies are small: credentials, names, ids. Speech recordings have their own limit. */
const JSON_BODY_LIMIT = 16 * 1024;

const jsonBodyLimit = bodyLimit({
	maxSize: JSON_BODY_LIMIT,
	onError: (c) => errorResponse(c, 413, 'payload_too_large', 'The body is too large')
});

/** The whole HTTP API, under `/api`, and the MCP server over HTTP, at `/mcp`. */
export function createApp({ config, services, log }: AppOptions) {
	const root = new Hono();
	root.use(requestLogger(log));
	// Outside `/api`: an agent sends a Bearer key, not the session cookie, so the CSRF checks below
	// do not apply; the MCP route checks the Origin itself.
	root.route('/mcp', mcpRoutes(services, config.publicUrl));

	const app = root.basePath('/api');
	app.use(requireSameOrigin(config.publicUrl));
	// A limit set here could not be raised by a route: the speech route sets its own.
	app.use((c, next) => (c.req.path.startsWith('/api/speech/') ? next() : jsonBodyLimit(c, next)));

	app.route('/health', healthRoutes(services));
	const secure = config.publicUrl.startsWith('https:');
	const cookies = sessionCookies({ secure });
	app.route('/auth', authRoutes(services, { trustProxy: config.trustProxy, secure, cookies }));
	app.route('/me', meRoutes(services, cookies));
	app.route('/lessons', lessonRoutes(services, cookies));
	app.route('/progress', progressRoutes(services, cookies));
	app.route('/word-lists', wordListRoutes(services, cookies));
	app.route('/speech', speechRoutes(services, cookies));

	root.notFound((c) => errorResponse(c, 404, 'not_found', 'No such route'));
	root.onError((error, c) => {
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

	return root;
}
