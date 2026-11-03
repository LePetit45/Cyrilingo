import { BULGARIAN_ALPHABET } from '@cyrilingo/core/alphabet.js';
import { SYLLABLES, WORDS } from '@cyrilingo/core/content/corpus.js';
import { LESSONS, lessonIntroducing } from '@cyrilingo/core/content/course.js';
import type { Db } from './database.js';

/**
 * Loads the reference data from the content files: letters, lessons, which lesson introduces
 * which letter, and the corpus. An upsert, so running it again changes nothing. Rows are never
 * deleted: a word dropped from the content stays in the word lists that hold it.
 */
export async function seed(db: Db): Promise<void> {
	await db.transaction().execute(async (trx) => {
		await trx
			.insertInto('letters')
			.values(
				BULGARIAN_ALPHABET.map((letter, index) => ({
					id: letter,
					section: lessonIntroducing(letter).section,
					position: index + 1
				}))
			)
			.onConflict((oc) =>
				oc.column('id').doUpdateSet((eb) => ({
					section: eb.ref('excluded.section'),
					position: eb.ref('excluded.position')
				}))
			)
			.execute();

		await trx
			.insertInto('lessons')
			.values(
				LESSONS.map((lesson, index) => ({
					id: lesson.id,
					section: lesson.section,
					position: index + 1
				}))
			)
			.onConflict((oc) =>
				oc.column('id').doUpdateSet((eb) => ({
					section: eb.ref('excluded.section'),
					position: eb.ref('excluded.position')
				}))
			)
			.execute();

		// Nothing points at these rows, so they are simply replaced.
		await trx.deleteFrom('lesson_letters').execute();
		await trx
			.insertInto('lesson_letters')
			.values(
				LESSONS.flatMap((lesson) =>
					lesson.letters.map((letter, index) => ({
						lesson_id: lesson.id,
						letter_id: letter,
						position: index + 1
					}))
				)
			)
			.execute();

		await trx
			.insertInto('words')
			.values([
				...Object.keys(WORDS).map((id) => ({ id, kind: 'word' as const })),
				...SYLLABLES.map((id) => ({ id, kind: 'syllable' as const }))
			])
			.onConflict((oc) => oc.column('id').doUpdateSet((eb) => ({ kind: eb.ref('excluded.kind') })))
			.execute();
	});
}
