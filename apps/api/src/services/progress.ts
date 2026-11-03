import type { Db } from '../db/database.js';
import { addProgress, clearProgress, findLessonIds, findProgress } from '../db/progress.js';
import { ServiceError } from './errors.js';

/** A learner's progress: what the account keeps of the course. */
export interface Progress {
	/** Ids of the completed lessons, in course order. */
	completedLessons: string[];
	examPassed: boolean;
}

export interface ProgressService {
	get(userId: string): Promise<Progress>;
	/**
	 * Merges progress made on a device into the account (AC-22): the union of completed lessons,
	 * and the exam passed if it was passed on either side. Nothing is ever taken away, so sending
	 * the same progress twice changes nothing. Resolves to the account's progress.
	 */
	merge(userId: string, progress: Progress): Promise<Progress>;
	/** Forgets every completed lesson and the exam (AC-25). */
	reset(userId: string): Promise<void>;
}

export function createProgressService(db: Db, now: () => Date = () => new Date()): ProgressService {
	async function get(userId: string): Promise<Progress> {
		const progress = await findProgress(db, userId);
		if (!progress) throw new ServiceError('not_found');
		return progress;
	}

	return {
		get,

		async merge(userId, { completedLessons, examPassed }) {
			// An unknown user is refused before anything is written.
			await get(userId);
			const lessonIds = [...new Set(completedLessons)];
			if ((await findLessonIds(db, lessonIds)).length !== lessonIds.length) {
				throw new ServiceError('unknown_lesson');
			}
			await addProgress(db, userId, { lessonIds, examPassed }, now());
			return get(userId);
		},

		async reset(userId) {
			if (!(await clearProgress(db, userId))) throw new ServiceError('not_found');
		}
	};
}
