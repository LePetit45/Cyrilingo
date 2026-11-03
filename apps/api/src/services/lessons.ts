import type { Db } from '../db/database.js';
import { listLessons, type LessonRow } from '../db/lessons.js';

export type LessonSummary = LessonRow;

export interface LessonService {
	/** The lessons of the course in order, with their letters and whether the user completed each. */
	list(userId: string): Promise<LessonSummary[]>;
}

export function createLessonService(db: Db): LessonService {
	return { list: (userId) => listLessons(db, userId) };
}
