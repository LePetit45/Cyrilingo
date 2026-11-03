import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account, ApiClient, ApiResult } from '#lib/api/client.js';
import { AccountState } from './account.svelte.js';

const ACCOUNT: Account = {
	email: 'ana@example.com',
	hasPassword: true,
	providers: [],
	features: { readAloud: true, google: false }
};
const ok = <T>(value: T): ApiResult<T> => ({ ok: true, value });

/** An API client whose every call succeeds, unless a test overrides it. */
function fakeApi(overrides: Partial<ApiClient> = {}): ApiClient {
	return {
		signUp: vi.fn(async () => ok(undefined)),
		signIn: vi.fn(async () => ok(undefined)),
		signOut: vi.fn(async () => ok(undefined)),
		getAccount: vi.fn(async () => ok(ACCOUNT)),
		setPassword: vi.fn(async () => ok(undefined)),
		deleteAccount: vi.fn(async () => ok(undefined)),
		...overrides
	};
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
		const account = new AccountState(api);
		expect(account.signedIn).toBe(false);
		expect(await account.refresh()).toBeUndefined();
		expect(api.getAccount).not.toHaveBeenCalled();
	});

	it('remembers the account after signing in, and loads it', async () => {
		const account = new AccountState(fakeApi());
		const result = await account.signIn(' Ana@Example.com ', 'a password');
		expect(result.ok).toBe(true);
		expect(account.signedIn).toBe(true);
		expect(account.details).toEqual(ACCOUNT);
		expect(new AccountState(fakeApi()).email).toBe(ACCOUNT.email);
	});

	it('stays a guest when signing up is refused', async () => {
		const account = new AccountState(
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
		const account = new AccountState(offline);
		expect(account.email).toBe(ACCOUNT.email);
		await account.refresh();
		expect(account.signedIn).toBe(true);
	});

	it('signs out a device whose session ended', async () => {
		signedInDevice();
		const account = new AccountState(
			fakeApi({ getAccount: vi.fn(async () => ({ ok: false, error: 'unauthenticated' }) as const) })
		);
		await account.refresh();
		expect(account.signedIn).toBe(false);
		expect(storage.size).toBe(0);
	});

	it('forgets the account when signing out, but not when the API cannot be reached', async () => {
		signedInDevice();
		const offline = new AccountState(
			fakeApi({ signOut: vi.fn(async () => ({ ok: false, error: 'network' }) as const) })
		);
		expect(await offline.signOut()).toEqual({ ok: false, error: 'network' });
		expect(offline.signedIn).toBe(true);

		const online = new AccountState(fakeApi());
		expect(await online.signOut()).toEqual({ ok: true, value: undefined });
		expect(online.signedIn).toBe(false);
		expect(storage.size).toBe(0);
	});

	it('forgets the account once deleted', async () => {
		signedInDevice();
		const account = new AccountState(fakeApi());
		expect((await account.deleteAccount()).ok).toBe(true);
		expect(account.signedIn).toBe(false);
	});

	it('reloads the account after a password change', async () => {
		signedInDevice();
		const api = fakeApi();
		const account = new AccountState(api);
		await account.setPassword({ currentPassword: 'old password', newPassword: 'new password' });
		expect(api.setPassword).toHaveBeenCalledWith({
			currentPassword: 'old password',
			newPassword: 'new password'
		});
		expect(account.details).toEqual(ACCOUNT);
	});
});
