import type { Db } from './database.js';

export interface UserRow {
	id: string;
	email: string;
	emailVerified: boolean;
	passwordHash: string | null;
}

const columns = [
	'id',
	'email',
	'email_verified as emailVerified',
	'password_hash as passwordHash'
] as const;

export function findUserById(db: Db, id: string): Promise<UserRow | undefined> {
	return db.selectFrom('users').select(columns).where('id', '=', id).executeTakeFirst();
}

export function findUserByEmail(db: Db, email: string): Promise<UserRow | undefined> {
	return db.selectFrom('users').select(columns).where('email', '=', email).executeTakeFirst();
}

/** Inserts a user, or returns undefined when the e-mail is already taken. */
export function insertUser(
	db: Db,
	user: { email: string; emailVerified: boolean; passwordHash: string | null }
): Promise<UserRow | undefined> {
	return db
		.insertInto('users')
		.values({
			email: user.email,
			email_verified: user.emailVerified,
			password_hash: user.passwordHash
		})
		.onConflict((oc) => oc.column('email').doNothing())
		.returning(columns)
		.executeTakeFirst();
}

export async function setPasswordHash(db: Db, id: string, passwordHash: string): Promise<void> {
	await db.updateTable('users').set({ password_hash: passwordHash }).where('id', '=', id).execute();
}

/** Deletes a user; their sessions and everything else they own go with them (cascade). */
export async function deleteUser(db: Db, id: string): Promise<boolean> {
	const result = await db.deleteFrom('users').where('id', '=', id).executeTakeFirst();
	return result.numDeletedRows > 0n;
}
