// What is saved in the browser (spec §6): completed lessons, whether the final exam was passed,
// the part of it a signed-in account has not received yet, and the settings. Nothing about an
// unfinished lesson is ever saved (spec §4.5).
import type { BulgarianLetter } from './alphabet.js';
import { LESSONS } from './content/course.js';
import type { Lesson } from './content/types.js';

export interface Progress {
	/** Ids of the completed lessons, in course order. */
	completedLessons: readonly string[];
	examPassed: boolean;
}

export interface Settings {
	/** Recorded letter and word sounds (spec §7.1). */
	sound: boolean;
	/** Correct / wrong answer sound effects (spec §8). */
	soundEffects: boolean;
	/** Whether the welcome screen was shown, so it only appears on first launch (spec §7.2). */
	welcomed: boolean;
}

export const EMPTY_PROGRESS: Progress = { completedLessons: [], examPassed: false };

export const DEFAULT_SETTINGS: Settings = { sound: true, soundEffects: true, welcomed: false };

/** The part of the Web Storage API used here, so tests can pass an in-memory store. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const PROGRESS_KEY = 'cyrilingo.progress.v1';
const PENDING_KEY = 'cyrilingo.pending-progress.v1';
const SETTINGS_KEY = 'cyrilingo.settings.v1';

/** Reads a JSON value, or undefined if it is missing, unreadable or storage is unavailable. */
function read(store: KeyValueStore, key: string): unknown {
	try {
		const text = store.getItem(key);
		return text === null ? undefined : JSON.parse(text);
	} catch {
		return undefined;
	}
}

/** Writes a JSON value. Storage may be full or disabled (private browsing): progress is then only kept for the visit. */
function write(store: KeyValueStore, key: string, value: unknown): void {
	try {
		store.setItem(key, JSON.stringify(value));
	} catch {
		// Nothing else to do: the app keeps working with its in-memory state.
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function readProgress(store: KeyValueStore, key: string): Progress {
	const saved = read(store, key);
	if (!isRecord(saved)) return EMPTY_PROGRESS;
	const ids = Array.isArray(saved.completedLessons) ? saved.completedLessons : [];
	return {
		// Unknown ids (from a lesson removed in a later version) are dropped.
		completedLessons: inCourseOrder(ids),
		examPassed: saved.examPassed === true
	};
}

function remove(store: KeyValueStore, key: string): void {
	try {
		store.removeItem(key);
	} catch {
		// See write().
	}
}

/** The known lesson ids among `ids`, once each, in course order. */
function inCourseOrder(ids: readonly unknown[]): string[] {
	return LESSONS.filter((lesson) => ids.includes(lesson.id)).map(({ id }) => id);
}

export function loadProgress(store: KeyValueStore): Progress {
	return readProgress(store, PROGRESS_KEY);
}

export function saveProgress(store: KeyValueStore, progress: Progress): void {
	write(store, PROGRESS_KEY, progress);
}

/**
 * Progress made while signed in that the account has not received yet (SPEC.md › Guests and
 * progress sync): lessons completed and the exam passed offline, sent at the next sync.
 */
export function loadPendingProgress(store: KeyValueStore): Progress {
	return readProgress(store, PENDING_KEY);
}

export function savePendingProgress(store: KeyValueStore, pending: Progress): void {
	if (isEmptyProgress(pending)) remove(store, PENDING_KEY);
	else write(store, PENDING_KEY, pending);
}

export function loadSettings(store: KeyValueStore): Settings {
	const saved = read(store, SETTINGS_KEY);
	if (!isRecord(saved)) return DEFAULT_SETTINGS;
	const flag = (key: keyof Settings) =>
		typeof saved[key] === 'boolean' ? saved[key] : DEFAULT_SETTINGS[key];
	return { sound: flag('sound'), soundEffects: flag('soundEffects'), welcomed: flag('welcomed') };
}

export function saveSettings(store: KeyValueStore, settings: Settings): void {
	write(store, SETTINGS_KEY, settings);
}

/** "Reset my progress" (spec §7.1): forgets completed lessons and the exam, keeps the settings. */
export function resetProgress(store: KeyValueStore): Progress {
	remove(store, PROGRESS_KEY);
	return EMPTY_PROGRESS;
}

export function completeLesson(progress: Progress, lessonId: string): Progress {
	if (progress.completedLessons.includes(lessonId)) return progress;
	return {
		...progress,
		completedLessons: inCourseOrder([...progress.completedLessons, lessonId])
	};
}

/** Both progresses together (AC-22): every lesson completed in either, the exam if either passed it. */
export function mergeProgress(a: Progress, b: Progress): Progress {
	return {
		completedLessons: inCourseOrder([...a.completedLessons, ...b.completedLessons]),
		examPassed: a.examPassed || b.examPassed
	};
}

/** What `progress` has that `sent` has not. */
export function progressNotIn(progress: Progress, sent: Progress): Progress {
	return {
		completedLessons: progress.completedLessons.filter((id) => !sent.completedLessons.includes(id)),
		examPassed: progress.examPassed && !sent.examPassed
	};
}

export function isEmptyProgress(progress: Progress): boolean {
	return progress.completedLessons.length === 0 && !progress.examPassed;
}

export function passExam(progress: Progress): Progress {
	return progress.examPassed ? progress : { ...progress, examPassed: true };
}

export type LessonState = 'completed' | 'suggested' | 'notDone';

/** The suggested lesson: the first one not completed yet (spec §4.2), if any. */
export function suggestedLesson(progress: Progress): Lesson | undefined {
	return LESSONS.find((lesson) => !progress.completedLessons.includes(lesson.id));
}

export function lessonState(progress: Progress, lessonId: string): LessonState {
	if (progress.completedLessons.includes(lessonId)) return 'completed';
	return suggestedLesson(progress)?.id === lessonId ? 'suggested' : 'notDone';
}

/** Whether a letter is learned: its lesson is completed (spec §6). */
export function isLetterLearned(progress: Progress, letter: BulgarianLetter): boolean {
	return LESSONS.some(
		(lesson) => lesson.letters.includes(letter) && progress.completedLessons.includes(lesson.id)
	);
}
