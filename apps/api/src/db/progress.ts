import type { Db } from './database.js';

export interface ProgressRow {
	/** Ids of the completed lessons, in course order. */
	completedLessons: string[];
	examPassed: boolean;
}

/** The user's progress, or undefined for an unknown user. */
export async function findProgress(db: Db, userId: string): Promise<ProgressRow | undefined> {
	const user = await db
		.selectFrom('users')
		.select('exam_passed_at')
		.where('id', '=', userId)
		.executeTakeFirst();
	if (!user) return undefined;
	const lessons = await db
		.selectFrom('lesson_completions')
		.innerJoin('lessons', 'lessons.id', 'lesson_completions.lesson_id')
		.select('lessons.id')
		.where('lesson_completions.user_id', '=', userId)
		.orderBy('lessons.position')
		.execute();
	return {
		completedLessons: lessons.map(({ id }) => id),
		examPassed: user.exam_passed_at !== null
	};
}

/** Those of the given lesson ids that exist. */
export async function findLessonIds(db: Db, ids: readonly string[]): Promise<string[]> {
	if (ids.length === 0) return [];
	const rows = await db.selectFrom('lessons').select('id').where('id', 'in', ids).execute();
	return rows.map(({ id }) => id);
}

/**
 * Adds completed lessons and a passed exam to what the user already has. Nothing is removed, and
 * a lesson completed again (or an exam passed again) keeps its first date.
 */
export async function addProgress(
	db: Db,
	userId: string,
	progress: { lessonIds: readonly string[]; examPassed: boolean },
	at: Date
): Promise<void> {
	await db.transaction().execute(async (trx) => {
		if (progress.lessonIds.length > 0) {
			await trx
				.insertInto('lesson_completions')
				.values(
					progress.lessonIds.map((id) => ({ user_id: userId, lesson_id: id, completed_at: at }))
				)
				.onConflict((oc) => oc.columns(['user_id', 'lesson_id']).doNothing())
				.execute();
		}
		if (progress.examPassed) {
			await trx
				.updateTable('users')
				.set({ exam_passed_at: at })
				.where('id', '=', userId)
				.where('exam_passed_at', 'is', null)
				.execute();
		}
	});
}

/** Forgets the user's completed lessons and exam. False for an unknown user. */
export async function clearProgress(db: Db, userId: string): Promise<boolean> {
	return db.transaction().execute(async (trx) => {
		await trx.deleteFrom('lesson_completions').where('user_id', '=', userId).execute();
		const result = await trx
			.updateTable('users')
			.set({ exam_passed_at: null })
			.where('id', '=', userId)
			.executeTakeFirst();
		return result.numUpdatedRows > 0n;
	});
}
