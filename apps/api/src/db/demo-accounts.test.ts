import { afterAll, describe, expect, inject, it } from 'vitest';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import { createDb } from './database.js';
import { DEMO_EMAILS, seedDemoAccounts } from './demo-accounts.js';
import { findUserByEmail } from './users.js';

const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

describe('seedDemoAccounts', () => {
	it('creates each demo account once, with a random password returned only then', async () => {
		const created = await seedDemoAccounts(db, hashPassword);
		expect(created.map((account) => account.email)).toEqual([...DEMO_EMAILS]);
		const [first, second] = created;
		expect(first!.password).not.toBe(second!.password);
		expect(first!.password).toMatch(/^[A-Za-z0-9_-]{16}$/);

		const user = await findUserByEmail(db, first!.email);
		expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
		expect(await verifyPassword(user!.passwordHash!, first!.password)).toBe(true);

		expect(await seedDemoAccounts(db, hashPassword)).toEqual([]);
	});
});
