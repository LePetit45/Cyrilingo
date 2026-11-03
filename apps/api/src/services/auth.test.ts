import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, inject, it } from 'vitest';
import { hashToken } from '../auth/tokens.js';
import { createDb } from '../db/database.js';
import { createAccountService } from './account.js';
import { createAuthService, SESSION_LIFETIME_MS } from './auth.js';
import { ServiceError } from './errors.js';
import { createLoginAttempts, FAILED_SIGN_IN_WINDOW_MS } from './login-attempts.js';

const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

const DAY_MS = 24 * 60 * 60 * 1000;
let clock: Date;
let auth: ReturnType<typeof createAuthService>;
const account = createAccountService(db);

beforeEach(() => {
	clock = new Date('2026-11-03T12:00:00Z');
	auth = createAuthService({ db, loginAttempts: createLoginAttempts(), now: () => clock });
});

const newEmail = () => `learner-${randomUUID()}@example.com`;
const PASSWORD = 'correct horse battery';

const userRow = (email: string) =>
	db.selectFrom('users').selectAll().where('email', '=', email).executeTakeFirstOrThrow();
const sessionsOf = (userId: string) =>
	db.selectFrom('sessions').selectAll().where('user_id', '=', userId).execute();

/** The code a promise rejects with, as a `ServiceError`. */
async function refusal(promise: Promise<unknown>) {
	const error = await promise.then(
		() => undefined,
		(reason: unknown) => reason
	);
	expect(error).toBeInstanceOf(ServiceError);
	return (error as ServiceError).code;
}

describe('sign-up', () => {
	it('[AC-10] creates a user with an argon2id hash and no clear password, and starts a session', async () => {
		const email = newEmail();
		const session = await auth.signUp(`  ${email.toUpperCase()} `, PASSWORD);

		const user = await userRow(email);
		expect(user.email_verified).toBe(false);
		expect(user.password_hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
		expect(user.password_hash).not.toContain(PASSWORD);
		expect(await sessionsOf(user.id)).toEqual([
			expect.objectContaining({ id: hashToken(session.token), kind: 'browser' })
		]);
	});

	it('[AC-10] accepts passwords of 8 to 128 characters only', async () => {
		expect(await refusal(auth.signUp(newEmail(), 'a'.repeat(7)))).toBe('invalid_password');
		expect(await refusal(auth.signUp(newEmail(), 'a'.repeat(129)))).toBe('invalid_password');
		await expect(auth.signUp(newEmail(), 'a'.repeat(8))).resolves.toBeDefined();
		await expect(auth.signUp(newEmail(), 'é'.repeat(128))).resolves.toBeDefined();
	});

	it('[AC-12] refuses an e-mail that already has an account, whatever its case', async () => {
		const email = newEmail();
		await auth.signUp(email, PASSWORD);
		expect(await refusal(auth.signUp(email.toUpperCase(), 'another password'))).toBe('email_taken');
	});

	it('[AC-12] tells when the existing account signs in with Google only', async () => {
		const email = newEmail();
		await db.insertInto('users').values({ email, email_verified: true }).execute();
		expect(await refusal(auth.signUp(email, PASSWORD))).toBe('email_taken_google');
	});
});

describe('sign-in', () => {
	it('starts a new session with the right password', async () => {
		const email = newEmail();
		await auth.signUp(email, PASSWORD);
		const session = await auth.signIn(email.toUpperCase(), PASSWORD, '203.0.113.1');
		expect(await auth.authenticate(session.token)).toMatchObject({ kind: 'browser' });
	});

	it('[AC-11] gives the same refusal for an unknown e-mail and a wrong password', async () => {
		const email = newEmail();
		await auth.signUp(email, PASSWORD);
		expect(await refusal(auth.signIn(newEmail(), PASSWORD, '203.0.113.1'))).toBe(
			'invalid_credentials'
		);
		expect(await refusal(auth.signIn(email, 'wrong password', '203.0.113.1'))).toBe(
			'invalid_credentials'
		);
	});

	it('[AC-11] refuses an account without a password like a wrong password', async () => {
		const email = newEmail();
		await db.insertInto('users').values({ email, email_verified: true }).execute();
		expect(await refusal(auth.signIn(email, PASSWORD, '203.0.113.1'))).toBe('invalid_credentials');
	});

	it('[AC-20] refuses an 11th sign-in after 10 failures from one IP within 15 minutes', async () => {
		const email = newEmail();
		await auth.signUp(email, PASSWORD);
		for (let attempt = 0; attempt < 10; attempt++) {
			expect(await refusal(auth.signIn(email, 'wrong password', '203.0.113.7'))).toBe(
				'invalid_credentials'
			);
		}
		// Even the right password is refused now, from that IP only.
		expect(await refusal(auth.signIn(email, PASSWORD, '203.0.113.7'))).toBe('too_many_attempts');
		await expect(auth.signIn(email, PASSWORD, '203.0.113.8')).resolves.toBeDefined();

		clock = new Date(clock.getTime() + FAILED_SIGN_IN_WINDOW_MS + 1);
		await expect(auth.signIn(email, PASSWORD, '203.0.113.7')).resolves.toBeDefined();
	});
});

describe('sessions', () => {
	it('[AC-13] uses a random token whose SHA-256 hash only is stored, valid for 30 days', async () => {
		const email = newEmail();
		const first = await auth.signUp(email, PASSWORD);
		const second = await auth.signIn(email, PASSWORD, '203.0.113.1');
		expect(first.token).not.toBe(second.token);
		expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(first.expiresAt).toEqual(new Date(clock.getTime() + SESSION_LIFETIME_MS));

		const { id: userId } = await userRow(email);
		const ids = (await sessionsOf(userId)).map((session) => session.id);
		expect(ids.sort()).toEqual([hashToken(first.token), hashToken(second.token)].sort());
		expect(ids).not.toContain(first.token);
	});

	it('[AC-13] refuses an expired session', async () => {
		const { token } = await auth.signUp(newEmail(), PASSWORD);
		clock = new Date(clock.getTime() + SESSION_LIFETIME_MS + 1);
		expect(await auth.authenticate(token)).toBeNull();
		expect(await auth.authenticate('not a token')).toBeNull();
	});

	it('renews a session used during its last 15 days, not before', async () => {
		const { token } = await auth.signUp(newEmail(), PASSWORD);
		clock = new Date(clock.getTime() + 14 * DAY_MS);
		expect((await auth.authenticate(token))?.renewedUntil).toBeUndefined();

		clock = new Date(clock.getTime() + 2 * DAY_MS);
		const renewed = await auth.authenticate(token);
		expect(renewed?.renewedUntil).toEqual(new Date(clock.getTime() + SESSION_LIFETIME_MS));
		clock = new Date(clock.getTime() + 20 * DAY_MS);
		expect(await auth.authenticate(token)).not.toBeNull();
	});

	it('[AC-13] deletes the session at sign-out', async () => {
		const { token } = await auth.signUp(newEmail(), PASSWORD);
		await auth.signOut(token);
		expect(await auth.authenticate(token)).toBeNull();
		expect(
			await db.selectFrom('sessions').where('id', '=', hashToken(token)).selectAll().execute()
		).toEqual([]);
	});
});

describe('account', () => {
	it('describes the account', async () => {
		const email = newEmail();
		const { token } = await auth.signUp(email, PASSWORD);
		const { userId } = (await auth.authenticate(token))!;
		expect(await account.get(userId)).toEqual({ email, hasPassword: true, providers: [] });
	});

	it('[AC-18] changes the password with the current one, and revokes the other sessions', async () => {
		const email = newEmail();
		const current = await auth.signUp(email, PASSWORD);
		const other = await auth.signIn(email, PASSWORD, '203.0.113.1');
		const { userId, sessionId } = (await auth.authenticate(current.token))!;

		expect(await refusal(account.setPassword(userId, sessionId, { next: 'new password' }))).toBe(
			'wrong_password'
		);
		expect(
			await refusal(
				account.setPassword(userId, sessionId, { current: 'wrong password', next: 'new password' })
			)
		).toBe('wrong_password');
		expect(
			await refusal(account.setPassword(userId, sessionId, { current: PASSWORD, next: 'short' }))
		).toBe('invalid_password');
		expect(await auth.authenticate(other.token)).not.toBeNull();

		await account.setPassword(userId, sessionId, { current: PASSWORD, next: 'new password' });
		expect(await auth.authenticate(current.token)).not.toBeNull();
		expect(await auth.authenticate(other.token)).toBeNull();
		expect(await refusal(auth.signIn(email, PASSWORD, '203.0.113.2'))).toBe('invalid_credentials');
		await expect(auth.signIn(email, 'new password', '203.0.113.2')).resolves.toBeDefined();
	});

	it('[AC-18] sets a first password without asking for a current one', async () => {
		const email = newEmail();
		const user = await db
			.insertInto('users')
			.values({ email, email_verified: true })
			.returning('id')
			.executeTakeFirstOrThrow();
		await account.setPassword(user.id, hashToken('no session'), { next: 'first password' });
		expect(await account.get(user.id)).toMatchObject({ hasPassword: true });
		await expect(auth.signIn(email, 'first password', '203.0.113.3')).resolves.toBeDefined();
	});

	it('[AC-19] deletes the user and their sessions', async () => {
		const email = newEmail();
		const { token } = await auth.signUp(email, PASSWORD);
		const { userId } = (await auth.authenticate(token))!;
		await account.remove(userId);
		expect(await db.selectFrom('users').where('id', '=', userId).selectAll().execute()).toEqual([]);
		expect(await sessionsOf(userId)).toEqual([]);
		expect(await refusal(account.get(userId))).toBe('not_found');
		expect(await refusal(account.remove(userId))).toBe('not_found');
	});
});
