import type { MiddlewareHandler } from 'hono';

/** What a route may add to its log line: a short outcome, never data about the learner. */
export interface LogVariables {
	logDetail?: string;
}

/**
 * One line per request: method, path, status, duration and, for a read-aloud try, its outcome.
 * Nothing else is logged, never the query string, the body, cookies or headers (SPEC.md › What
 * data leaves the app).
 */
export function requestLogger(
	log: (line: string) => void = console.log
): MiddlewareHandler<{ Variables: LogVariables }> {
	return async (c, next) => {
		const start = performance.now();
		await next();
		const duration = Math.round(performance.now() - start);
		const detail = c.var.logDetail ? ` ${c.var.logDetail}` : '';
		log(`${c.req.method} ${c.req.path} ${c.res.status} ${duration}ms${detail}`);
	};
}
