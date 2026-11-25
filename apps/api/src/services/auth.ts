import { hashPassword, spendPasswordCheckTime, verifyPassword } from '../auth/passwords.js';
import { generateToken, hashToken } from '../auth/tokens.js';
import type { Db } from '../db/database.js';
import type { SessionKind } from '../db/schema.js';
import {
	deleteSession,
	deleteSessionsOfKind,
	findLiveSession,
	insertSession,
	setSessionExpiry
} from '../db/sessions.js';
import { findUserByEmail, insertUser } from '../db/users.js';
import { ServiceError } from './errors.js';
import type { IpLimit } from './ip-limits.js';

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
	/** Creates an account; `ip` counts toward the sign-up limit (AC-26). */
	signUp(email: string, password: string, ip: string): Promise<StartedSession>;
	signIn(email: string, password: string, ip: string): Promise<StartedSession>;
	signOut(token: string): Promise<void>;
	/**
	 * The user and session a token stands for, or null when it is unknown, expired or of another
	 * kind: a browser cookie is no agent token, and an agent token opens no browser session.
	 */
	authenticate(token: string, kind?: SessionKind): Promise<Authenticated | null>;
	/** Creates an agent token for the MCP server (AC-53): shown once, only its hash is stored. */
	createAgentToken(userId: string): Promise<StartedSession>;
	/** Revokes every agent token of the user (AC-53). */
	revokeAgentTokens(userId: string): Promise<void>;
}

export interface AuthDeps {
	db: Db;
	loginAttempts: IpLimit;
	signUps: IpLimit;
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

/**
 * Creates a browser session for a user and returns its token. Every way of signing in ends here,
 * so a password and Google give the same kind of session.
 */
export function startSession(db: Db, userId: string, now: Date): Promise<StartedSession> {
	return insertNewSession(db, userId, 'browser', now);
}

/** Creates a session of either kind; they live and renew alike (SPEC.md › Sessions). */
async function insertNewSession(
	db: Db,
	userId: string,
	kind: SessionKind,
	now: Date
): Promise<StartedSession> {
	const token = generateToken();
	const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
	await insertSession(db, { id: hashToken(token), userId, kind, expiresAt });
	return { token, expiresAt };
}

export function createAuthService({
	db,
	loginAttempts,
	signUps,
	now = () => new Date()
}: AuthDeps): AuthService {
	return {
		async signUp(email, password, ip) {
			if (signUps.isBlocked(ip, now())) throw new ServiceError('too_many_sign_ups');
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
			signUps.record(ip, now());
			return startSession(db, user.id, now());
		},

		async signIn(email, password, ip) {
			if (loginAttempts.isBlocked(ip, now())) throw new ServiceError('too_many_attempts');
			const user = await findUserByEmail(db, normalizeEmail(email));
			let valid = false;
			if (user?.passwordHash) valid = await verifyPassword(user.passwordHash, password);
			else await spendPasswordCheckTime(password);
			if (!user || !valid) {
				loginAttempts.record(ip, now());
				throw new ServiceError('invalid_credentials');
			}
			return startSession(db, user.id, now());
		},

		async signOut(token) {
			await deleteSession(db, hashToken(token));
		},

		async authenticate(token, kind = 'browser') {
			const at = now();
			const session = await findLiveSession(db, hashToken(token), at);
			if (!session || session.kind !== kind) return null;
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
		},

		createAgentToken(userId) {
			return insertNewSession(db, userId, 'agent', now());
		},

		async revokeAgentTokens(userId) {
			await deleteSessionsOfKind(db, userId, 'agent');
		}
	};
}
