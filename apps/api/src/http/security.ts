import type { MiddlewareHandler } from 'hono';
import { errorResponse } from './errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection on top of `SameSite=Lax` (SPEC.md › REST API): a mutating request must carry an
 * `Origin` equal to `PUBLIC_URL`, and its body, if any, must be JSON (or WAV audio for speech).
 * An HTML form on another site can send neither, so it is refused with 403.
 */
export function requireSameOrigin(publicUrl: string): MiddlewareHandler {
	return async (c, next) => {
		if (SAFE_METHODS.has(c.req.method)) return next();

		if (c.req.header('Origin') !== publicUrl) {
			return errorResponse(c, 403, 'forbidden', 'Origin missing or not allowed');
		}
		const contentType = c.req.header('Content-Type')?.split(';')[0]?.trim().toLowerCase();
		const allowed = c.req.path.startsWith('/api/speech/') ? 'audio/wav' : 'application/json';
		if (contentType ? contentType !== allowed : hasBody(c.req.raw)) {
			return errorResponse(c, 403, 'forbidden', `Content-Type must be ${allowed}`);
		}
		return next();
	};
}

function hasBody(request: Request): boolean {
	const length = request.headers.get('Content-Length');
	return length ? Number(length) > 0 : request.headers.has('Transfer-Encoding');
}
