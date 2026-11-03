import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Error codes the API answers with. The front end picks the sentence to show from the code; the
 * message is for developers only and is never shown to learners (SPEC.md › REST API).
 */
export type ErrorCode = 'not_found' | 'forbidden' | 'database_unavailable' | 'internal';

/** `{"error": {"code": "...", "message": "..."}}` with the given status. */
export function errorResponse(
	c: Context,
	status: ContentfulStatusCode,
	code: ErrorCode,
	message: string
) {
	return c.json({ error: { code, message } }, status);
}
