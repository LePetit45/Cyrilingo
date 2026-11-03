import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '#lib/api/client.js';
import { ACCOUNT, fakeApi } from '#lib/api/testing.js';
import { AccountState } from './account.svelte.js';
import { memoryCopy, memoryStore } from './testing.js';
import { ProgressSync } from './progress-sync.svelte.js';

/** An account on a device whose progress copy is `copy`. */
function newAccount(api: ApiClient, copy = memoryCopy()) {
	return new AccountState(api, new ProgressSync(api, copy, memoryStore()));
}

// localStorage as in a browser, emptied before each test.
const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
	getItem: (key: string) => storage.get(key) ?? null,
	setItem: (key: string, value: string) => void storage.set(key, value),
	removeItem: (key: string) => void storage.delete(key)
});
beforeEach(() => storage.clear());

/** A device that signed in earlier, as the app finds it at start. */
function signedInDevice() {
	storage.set('cyrilingo.account.v1', JSON.stringify({ email: ACCOUNT.email }));
}

describe('AccountState', () => {
	it('[AC-8] never calls the API on a guest device', async () => {
		const api = fakeApi();
		const account = newAccount(api);
		expect(account.signedIn).toBe(false);
		expect(await account.refresh()).toBeUndefined();
		expect(api.getAccount).not.toHaveBeenCalled();
	});

	it('remembers the account after signing in, and loads it', async () => {
		const account = newAccount(fakeApi());
		const result = await account.signIn(' Ana@Example.com ', 'a password');
		expect(result.ok).toBe(true);
		expect(account.signedIn).toBe(true);
		expect(account.details).toEqual(ACCOUNT);
		expect(newAccount(fakeApi()).email).toBe(ACCOUNT.email);
	});

	it('stays a guest when signing up is refused', async () => {
		const account = newAccount(
			fakeApi({ signUp: vi.fn(async () => ({ ok: false, error: 'email_taken' }) as const) })
		);
		expect(await account.signUp(ACCOUNT.email, 'a password')).toEqual({
			ok: false,
			error: 'email_taken'
		});
		expect(account.signedIn).toBe(false);
		expect(storage.size).toBe(0);
	});

	it('knows a device that signed in before, offline included', async () => {
		signedInDevice();
		const offline = fakeApi({
			getAccount: vi.fn(async () => ({ ok: false, error: 'network' }) as const)
		});
		const account = newAccount(offline);
		expect(account.email).toBe(ACCOUNT.email);
		await account.refresh();
		expect(account.signedIn).toBe(true);
	});

	it('signs out a device whose session ended', async () => {
		signedInDevice();
		const account = newAccount(
			fakeApi({ getAccount: vi.fn(async () => ({ ok: false, error: 'unauthenticated' }) as const) })
		);
		await account.refresh();
		expect(account.signedIn).toBe(false);
		expect(storage.size).toBe(0);
	});

	it('forgets the account when signing out, but not when the API cannot be reached', async () => {
		signedInDevice();
		const offline = newAccount(
			fakeApi({ signOut: vi.fn(async () => ({ ok: false, error: 'network' }) as const) })
		);
		expect(await offline.signOut()).toEqual({ ok: false, error: 'network' });
		expect(offline.signedIn).toBe(true);

		const online = newAccount(fakeApi());
		expect(await online.signOut()).toEqual({ ok: true, value: undefined });
		expect(online.signedIn).toBe(false);
		expect(storage.size).toBe(0);
	});

	it('forgets the account once deleted', async () => {
		signedInDevice();
		const account = newAccount(fakeApi());
		expect((await account.deleteAccount()).ok).toBe(true);
		expect(account.signedIn).toBe(false);
	});

	it('reloads the account after a password change', async () => {
		signedInDevice();
		const api = fakeApi();
		const account = newAccount(api);
		await account.setPassword({ currentPassword: 'old password', newPassword: 'new password' });
		expect(api.setPassword).toHaveBeenCalledWith({
			currentPassword: 'old password',
			newPassword: 'new password'
		});
		expect(account.details).toEqual(ACCOUNT);
	});

	it('[AC-22] merges the device progress into the account at sign-in, then shows the account', async () => {
		const server = { progress: { completedLessons: ['l2'], examPassed: false } };
		const api = fakeApi({}, server);
		const copy = memoryCopy({ completedLessons: ['l1'], examPassed: true });
		const account = newAccount(api, copy);
		await account.signIn(ACCOUNT.email, 'a password');
		expect(api.mergeProgress).toHaveBeenCalledWith({ completedLessons: ['l1'], examPassed: true });
		expect(copy.progress).toEqual({ completedLessons: ['l1', 'l2'], examPassed: true });
	});

	it('[AC-24] removes the account progress from the device when signing out', async () => {
		signedInDevice();
		const copy = memoryCopy({ completedLessons: ['l1'], examPassed: true });
		const account = newAccount(fakeApi(), copy);
		await account.signOut();
		expect(copy.progress).toEqual({ completedLessons: [], examPassed: false });
	});

	it('[AC-24] removes the progress too when the session ended', async () => {
		signedInDevice();
		const copy = memoryCopy({ completedLessons: ['l1'], examPassed: false });
		const account = newAccount(
			fakeApi({
				getAccount: vi.fn(async () => ({ ok: false, error: 'unauthenticated' }) as const)
			}),
			copy
		);
		await account.refresh();
		expect(copy.progress.completedLessons).toEqual([]);
	});
});
