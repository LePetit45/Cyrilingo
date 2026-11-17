import { decodeIdToken, Google } from 'arctic';
import { z } from 'zod';

/** Who Google says the person is, once the ID token's claims were checked. */
export interface GoogleIdentity {
	/** Google's stable id for the person. */
	sub: string;
	email: string;
	/** Whether Google vouches that the person owns the address. */
	emailVerified: boolean;
}

/**
 * The OAuth plumbing of Google sign-in (SPEC.md › Google sign-in). Sessions stay ours: this only
 * builds the authorization URL and turns a code into a checked identity. Tests use
 * `FakeGoogleClient`; nothing else talks to Google.
 */
export interface GoogleClient {
	/** Where to send the browser: Google's consent page, with the state and the PKCE challenge. */
	authorizationUrl(state: string, codeVerifier: string): URL;
	/**
	 * Exchanges the code for tokens and checks the ID token's claims. Rejects when Google refuses
	 * the code or the verifier, does not answer in time, or sends claims that do not check out.
	 */
	exchange(code: string, codeVerifier: string): Promise<GoogleIdentity>;
}

/** A Google request still unanswered after this long fails the sign-in. */
export const GOOGLE_TIMEOUT_MS = 10_000;

const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

const claimsSchema = z.object({
	iss: z.string(),
	aud: z.union([z.string(), z.array(z.string())]),
	exp: z.number(),
	sub: z.string().min(1).max(255),
	email: z.email().max(254),
	email_verified: z.boolean()
});

/**
 * Checks the claims of an ID token: issuer, audience and expiry, and the fields we use. Its
 * signature is not checked: the token comes straight from Google's token endpoint over TLS, which
 * OpenID Connect Core § 3.1.3.7 accepts in place of the signature.
 */
export function checkIdTokenClaims(claims: unknown, clientId: string, now: Date): GoogleIdentity {
	const parsed = claimsSchema.safeParse(claims);
	if (!parsed.success) throw new Error('The ID token lacks a claim we need');
	const { iss, aud, exp, sub, email, email_verified } = parsed.data;
	if (!ISSUERS.includes(iss)) throw new Error('The ID token was not issued by Google');
	if (!(Array.isArray(aud) ? aud : [aud]).includes(clientId)) {
		throw new Error('The ID token is for another client');
	}
	if (exp * 1000 <= now.getTime()) throw new Error('The ID token has expired');
	return { sub, email, emailVerified: email_verified };
}

/** The real client, through Arctic. */
export function createGoogleClient(settings: {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}): GoogleClient {
	const google = new Google(settings.clientId, settings.clientSecret, settings.redirectUri);
	return {
		authorizationUrl(state, codeVerifier) {
			return google.createAuthorizationURL(state, codeVerifier, ['openid', 'email']);
		},

		async exchange(code, codeVerifier) {
			const tokens = await withTimeout(google.validateAuthorizationCode(code, codeVerifier));
			return checkIdTokenClaims(decodeIdToken(tokens.idToken()), settings.clientId, new Date());
		}
	};
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
	let timer: NodeJS.Timeout | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error('Google did not answer in time')), GOOGLE_TIMEOUT_MS);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
