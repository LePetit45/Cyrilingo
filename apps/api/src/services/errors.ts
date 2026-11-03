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
	/** Too many failed sign-ins from one IP. */
	| 'too_many_attempts'
	/** Missing, or owned by somebody else: the same answer for both. */
	| 'not_found';

export class ServiceError extends Error {
	override name = 'ServiceError';

	constructor(readonly code: ServiceErrorCode) {
		super(code);
	}
}
