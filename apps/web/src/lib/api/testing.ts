// Fake API clients for the unit tests. Test code only.
import { vi } from 'vitest';
import type { Account, ApiClient, ApiResult, Progress, WordList } from './client.js';

export const ACCOUNT: Account = {
	email: 'ana@example.com',
	hasPassword: true,
	providers: [],
	features: { readAloud: true, google: false }
};

/** A word list as the API answers it, with whatever a test sets. */
export const wordList = (list: Partial<WordList> = {}): WordList => ({
	id: '00000000-0000-4000-8000-000000000001',
	name: 'Mots',
	createdAt: '2026-11-17T12:00:00.000Z',
	updatedAt: '2026-11-17T12:00:00.000Z',
	words: [],
	...list
});

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
		getWordLists: vi.fn(async () => ok([])),
		createWordList: vi.fn(async (name: string) => ok(wordList({ name }))),
		renameWordList: vi.fn(async (id: string, name: string) => ok(wordList({ id, name }))),
		deleteWordList: vi.fn(async () => ok(undefined)),
		addWordToList: vi.fn(async (id: string, word: string) =>
			ok(wordList({ id, words: [{ cyrillic: word, latin: word }] }))
		),
		removeWordFromList: vi.fn(async (id: string) => ok(wordList({ id }))),
		recognizeSpeech: vi.fn(async () => ok({ outcome: 'match' as const })),
		...overrides
	};
}
