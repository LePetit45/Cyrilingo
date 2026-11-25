/**
 * What a service refuses, as a code. The HTTP routes (and later the MCP tools) map each code to
 * their own error; the front end picks the sentence to show from it.
 */
export type ServiceErrorCode =
	/** Sign-in with an unknown e-mail or a wrong password: one code for both. */
	| 'invalid_credentials'
	/** Sign-up with an e-mail that has an account with a password. */
	| 'email_taken'
	/** Sign-up with an e-mail whose account signs in with Google only. */
	| 'email_taken_google'
	/** A password shorter than 8 or longer than 128 characters. */
	| 'invalid_password'
	/** The current password given to change it is wrong. */
	| 'wrong_password'
	/** Google sign-in failed: state or verifier mismatch, code refused, Google unreachable. */
	| 'google_failed'
	/** The Google identity's e-mail is not verified by Google. */
	| 'google_unverified'
	/** Too many failed sign-ins from one IP. */
	| 'too_many_attempts'
	/** Too many accounts created from one IP. */
	| 'too_many_sign_ups'
	/** Progress naming a lesson the course does not have. */
	| 'unknown_lesson'
	/** A word list name that is empty or longer than 40 characters, once trimmed. */
	| 'invalid_list_name'
	/** A 21st word list. */
	| 'list_limit_reached'
	/** A word the corpus does not have (syllables are not words). */
	| 'unknown_word'
	/** A word the list already holds. */
	| 'word_already_in_list'
	/** A 201st word in a list. */
	| 'list_full'
	/** A user's read-aloud try beyond their limit. */
	| 'speech_quota_reached'
	/** Missing, or owned by somebody else: the same answer for both. */
	| 'not_found';

export class ServiceError extends Error {
	override name = 'ServiceError';

	constructor(readonly code: ServiceErrorCode) {
		super(code);
	}
}
