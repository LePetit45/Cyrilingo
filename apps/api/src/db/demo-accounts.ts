import { randomBytes } from 'node:crypto';
import type { Db } from './database.js';
import { findUserByEmail, insertUser } from './users.js';

/** The demo accounts of development (SPEC.md › Data model). `.test` is a reserved domain. */
export const DEMO_EMAILS = ['ana@demo.test', 'boris@demo.test'] as const;

/**
 * Creates the demo accounts that do not exist yet, each with a new random password, and returns
 * those passwords: only their hash is stored, so this is the one time they can be shown.
 * Development only; never run in production.
 */
export async function seedDemoAccounts(
	db: Db,
	hashPassword: (password: string) => Promise<string>
): Promise<{ email: string; password: string }[]> {
	const created = [];
	for (const email of DEMO_EMAILS) {
		if (await findUserByEmail(db, email)) continue;
		const password = randomBytes(12).toString('base64url');
		await insertUser(db, {
			email,
			emailVerified: false,
			passwordHash: await hashPassword(password)
		});
		created.push({ email, password });
	}
	return created;
}
