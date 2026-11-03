// Progress of a signed-in learner (SPEC.md › Guests and progress sync). The account is the
// reference; the device keeps a copy (AppState) for offline play. What the device completes is
// queued in localStorage, then each sync sends the queue and replaces the copy with the account's
// progress. Only the queue is sent, never the whole copy, so a reset made elsewhere is not undone.
// A guest's progress never leaves the device (AC-8).
import {
	EMPTY_PROGRESS,
	isEmptyProgress,
	loadPendingProgress,
	mergeProgress,
	progressNotIn,
	savePendingProgress,
	type KeyValueStore,
	type Progress
} from '@cyrilingo/core/progress.js';
import { api, type ApiClient, type ApiResult } from '#lib/api/client.js';
import { app, browserStore } from './app.svelte.js';
import { AsyncState } from './async.svelte.js';

/** The device's copy of the progress: AppState. */
export interface ProgressCopy {
	readonly progress: Progress;
	completeLesson(lessonId: string): void;
	passExam(): void;
	resetProgress(): void;
	replaceProgress(progress: Progress): void;
}

/** What the sync needs to know of the account, given by AccountState. */
export interface SyncedAccount {
	isSignedIn(): boolean;
	/** The API answered that the session ended: the device signs out. */
	expired(): void;
}

export class ProgressSync {
	/** The last exchange with the account: the path shows it while loading and when it failed. */
	readonly status = new AsyncState();
	#client: ApiClient;
	#copy: ProgressCopy;
	#store: KeyValueStore;
	#account: SyncedAccount = { isSignedIn: () => false, expired: () => {} };
	#queue: Progress;
	/** Exchanges run one after the other, so an answer never overwrites a newer one. */
	#last: Promise<unknown> = Promise.resolve();
	/** Changes at every sign-out: an answer to a request sent before it is dropped. */
	#generation = 0;

	constructor(client: ApiClient, copy: ProgressCopy, store: KeyValueStore) {
		this.#client = client;
		this.#copy = copy;
		this.#store = store;
		this.#queue = loadPendingProgress(store);
	}

	/** Called once by the account. */
	connect(account: SyncedAccount) {
		this.#account = account;
	}

	completeLesson(lessonId: string) {
		this.#copy.completeLesson(lessonId);
		this.#record({ completedLessons: [lessonId], examPassed: false });
	}

	passExam() {
		this.#copy.passExam();
		this.#record({ completedLessons: [], examPassed: true });
	}

	/** Right after signing in: everything the device has goes to the account (AC-22). */
	adoptDevice(): Promise<ApiResult<Progress> | undefined> {
		this.#enqueue(this.#copy.progress);
		return this.sync();
	}

	/**
	 * Sends the queue, then replaces the copy with the account's progress (AC-23). On a failure
	 * the queue stays for the next sync. Does nothing on a guest's device.
	 */
	sync(): Promise<ApiResult<Progress> | undefined> {
		return this.#inTurn(async (generation) => {
			if (!this.#account.isSignedIn() || generation !== this.#generation) return undefined;
			const sent = this.#queue;
			const result = await this.status.run(() =>
				isEmptyProgress(sent) ? this.#client.getProgress() : this.#client.mergeProgress(sent)
			);
			if (!result || generation !== this.#generation) return undefined;
			if (!result.ok) {
				if (result.error === 'unauthenticated') this.#account.expired();
				return result;
			}
			// What was completed while the request was out is still to send, and still done here.
			this.#setQueue(progressNotIn(this.#queue, sent));
			this.#copy.replaceProgress(mergeProgress(result.value, this.#queue));
			return result;
		});
	}

	/**
	 * « Réinitialiser ma progression »: the account's progress too when signed in (AC-25). The
	 * device keeps its progress if the account could not be reset.
	 */
	reset(): Promise<ApiResult<void>> {
		return this.#inTurn(async (generation) => {
			if (this.#account.isSignedIn()) {
				const result = await this.#client.resetProgress();
				if (generation !== this.#generation) return { ok: true, value: undefined };
				if (!result.ok) {
					if (result.error === 'unauthenticated') this.#account.expired();
					return result;
				}
				this.#setQueue(EMPTY_PROGRESS);
				this.status.reset();
			}
			this.#copy.resetProgress();
			return { ok: true, value: undefined };
		});
	}

	/** Signing out: the account's progress leaves the device, settings stay (AC-24). */
	forget() {
		this.#generation++;
		this.#setQueue(EMPTY_PROGRESS);
		this.#copy.resetProgress();
		this.status.reset();
	}

	#record(change: Progress) {
		if (!this.#account.isSignedIn()) return;
		this.#enqueue(change);
		void this.sync();
	}

	#enqueue(change: Progress) {
		this.#setQueue(mergeProgress(this.#queue, change));
	}

	#setQueue(queue: Progress) {
		this.#queue = queue;
		savePendingProgress(this.#store, queue);
	}

	#inTurn<T>(exchange: (generation: number) => Promise<T>): Promise<T> {
		const generation = this.#generation;
		const run = this.#last.then(() => exchange(generation));
		this.#last = run.catch(() => {});
		return run;
	}
}

export const progressSync = new ProgressSync(api, app, browserStore());
