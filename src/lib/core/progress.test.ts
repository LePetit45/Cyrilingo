import { describe, expect, it } from 'vitest';
import {
	completeLesson,
	DEFAULT_SETTINGS,
	EMPTY_PROGRESS,
	isLetterLearned,
	lessonState,
	loadProgress,
	loadSettings,
	passExam,
	resetProgress,
	saveProgress,
	saveSettings,
	suggestedLesson,
	type KeyValueStore
} from './progress.js';

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & {
	data: Record<string, string>;
} {
	const data = { ...initial };
	return {
		data,
		getItem: (key) => data[key] ?? null,
		setItem: (key, value) => void (data[key] = value),
		removeItem: (key) => void delete data[key]
	};
}

const brokenStore: KeyValueStore = {
	getItem: () => {
		throw new Error('SecurityError');
	},
	setItem: () => {
		throw new Error('QuotaExceededError');
	},
	removeItem: () => {
		throw new Error('SecurityError');
	}
};

describe('progress persistence', () => {
	it('starts empty', () => {
		expect(loadProgress(memoryStore())).toEqual(EMPTY_PROGRESS);
	});

	it('round-trips through the store', () => {
		const store = memoryStore();
		const progress = passExam(completeLesson(completeLesson(EMPTY_PROGRESS, 'l3'), 'l1'));
		saveProgress(store, progress);
		expect(loadProgress(store)).toEqual({ completedLessons: ['l1', 'l3'], examPassed: true });
	});

	it('ignores corrupted data and unknown lessons', () => {
		expect(loadProgress(memoryStore({ 'cyrilingo.progress.v1': '{oops' }))).toEqual(EMPTY_PROGRESS);
		expect(
			loadProgress(
				memoryStore({
					'cyrilingo.progress.v1': JSON.stringify({
						completedLessons: ['l2', 'l99', 42],
						examPassed: 'yes'
					})
				})
			)
		).toEqual({ completedLessons: ['l2'], examPassed: false });
	});

	it('resets progress but keeps settings', () => {
		const store = memoryStore();
		saveProgress(store, completeLesson(EMPTY_PROGRESS, 'l1'));
		saveSettings(store, { ...DEFAULT_SETTINGS, sound: false });
		expect(resetProgress(store)).toEqual(EMPTY_PROGRESS);
		expect(loadProgress(store)).toEqual(EMPTY_PROGRESS);
		expect(loadSettings(store).sound).toBe(false);
	});

	it('keeps working when storage is unavailable', () => {
		expect(loadProgress(brokenStore)).toEqual(EMPTY_PROGRESS);
		expect(loadSettings(brokenStore)).toEqual(DEFAULT_SETTINGS);
		expect(() => saveProgress(brokenStore, EMPTY_PROGRESS)).not.toThrow();
		expect(() => resetProgress(brokenStore)).not.toThrow();
	});
});

describe('settings persistence', () => {
	it('defaults to sound on and welcome not shown', () => {
		expect(loadSettings(memoryStore())).toEqual({
			sound: true,
			soundEffects: true,
			welcomed: false
		});
	});

	it('round-trips, falling back to defaults for missing or invalid values', () => {
		const store = memoryStore();
		saveSettings(store, { sound: false, soundEffects: false, welcomed: true });
		expect(loadSettings(store)).toEqual({ sound: false, soundEffects: false, welcomed: true });
		store.data['cyrilingo.settings.v1'] = JSON.stringify({ sound: 0, welcomed: true });
		expect(loadSettings(store)).toEqual({ sound: true, soundEffects: true, welcomed: true });
	});
});

describe('lesson states', () => {
	it('suggests the first lesson not completed', () => {
		expect(suggestedLesson(EMPTY_PROGRESS)?.id).toBe('l1');
		const progress = completeLesson(completeLesson(EMPTY_PROGRESS, 'l1'), 'l3');
		expect(suggestedLesson(progress)?.id).toBe('l2');
		expect(lessonState(progress, 'l1')).toBe('completed');
		expect(lessonState(progress, 'l2')).toBe('suggested');
		expect(lessonState(progress, 'l3')).toBe('completed');
		expect(lessonState(progress, 'l4')).toBe('notDone');
	});

	it('suggests nothing once every lesson is completed', () => {
		const all = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10'].reduce(
			completeLesson,
			EMPTY_PROGRESS
		);
		expect(suggestedLesson(all)).toBeUndefined();
	});

	it('learns the letters of completed lessons', () => {
		const progress = completeLesson(EMPTY_PROGRESS, 'l2');
		expect(isLetterLearned(progress, 'К')).toBe(true);
		expect(isLetterLearned(progress, 'А')).toBe(false);
	});

	it('does not change progress that already has the lesson or the exam', () => {
		const progress = passExam(completeLesson(EMPTY_PROGRESS, 'l1'));
		expect(completeLesson(progress, 'l1')).toBe(progress);
		expect(passExam(progress)).toBe(progress);
	});
});
