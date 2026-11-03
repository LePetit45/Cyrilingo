import { describe, expect, it, vi } from 'vitest';
import { EMPTY_PROGRESS, type Progress } from '@cyrilingo/core/progress.js';
import type { ApiClient } from '#lib/api/client.js';
import { fakeApi } from '#lib/api/testing.js';
import { ProgressSync } from './progress-sync.svelte.js';
import { memoryCopy, memoryStore } from './testing.js';

const offline = { ok: false, error: 'network' } as const;

/** A device with its own copy and storage; signed in unless told otherwise. */
function device(
	api: ApiClient,
	{ signedIn = true, store = memoryStore(), progress = EMPTY_PROGRESS } = {}
) {
	const copy = memoryCopy(progress);
	const sync = new ProgressSync(api, copy, store);
	const expired = vi.fn();
	sync.connect({ isSignedIn: () => signedIn, expired });
	return { copy, sync, store, expired };
}

/** One account's progress on the server, shared by the devices of a test. */
const account = (progress: Progress = EMPTY_PROGRESS) => ({ progress });

describe('ProgressSync', () => {
	it('[AC-8] keeps a guest progress on the device and sends nothing', async () => {
		const api = fakeApi();
		const { copy, sync, store } = device(api, { signedIn: false });
		sync.completeLesson('l1');
		sync.passExam();
		expect(await sync.sync()).toBeUndefined();
		expect(copy.progress).toEqual({ completedLessons: ['l1'], examPassed: true });
		expect(store.data.size).toBe(0);
		expect(api.getProgress).not.toHaveBeenCalled();
		expect(api.mergeProgress).not.toHaveBeenCalled();
	});

	it('[AC-22] sends the whole device progress after sign-in and shows the union', async () => {
		const server = account({ completedLessons: ['l3'], examPassed: false });
		const api = fakeApi({}, server);
		const { copy, sync } = device(api, {
			progress: { completedLessons: ['l1', 'l2'], examPassed: true }
		});
		await sync.adoptDevice();
		expect(server.progress).toEqual({ completedLessons: ['l3', 'l1', 'l2'], examPassed: true });
		expect(copy.progress).toEqual({ completedLessons: ['l1', 'l2', 'l3'], examPassed: true });
	});

	it('[AC-23] saves a completed lesson and a passed exam to the account', async () => {
		const server = account();
		const { sync } = device(fakeApi({}, server));
		sync.completeLesson('l1');
		sync.passExam();
		await sync.sync();
		expect(server.progress).toEqual({ completedLessons: ['l1'], examPassed: true });
	});

	it('[AC-23] keeps a lesson completed offline on the device and sends it at the next sync', async () => {
		const server = account();
		const first = device(fakeApi({ mergeProgress: vi.fn(async () => offline) }, server));
		first.sync.completeLesson('l2');
		await first.sync.sync();
		expect(first.sync.status.status).toBe('error');
		expect(first.copy.progress.completedLessons).toEqual(['l2']);
		expect(server.progress.completedLessons).toEqual([]);

		// The app closed and opened again: the queue was kept in storage.
		const reopened = device(fakeApi({}, server), {
			store: first.store,
			progress: first.copy.progress
		});
		await reopened.sync.sync();
		expect(server.progress.completedLessons).toEqual(['l2']);
		expect(reopened.sync.status.status).toBe('success');
		expect(reopened.store.data.size).toBe(0);
	});

	it('[AC-23] keeps a lesson completed while a sync was out', async () => {
		const server = account({ completedLessons: ['l1'], examPassed: false });
		let answer!: () => void;
		const api = fakeApi({}, server);
		vi.mocked(api.getProgress).mockImplementationOnce(
			() => new Promise((resolve) => (answer = () => resolve({ ok: true, value: server.progress })))
		);
		const { copy, sync } = device(api);
		const first = sync.sync();
		await vi.waitFor(() => expect(api.getProgress).toHaveBeenCalled());
		sync.completeLesson('l2');
		answer();
		await first;
		expect(copy.progress.completedLessons).toEqual(['l1', 'l2']);
		await sync.sync();
		expect(server.progress.completedLessons).toEqual(['l1', 'l2']);
	});

	it('[AC-24] removes the account progress and its queue from the device', async () => {
		const api = fakeApi();
		vi.mocked(api.mergeProgress).mockResolvedValue(offline);
		const { copy, sync, store } = device(api);
		sync.completeLesson('l1');
		await sync.sync();
		sync.forget();
		expect(copy.progress).toEqual(EMPTY_PROGRESS);
		expect(store.data.size).toBe(0);
		expect(sync.status.status).toBe('idle');
	});

	it('[AC-24] drops an answer that comes back after signing out', async () => {
		const server = account({ completedLessons: ['l1'], examPassed: true });
		let answer!: () => void;
		const api = fakeApi({}, server);
		vi.mocked(api.getProgress).mockImplementationOnce(
			() => new Promise((resolve) => (answer = () => resolve({ ok: true, value: server.progress })))
		);
		const { copy, sync } = device(api);
		const pending = sync.sync();
		await vi.waitFor(() => expect(api.getProgress).toHaveBeenCalled());
		sync.forget();
		answer();
		await pending;
		expect(copy.progress).toEqual(EMPTY_PROGRESS);
	});

	it('[AC-25] resets the account, and another device shows it at its next sync', async () => {
		const server = account({ completedLessons: ['l1', 'l2'], examPassed: true });
		const phone = device(fakeApi({}, server));
		const laptop = device(fakeApi({}, server));
		await phone.sync.sync();
		await laptop.sync.sync();
		expect(laptop.copy.progress.completedLessons).toEqual(['l1', 'l2']);

		expect(await phone.sync.reset()).toEqual({ ok: true, value: undefined });
		expect(server.progress).toEqual(EMPTY_PROGRESS);
		expect(phone.copy.progress).toEqual(EMPTY_PROGRESS);

		await laptop.sync.sync();
		expect(laptop.copy.progress).toEqual(EMPTY_PROGRESS);
	});

	it('[AC-25] keeps the device progress when the account could not be reset', async () => {
		const progress = { completedLessons: ['l1'], examPassed: false };
		const api = fakeApi({ resetProgress: vi.fn(async () => offline) }, account(progress));
		const { copy, sync } = device(api, { progress });
		expect(await sync.reset()).toEqual(offline);
		expect(copy.progress).toEqual(progress);
	});

	it('resets only the device for a guest', async () => {
		const api = fakeApi();
		const { copy, sync } = device(api, {
			signedIn: false,
			progress: { completedLessons: ['l1'], examPassed: false }
		});
		expect((await sync.reset()).ok).toBe(true);
		expect(copy.progress).toEqual(EMPTY_PROGRESS);
		expect(api.resetProgress).not.toHaveBeenCalled();
	});

	it('signs the device out when the session ended', async () => {
		const ended = { ok: false, error: 'unauthenticated' } as const;
		const { sync, expired } = device(
			fakeApi({ getProgress: vi.fn(async () => ended), resetProgress: vi.fn(async () => ended) })
		);
		expect(await sync.sync()).toEqual(ended);
		expect(await sync.reset()).toEqual(ended);
		expect(expired).toHaveBeenCalledTimes(2);
	});
});
