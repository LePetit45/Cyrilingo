import { BULGARIAN_ALPHABET } from '@cyrilingo/core/alphabet.js';
import { SYLLABLES, WORDS } from '@cyrilingo/core/content/corpus.js';
import { LESSONS } from '@cyrilingo/core/content/course.js';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { createDb } from './database.js';
import { seed } from './seed.js';

// The global setup already migrated and seeded this database once.
const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

const snapshot = async () => ({
	letters: await db.selectFrom('letters').selectAll().orderBy('id').execute(),
	lessons: await db.selectFrom('lessons').selectAll().orderBy('id').execute(),
	lessonLetters: await db
		.selectFrom('lesson_letters')
		.selectAll()
		.orderBy('lesson_id')
		.orderBy('position')
		.execute(),
	words: await db.selectFrom('words').selectAll().orderBy('id').execute()
});

describe('seed', () => {
	it('[AC-71] loads every letter, lesson and corpus word', async () => {
		const { letters, lessons, lessonLetters, words } = await snapshot();
		expect(letters).toHaveLength(BULGARIAN_ALPHABET.length);
		expect(letters.find((letter) => letter.id === 'Ж')).toEqual({
			id: 'Ж',
			section: 'newcomers',
			position: 7
		});
		expect(lessons.map((lesson) => lesson.id).sort()).toEqual(
			LESSONS.map((lesson) => lesson.id).sort()
		);
		expect(lessonLetters.filter((row) => row.lesson_id === 'l1')).toEqual([
			{ lesson_id: 'l1', letter_id: 'А', position: 1 },
			{ lesson_id: 'l1', letter_id: 'Т', position: 2 },
			{ lesson_id: 'l1', letter_id: 'М', position: 3 }
		]);
		expect(lessonLetters).toHaveLength(30);
		expect(words.filter((word) => word.kind === 'word')).toHaveLength(Object.keys(WORDS).length);
		expect(words.filter((word) => word.kind === 'syllable')).toHaveLength(SYLLABLES.length);
	});

	it('[AC-71] changes nothing when it runs again', async () => {
		const before = await snapshot();
		await seed(db);
		expect(await snapshot()).toEqual(before);
	});

	it('puts back reference rows changed by hand', async () => {
		await db.updateTable('words').set({ kind: 'syllable' }).where('id', '=', 'мама').execute();
		await db.deleteFrom('lesson_letters').where('lesson_id', '=', 'l1').execute();
		await seed(db);
		const after = await snapshot();
		expect(after.words.find((word) => word.id === 'мама')).toEqual({ id: 'мама', kind: 'word' });
		expect(after.lessonLetters).toHaveLength(30);
	});
});
