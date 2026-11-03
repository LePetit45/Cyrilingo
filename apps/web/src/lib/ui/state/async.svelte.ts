// The one helper every async action of a screen goes through (SPEC.md › Four states per screen):
// `idle`, then `loading`, then `success` or `error` with the code to pick a sentence from.
import type { ApiErrorCode, ApiResult } from '#lib/api/client.js';

export type AsyncStatus = 'idle' | 'loading' | 'error' | 'success';

export class AsyncState {
	status = $state<AsyncStatus>('idle');
	error = $state<ApiErrorCode | null>(null);

	get loading() {
		return this.status === 'loading';
	}

	/** Runs the action, unless one is already running; resolves to its result. */
	async run<T>(action: () => Promise<ApiResult<T>>): Promise<ApiResult<T> | undefined> {
		if (this.loading) return undefined;
		this.status = 'loading';
		this.error = null;
		const result = await action();
		this.status = result.ok ? 'success' : 'error';
		this.error = result.ok ? null : result.error;
		return result;
	}

	reset() {
		this.status = 'idle';
		this.error = null;
	}
}
