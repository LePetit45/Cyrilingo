import { hashPassword, verifyPassword } from '../auth/passwords.js';
import type { Db } from '../db/database.js';
import { listLinkedProviders } from '../db/oauth-accounts.js';
import type { OAuthProvider } from '../db/schema.js';
import { deleteOtherSessions, hasLiveSession } from '../db/sessions.js';
import { deleteUser, findUserById, setPasswordHash } from '../db/users.js';
import { checkPasswordLength } from './auth.js';
import { ServiceError } from './errors.js';

/** What the signed-in learner sees of their account. */
export interface Account {
	email: string;
	hasPassword: boolean;
	/** Sign-in providers linked to the account. */
	providers: OAuthProvider[];
	/** Whether the account has a live agent key for the MCP server (never the key itself). */
	hasAgentToken: boolean;
}

export interface AccountService {
	get(userId: string): Promise<Account>;
	/**
	 * Sets a password, or changes it: the current one is then required. Revokes every other
	 * session of the user, keeping `sessionId`, the one making the change.
	 */
	setPassword(
		userId: string,
		sessionId: string,
		passwords: { current?: string; next: string }
	): Promise<void>;
	/** Deletes the account and everything it owns. */
	remove(userId: string): Promise<void>;
}

export function createAccountService(db: Db, now: () => Date = () => new Date()): AccountService {
	async function findUser(userId: string) {
		const user = await findUserById(db, userId);
		if (!user) throw new ServiceError('not_found');
		return user;
	}

	return {
		async get(userId) {
			const user = await findUser(userId);
			return {
				email: user.email,
				hasPassword: user.passwordHash !== null,
				providers: await listLinkedProviders(db, userId),
				hasAgentToken: await hasLiveSession(db, userId, 'agent', now())
			};
		},

		async setPassword(userId, sessionId, { current, next }) {
			const user = await findUser(userId);
			if (
				user.passwordHash &&
				(current === undefined || !(await verifyPassword(user.passwordHash, current)))
			) {
				throw new ServiceError('wrong_password');
			}
			checkPasswordLength(next);
			await setPasswordHash(db, userId, await hashPassword(next));
			await deleteOtherSessions(db, userId, sessionId);
		},

		async remove(userId) {
			if (!(await deleteUser(db, userId))) throw new ServiceError('not_found');
		}
	};
}
