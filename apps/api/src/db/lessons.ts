import type { SectionId } from '@cyrilingo/core/content/types.js';
import type { Db } from './database.js';

export interface LessonRow {
	id: string;
	section: SectionId;
	/** The letters the lesson introduces, in the order of its discovery cards. */
	letters: string[];
	/** Whether this user completed it. */
	completed: boolean;
}

/** The lessons in course order, with their letters and whether the user completed each. */
export async function listLessons(db: Db, userId: string): Promise<LessonRow[]> {
	const lessons = await db
		.selectFrom('lessons')
		.select(['id', 'section'])
		.orderBy('position')
		.execute();
	const letters = await db
		.selectFrom('lesson_letters')
		.select(['lesson_id', 'letter_id'])
		.orderBy('position')
		.execute();
	const completed = await db
		.selectFrom('lesson_completions')
		.select('lesson_id')
		.where('user_id', '=', userId)
		.execute();
	const completedIds = new Set(completed.map(({ lesson_id }) => lesson_id));
	return lessons.map(({ id, section }) => ({
		id,
		section,
		letters: letters.filter(({ lesson_id }) => lesson_id === id).map(({ letter_id }) => letter_id),
		completed: completedIds.has(id)
	}));
}
