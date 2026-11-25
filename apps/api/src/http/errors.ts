import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ServiceErrorCode } from '../services/errors.js';

/**
 * Error codes the API answers with. The front end picks the sentence to show from the code; the
 * message is for developers only and is never shown to learners (SPEC.md › REST API).
 */
export type ErrorCode =
	| ServiceErrorCode
	| 'unauthenticated'
	| 'invalid_input'
	| 'payload_too_large'
	| 'forbidden'
	| 'database_unavailable'
	| 'internal';

/** `{"error": {"code": "...", "message": "..."}}` with the given status. */
export function errorResponse(
	c: Context,
	status: ContentfulStatusCode,
	code: ErrorCode,
	message: string
) {
	return c.json({ error: { code, message } }, status);
}

/** The HTTP answer to each refusal of a service. */
export const SERVICE_ERRORS: Record<
	ServiceErrorCode,
	{ status: ContentfulStatusCode; message: string }
> = {
	invalid_credentials: { status: 401, message: 'Wrong e-mail or password' },
	email_taken: { status: 409, message: 'An account already uses this e-mail' },
	email_taken_google: {
		status: 409,
		message: 'An account already uses this e-mail and signs in with Google'
	},
	invalid_password: { status: 400, message: 'The password must have 8 to 128 characters' },
	wrong_password: { status: 400, message: 'The current password is wrong' },
	google_failed: { status: 400, message: 'Google sign-in failed' },
	google_unverified: { status: 403, message: 'Google has not verified this e-mail' },
	too_many_attempts: { status: 429, message: 'Too many failed sign-ins, try again later' },
	too_many_sign_ups: {
		status: 429,
		message: 'Too many sign-ups from this address, try again later'
	},
	unknown_lesson: { status: 400, message: 'No lesson has this id' },
	invalid_list_name: { status: 400, message: 'A list name has 1 to 40 characters' },
	list_limit_reached: { status: 409, message: 'An account has at most 20 word lists' },
	unknown_word: { status: 400, message: 'The corpus has no such word' },
	word_already_in_list: { status: 409, message: 'The list already has this word' },
	list_full: { status: 409, message: 'A list holds at most 200 words' },
	speech_quota_reached: { status: 429, message: 'Too many read-aloud tries in the last 24 hours' },
	not_found: { status: 404, message: 'Not found' }
};
