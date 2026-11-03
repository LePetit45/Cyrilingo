// In-memory stand-ins for the browser state, for the unit tests. Test code only.
import {
	completeLesson,
	EMPTY_PROGRESS,
	passExam,
	type KeyValueStore,
	type Progress
} from '@cyrilingo/core/progress.js';
import type { ProgressCopy } from './progress-sync.svelte.js';

/** A key-value store like localStorage, with its content exposed. */
export function memoryStore(): KeyValueStore & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return {
		data,
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => void data.set(key, value),
		removeItem: (key) => void data.delete(key)
	};
}

/** The device's progress copy, as AppState keeps it, without storage. */
export function memoryCopy(
	initial: Progress = EMPTY_PROGRESS
): ProgressCopy & { progress: Progress } {
	return {
		progress: initial,
		completeLesson(lessonId) {
			this.progress = completeLesson(this.progress, lessonId);
		},
		passExam() {
			this.progress = passExam(this.progress);
		},
		resetProgress() {
			this.progress = EMPTY_PROGRESS;
		},
		replaceProgress(progress) {
			this.progress = progress;
		}
	};
}
