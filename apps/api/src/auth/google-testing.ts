// A stand-in for Google in the tests (SPEC.md › Tests and coverage). Test code only.
import type { GoogleClient, GoogleIdentity } from './google.js';

/**
 * Plays Google's part: `consent` stands for the person agreeing on Google's page, and gives the
 * code Google would put in the callback. Like Google, `exchange` accepts a code once, and only
 * with the verifier whose challenge went into the authorization URL (PKCE).
 */
export class FakeGoogleClient implements GoogleClient {
	#lastVerifier: string | undefined;
	#codes = new Map<string, { identity: GoogleIdentity; verifier: string }>();
	#next = 0;
	/** Set to make the next exchanges fail, as when Google is down. */
	failing = false;

	authorizationUrl(state: string, codeVerifier: string): URL {
		this.#lastVerifier = codeVerifier;
		const url = new URL('https://accounts.google.test/o/oauth2/v2/auth');
		url.searchParams.set('state', state);
		return url;
	}

	/** The code for `identity`, bound to the verifier of the last authorization URL. */
	consent(identity: GoogleIdentity): string {
		if (!this.#lastVerifier) throw new Error('No authorization URL was built');
		const code = `code-${this.#next++}`;
		this.#codes.set(code, { identity, verifier: this.#lastVerifier });
		return code;
	}

	async exchange(code: string, codeVerifier: string): Promise<GoogleIdentity> {
		const grant = this.#codes.get(code);
		this.#codes.delete(code);
		if (this.failing) throw new Error('Google is unreachable');
		if (!grant || grant.verifier !== codeVerifier) throw new Error('invalid_grant');
		return grant.identity;
	}
}
