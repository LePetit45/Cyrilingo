// Reactive app state: progress and settings, loaded from and saved to localStorage (spec §6).
// The logic lives in core/progress.ts; this module only makes it reactive for the UI.
import {
	completeLesson,
	loadProgress,
	loadSettings,
	passExam,
	resetProgress,
	saveProgress,
	saveSettings,
	type KeyValueStore,
	type Progress,
	type Settings
} from '#lib/core/progress.js';

/** localStorage, or a throwaway in-memory store where it does not exist (prerendering). */
function browserStore(): KeyValueStore {
	if (typeof localStorage !== 'undefined') return localStorage;
	// Not reactive on purpose: AppState holds the reactive copies.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const data = new Map<string, string>();
	return {
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => void data.set(key, value),
		removeItem: (key) => void data.delete(key)
	};
}

class AppState {
	#store = browserStore();
	progress = $state<Progress>(loadProgress(this.#store));
	settings = $state<Settings>(loadSettings(this.#store));

	completeLesson(lessonId: string) {
		this.progress = completeLesson(this.progress, lessonId);
		saveProgress(this.#store, this.progress);
	}

	passExam() {
		this.progress = passExam(this.progress);
		saveProgress(this.#store, this.progress);
	}

	resetProgress() {
		this.progress = resetProgress(this.#store);
	}

	updateSettings(changes: Partial<Settings>) {
		this.settings = { ...this.settings, ...changes };
		saveSettings(this.#store, this.settings);
	}
}

export const app = new AppState();
