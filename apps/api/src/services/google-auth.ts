import type { GoogleClient, GoogleIdentity } from '../auth/google.js';
import { generateToken } from '../auth/tokens.js';
import type { Db } from '../db/database.js';
import { findLinkedUserId, linkIdentity } from '../db/oauth-accounts.js';
import { deleteAllSessions } from '../db/sessions.js';
import { findUserByEmail, insertUser, markVerifiedWithoutPassword } from '../db/users.js';
import { normalizeEmail, startSession, type StartedSession } from './auth.js';
import { ServiceError } from './errors.js';

/** What the browser must keep, in short-lived cookies, until Google sends it back. */
export interface GoogleStart {
	url: URL;
	state: string;
	codeVerifier: string;
}

/** What came back to the callback, and what the browser had kept. */
export interface GoogleCallback {
	code: string | undefined;
	state: string | undefined;
	expectedState: string | undefined;
	codeVerifier: string | undefined;
}

export interface GoogleSignIn {
	session: StartedSession;
	/** The account was a local one whose password was removed: the learner must be told. */
	passwordRemoved: boolean;
}

export interface GoogleAuthService {
	start(): GoogleStart;
	/** Checks the callback, then signs into the one account of that person (SPEC.md › Auth). */
	finish(callback: GoogleCallback): Promise<GoogleSignIn>;
}

export function createGoogleAuthService(
	db: Db,
	client: GoogleClient,
	now: () => Date = () => new Date()
): GoogleAuthService {
	return {
		start() {
			// 256 random bits each; base64url, so the verifier fits PKCE's 43 to 128 characters.
			const state = generateToken();
			const codeVerifier = generateToken();
			return { url: client.authorizationUrl(state, codeVerifier), state, codeVerifier };
		},

		async finish({ code, state, expectedState, codeVerifier }) {
			// The state proves this browser started the sign-in (no login CSRF); the verifier, sent
			// to Google with the code, proves the code was issued for it (PKCE).
			if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
				throw new ServiceError('google_failed');
			}
			let identity: GoogleIdentity;
			try {
				identity = await client.exchange(code, codeVerifier);
			} catch {
				throw new ServiceError('google_failed');
			}
			if (!identity.emailVerified) throw new ServiceError('google_unverified');

			return db.transaction().execute(async (trx) => {
				const { userId, passwordRemoved } = await findOrLinkUser(trx, identity);
				return { session: await startSession(trx, userId, now()), passwordRemoved };
			});
		}
	};
}

/** One person, one account (SPEC.md › One person, one account), in its three cases. */
async function findOrLinkUser(
	db: Db,
	identity: GoogleIdentity
): Promise<{ userId: string; passwordRemoved: boolean }> {
	const linked = await findLinkedUserId(db, 'google', identity.sub);
	if (linked) return { userId: linked, passwordRemoved: false };

	const email = normalizeEmail(identity.email);
	const existing = await findUserByEmail(db, email);
	if (existing) {
		await linkIdentity(db, {
			provider: 'google',
			providerUserId: identity.sub,
			userId: existing.id
		});
		if (existing.emailVerified) return { userId: existing.id, passwordRemoved: false };
		// Nobody ever proved owning this address: whoever created the account may not be the person
		// Google vouches for ("pre-hijacking"). Their password and sessions go.
		await markVerifiedWithoutPassword(db, existing.id);
		await deleteAllSessions(db, existing.id);
		return { userId: existing.id, passwordRemoved: existing.passwordHash !== null };
	}

	const created = await insertUser(db, { email, emailVerified: true, passwordHash: null });
	// Somebody signed up with this e-mail at the same instant: let them try again.
	if (!created) throw new ServiceError('google_failed');
	await linkIdentity(db, { provider: 'google', providerUserId: identity.sub, userId: created.id });
	return { userId: created.id, passwordRemoved: false };
}
