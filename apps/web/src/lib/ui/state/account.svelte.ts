// The signed-in account, if any (SPEC.md › Auth). The session itself is an HttpOnly cookie the
// page cannot read, so the device remembers in localStorage that it signed in, and with which
// e-mail: a guest's device never calls the API (AC-8), a signed-in one checks its session at start.
import { api, type Account, type ApiClient, type ApiResult } from '#lib/api/client.js';
import { progressSync, type ProgressSync } from './progress-sync.svelte.js';

const ACCOUNT_KEY = 'cyrilingo.account.v1';

function readSignedInEmail(): string | null {
	try {
		const saved: unknown = JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? 'null');
		const email = (saved as { email?: unknown } | null)?.email;
		return typeof email === 'string' ? email : null;
	} catch {
		// No localStorage (prerendering) or a damaged value: signed out.
		return null;
	}
}

export class AccountState {
	#api: ApiClient;
	#sync: ProgressSync;
	/** E-mail of the signed-in account, known as soon as the app starts, offline included. */
	email = $state<string | null>(readSignedInEmail());
	/** The account as the API last described it; null until it answered. */
	details = $state<Account | null>(null);

	constructor(client: ApiClient = api, sync: ProgressSync = progressSync) {
		this.#api = client;
		this.#sync = sync;
		sync.connect({ isSignedIn: () => this.signedIn, expired: () => this.#forget() });
	}

	get signedIn() {
		return this.email !== null;
	}

	/** Asks the API for the account, when this device signed in. An ended session signs out. */
	async refresh(): Promise<ApiResult<Account> | undefined> {
		if (!this.signedIn) return undefined;
		const result = await this.#api.getAccount();
		if (result.ok) this.#remember(result.value);
		else if (result.error === 'unauthenticated') this.#forget();
		return result;
	}

	async signIn(email: string, password: string): Promise<ApiResult<void>> {
		return this.#thenLoad(email, await this.#api.signIn(email, password));
	}

	async signUp(email: string, password: string): Promise<ApiResult<void>> {
		return this.#thenLoad(email, await this.#api.signUp(email, password));
	}

	async signOut(): Promise<ApiResult<void>> {
		const result = await this.#api.signOut();
		// An already ended session is signed out too.
		if (result.ok || result.error === 'unauthenticated') {
			this.#forget();
			return { ok: true, value: undefined };
		}
		return result;
	}

	async setPassword(passwords: {
		currentPassword?: string;
		newPassword: string;
	}): Promise<ApiResult<void>> {
		const result = await this.#api.setPassword(passwords);
		if (result.ok) await this.refresh();
		else if (result.error === 'unauthenticated') this.#forget();
		return result;
	}

	async deleteAccount(): Promise<ApiResult<void>> {
		const result = await this.#api.deleteAccount();
		if (result.ok || result.error === 'unauthenticated') this.#forget();
		return result;
	}

	async #thenLoad(email: string, result: ApiResult<void>): Promise<ApiResult<void>> {
		if (!result.ok) return result;
		this.email = email.trim().toLowerCase();
		this.#save();
		await this.refresh();
		// A failed merge is not a failed sign-in: the device's progress waits for the next sync.
		await this.#sync.adoptDevice();
		return result;
	}

	#remember(account: Account) {
		this.details = account;
		this.email = account.email;
		this.#save();
	}

	#forget() {
		this.email = null;
		this.details = null;
		this.#sync.forget();
		try {
			localStorage.removeItem(ACCOUNT_KEY);
		} catch {
			// Nothing saved.
		}
	}

	#save() {
		try {
			localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ email: this.email }));
		} catch {
			// Private mode without storage: signed in until the page closes.
		}
	}
}

export const account = new AccountState();
