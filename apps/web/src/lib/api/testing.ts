// Fake API clients for the unit tests. Test code only.
import { vi } from 'vitest';
import type { Account, ApiClient, ApiResult, Progress } from './client.js';

export const ACCOUNT: Account = {
	email: 'ana@example.com',
	hasPassword: true,
	providers: [],
	features: { readAloud: true, google: false }
};

export const ok = <T>(value: T): ApiResult<T> => ({ ok: true, value });

/**
 * An API client whose every call succeeds, unless a test overrides it. Its progress calls act on
 * `server`, one account's progress as the API keeps it: several clients can share one.
 */
export function fakeApi(
	overrides: Partial<ApiClient> = {},
	server: { progress: Progress } = { progress: { completedLessons: [], examPassed: false } }
): ApiClient {
	return {
		signUp: vi.fn(async () => ok(undefined)),
		signIn: vi.fn(async () => ok(undefined)),
		signOut: vi.fn(async () => ok(undefined)),
		getAccount: vi.fn(async () => ok(ACCOUNT)),
		setPassword: vi.fn(async () => ok(undefined)),
		deleteAccount: vi.fn(async () => ok(undefined)),
		getProgress: vi.fn(async () => ok(server.progress)),
		mergeProgress: vi.fn(async ({ completedLessons, examPassed }: Progress) => {
			server.progress = {
				completedLessons: [...new Set([...server.progress.completedLessons, ...completedLessons])],
				examPassed: server.progress.examPassed || examPassed
			};
			return ok(server.progress);
		}),
		resetProgress: vi.fn(async () => {
			server.progress = { completedLessons: [], examPassed: false };
			return ok(undefined);
		}),
		...overrides
	};
}
