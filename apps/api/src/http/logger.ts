import type { MiddlewareHandler } from 'hono';

/**
 * One line per request: method, path, status and duration. Nothing else is logged, never the
 * query string, the body, cookies or headers (SPEC.md › What data leaves the app).
 */
export function requestLogger(log: (line: string) => void = console.log): MiddlewareHandler {
	return async (c, next) => {
		const start = performance.now();
		await next();
		const duration = Math.round(performance.now() - start);
		log(`${c.req.method} ${c.req.path} ${c.res.status} ${duration}ms`);
	};
}
