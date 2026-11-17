import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, inject, it } from 'vitest';
import type { GoogleIdentity } from '../auth/google.js';
import { FakeGoogleClient } from '../auth/google-testing.js';
import { createDb } from '../db/database.js';
import { createAccountService } from './account.js';
import { createAuthService } from './auth.js';
import { ServiceError } from './errors.js';
import { createGoogleAuthService, type GoogleAuthService } from './google-auth.js';
import { createLoginAttempts } from './login-attempts.js';
import { createProgressService } from './progress.js';

const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

const clock = new Date('2026-11-17T12:00:00Z');
const auth = createAuthService({ db, loginAttempts: createLoginAttempts(), now: () => clock });
const account = createAccountService(db);
const progress = createProgressService(db, () => clock);

let fake: FakeGoogleClient;
let google: GoogleAuthService;

beforeEach(() => {
	fake = new FakeGoogleClient();
	google = createGoogleAuthService(db, fake, () => clock);
});

const newEmail = () => `learner-${randomUUID()}@example.com`;
const identity = (email: string, emailVerified = true): GoogleIdentity => ({
	sub: `google-${randomUUID()}`,
	email,
	emailVerified
});
const PASSWORD = 'correct horse battery';

/** The whole round trip: start, consent on Google's page as `person`, callback. */
function signInAs(person: GoogleIdentity) {
	const { state, codeVerifier } = google.start();
	const code = fake.consent(person);
	return google.finish({ code, state, expectedState: state, codeVerifier });
}

const usersWith = (email: string) =>
	db.selectFrom('users').selectAll().where('email', '=', email).execute();
const sessionsOf = (userId: string) =>
	db.selectFrom('sessions').selectAll().where('user_id', '=', userId).execute();
const linksOf = (userId: string) =>
	db.selectFrom('oauth_accounts').selectAll().where('user_id', '=', userId).execute();

/** The code a promise rejects with, as a `ServiceError`. */
async function refusal(promise: Promise<unknown>) {
	const error = await promise.then(
		() => undefined,
		(reason: unknown) => reason
	);
	expect(error).toBeInstanceOf(ServiceError);
	return (error as ServiceError).code;
}

describe('the callback checks', () => {
	it('[AC-14] refuses a callback whose state does not match the one kept by the browser', async () => {
		const { codeVerifier } = google.start();
		const { state } = google.start();
		const code = fake.consent(identity(newEmail()));
		const finish = (expectedState: string | undefined) =>
			google.finish({ code, state, expectedState, codeVerifier });

		expect(await refusal(finish('another state'))).toBe('google_failed');
		expect(await refusal(finish(undefined))).toBe('google_failed');
	});

	it('[AC-14] refuses a code exchanged with another PKCE verifier', async () => {
		const { state } = google.start();
		const code = fake.consent(identity(newEmail()));
		const other = google.start().codeVerifier;
		expect(
			await refusal(google.finish({ code, state, expectedState: state, codeVerifier: other }))
		).toBe('google_failed');
	});

	it('[AC-14] refuses a callback without code or verifier', async () => {
		const { state, codeVerifier } = google.start();
		expect(
			await refusal(google.finish({ code: undefined, state, expectedState: state, codeVerifier }))
		).toBe('google_failed');
		expect(
			await refusal(
				google.finish({ code: 'code', state, expectedState: state, codeVerifier: undefined })
			)
		).toBe('google_failed');
	});

	it('fails the sign-in when Google cannot be reached', async () => {
		fake.failing = true;
		expect(await refusal(signInAs(identity(newEmail())))).toBe('google_failed');
	});

	it('starts with a fresh random state and verifier each time', () => {
		const first = google.start();
		const second = google.start();
		expect(first.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(first.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(second.state).not.toBe(first.state);
		expect(second.codeVerifier).not.toBe(first.codeVerifier);
		expect(first.url.searchParams.get('state')).toBe(first.state);
	});
});

describe('one person, one account', () => {
	it('creates a verified account without a password for a new person, linked to Google', async () => {
		const email = newEmail();
		const { session, passwordRemoved } = await signInAs(identity(email.toUpperCase()));

		const [user] = await usersWith(email);
		expect(user).toMatchObject({ email_verified: true, password_hash: null });
		expect(passwordRemoved).toBe(false);
		expect(await auth.authenticate(session.token)).toMatchObject({ userId: user!.id });
		expect(await account.get(user!.id)).toEqual({
			email,
			hasPassword: false,
			providers: ['google']
		});
	});

	it('signs a linked identity into its user, even after its e-mail changed at Google', async () => {
		const person = identity(newEmail());
		const first = await signInAs(person);
		const userId = (await auth.authenticate(first.session.token))!.userId;

		const again = await signInAs({ ...person, email: newEmail() });
		expect(await auth.authenticate(again.session.token)).toMatchObject({ userId });
		expect(await linksOf(userId)).toHaveLength(1);
	});

	it('[AC-15] signs into the existing user with the same verified e-mail: same id, same progress, no second row', async () => {
		const email = newEmail();
		const local = await auth.signUp(email, PASSWORD);
		const userId = (await auth.authenticate(local.token))!.userId;
		await progress.merge(userId, { completedLessons: ['l1', 'l2'], examPassed: false });

		const { session } = await signInAs(identity(email));

		expect(await auth.authenticate(session.token)).toMatchObject({ userId });
		expect(await usersWith(email)).toHaveLength(1);
		expect(await progress.get(userId)).toEqual({
			completedLessons: ['l1', 'l2'],
			examPassed: false
		});
		expect(await linksOf(userId)).toEqual([
			expect.objectContaining({ provider: 'google', user_id: userId })
		]);
	});

	it('[AC-15] keeps the password and sessions of a user whose e-mail was already verified', async () => {
		const email = newEmail();
		await signInAs(identity(email));
		const [user] = await usersWith(email);
		await account.setPassword(user!.id, 'none', { next: PASSWORD });
		const before = await auth.signIn(email, PASSWORD, '203.0.113.7');

		// A second Google identity with the same verified address.
		const { passwordRemoved } = await signInAs(identity(email));
		expect(passwordRemoved).toBe(false);
		expect(await auth.authenticate(before.token)).not.toBeNull();
		expect((await usersWith(email))[0]?.password_hash).not.toBeNull();
	});

	it('[AC-16] neither creates nor links an account for an e-mail Google has not verified', async () => {
		const email = newEmail();
		expect(await refusal(signInAs(identity(email, false)))).toBe('google_unverified');
		expect(await usersWith(email)).toEqual([]);

		await auth.signUp(email, PASSWORD);
		expect(await refusal(signInAs(identity(email, false)))).toBe('google_unverified');
		const [user] = await usersWith(email);
		expect(await linksOf(user!.id)).toEqual([]);
		expect(user!.password_hash).not.toBeNull();
	});

	it('[AC-17] removes the password of a never-verified local account and revokes its other sessions', async () => {
		const email = newEmail();
		const local = await auth.signUp(email, PASSWORD);
		const userId = (await auth.authenticate(local.token))!.userId;

		const { session, passwordRemoved } = await signInAs(identity(email));

		expect(passwordRemoved).toBe(true);
		expect(await auth.authenticate(local.token)).toBeNull();
		expect(await sessionsOf(userId)).toHaveLength(1);
		expect(await auth.authenticate(session.token)).toMatchObject({ userId });
		const [user] = await usersWith(email);
		expect(user).toMatchObject({ email_verified: true, password_hash: null });
		expect(await refusal(auth.signIn(email, PASSWORD, '203.0.113.8'))).toBe('invalid_credentials');
	});
});
