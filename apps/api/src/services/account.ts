import { hashPassword, verifyPassword } from '../auth/passwords.js';
import type { Db } from '../db/database.js';
import { deleteOtherSessions } from '../db/sessions.js';
import { deleteUser, findUserById, setPasswordHash } from '../db/users.js';
import { checkPasswordLength } from './auth.js';
import { ServiceError } from './errors.js';

/** What the signed-in learner sees of their account. */
export interface Account {
	email: string;
	hasPassword: boolean;
	/** Sign-in providers linked to the account; Google comes with its own pull request. */
	providers: 'google'[];
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

export function createAccountService(db: Db): AccountService {
	async function findUser(userId: string) {
		const user = await findUserById(db, userId);
		if (!user) throw new ServiceError('not_found');
		return user;
	}

	return {
		async get(userId) {
			const user = await findUser(userId);
			return { email: user.email, hasPassword: user.passwordHash !== null, providers: [] };
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
