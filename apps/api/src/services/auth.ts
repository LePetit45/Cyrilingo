import { hashPassword, spendPasswordCheckTime, verifyPassword } from '../auth/passwords.js';
import { generateToken, hashToken } from '../auth/tokens.js';
import type { Db } from '../db/database.js';
import type { SessionKind } from '../db/schema.js';
import { deleteSession, findLiveSession, insertSession, setSessionExpiry } from '../db/sessions.js';
import { findUserByEmail, insertUser } from '../db/users.js';
import { ServiceError } from './errors.js';
import type { LoginAttempts } from './login-attempts.js';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A session lasts 30 days… */
export const SESSION_LIFETIME_MS = 30 * DAY_MS;
/** …and is renewed for 30 more when used during its last 15. */
export const SESSION_RENEWAL_MS = 15 * DAY_MS;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** A new session: the token goes to the client once, only its hash is stored. */
export interface StartedSession {
	token: string;
	expiresAt: Date;
}

/** Who a valid token belongs to. `renewedUntil` is set when this use extended the session. */
export interface Authenticated {
	userId: string;
	sessionId: string;
	kind: SessionKind;
	renewedUntil?: Date;
}

export interface AuthService {
	signUp(email: string, password: string): Promise<StartedSession>;
	signIn(email: string, password: string, ip: string): Promise<StartedSession>;
	signOut(token: string): Promise<void>;
	/** The user and session a token stands for, or null when it is unknown or expired. */
	authenticate(token: string): Promise<Authenticated | null>;
}

export interface AuthDeps {
	db: Db;
	loginAttempts: LoginAttempts;
	now?: () => Date;
}

/** E-mails are compared lowercased and trimmed (SPEC.md › Local accounts). */
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/** Refuses a password outside 8 to 128 characters (counted as Unicode code points). */
export function checkPasswordLength(password: string): void {
	const length = [...password].length;
	if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
		throw new ServiceError('invalid_password');
	}
}

export function createAuthService({
	db,
	loginAttempts,
	now = () => new Date()
}: AuthDeps): AuthService {
	/** Creates a session for a user and returns its token; Google sign-in will end here too. */
	async function startSession(userId: string): Promise<StartedSession> {
		const token = generateToken();
		const expiresAt = new Date(now().getTime() + SESSION_LIFETIME_MS);
		await insertSession(db, { id: hashToken(token), userId, kind: 'browser', expiresAt });
		return { token, expiresAt };
	}

	return {
		async signUp(email, password) {
			checkPasswordLength(password);
			const normalized = normalizeEmail(email);
			const user = await insertUser(db, {
				email: normalized,
				emailVerified: false,
				passwordHash: await hashPassword(password)
			});
			if (!user) {
				const existing = await findUserByEmail(db, normalized);
				throw new ServiceError(existing?.passwordHash ? 'email_taken' : 'email_taken_google');
			}
			return startSession(user.id);
		},

		async signIn(email, password, ip) {
			if (loginAttempts.isBlocked(ip, now())) throw new ServiceError('too_many_attempts');
			const user = await findUserByEmail(db, normalizeEmail(email));
			let valid = false;
			if (user?.passwordHash) valid = await verifyPassword(user.passwordHash, password);
			else await spendPasswordCheckTime(password);
			if (!user || !valid) {
				loginAttempts.recordFailure(ip, now());
				throw new ServiceError('invalid_credentials');
			}
			return startSession(user.id);
		},

		async signOut(token) {
			await deleteSession(db, hashToken(token));
		},

		async authenticate(token) {
			const at = now();
			const session = await findLiveSession(db, hashToken(token), at);
			if (!session) return null;
			const authenticated: Authenticated = {
				userId: session.userId,
				sessionId: session.id,
				kind: session.kind
			};
			if (session.expiresAt.getTime() - at.getTime() < SESSION_RENEWAL_MS) {
				authenticated.renewedUntil = new Date(at.getTime() + SESSION_LIFETIME_MS);
				await setSessionExpiry(db, session.id, authenticated.renewedUntil);
			}
			return authenticated;
		}
	};
}
