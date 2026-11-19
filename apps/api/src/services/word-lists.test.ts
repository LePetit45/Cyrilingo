import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { createDb } from '../db/database.js';
import { createAccountService } from './account.js';
import { ServiceError } from './errors.js';
import { createWordListService, MAX_WORD_LISTS, MAX_WORDS_PER_LIST } from './word-lists.js';

const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

// One second passes at each change, so lists and words have distinct dates to be ordered by.
let clock = new Date('2026-11-17T12:00:00Z');
const lists = createWordListService(db, () => (clock = new Date(clock.getTime() + 1000)));
const account = createAccountService(db);

async function newUser(): Promise<string> {
	const { id } = await db
		.insertInto('users')
		.values({ email: `learner-${randomUUID()}@example.com` })
		.returning('id')
		.executeTakeFirstOrThrow();
	return id;
}

/** The code a promise rejects with, as a `ServiceError`. */
async function refusal(promise: Promise<unknown>) {
	const error = await promise.then(
		() => undefined,
		(reason: unknown) => reason
	);
	expect(error).toBeInstanceOf(ServiceError);
	return (error as ServiceError).code;
}

const corpusWords = async (count: number) =>
	(
		await db
			.selectFrom('words')
			.select('id')
			.where('kind', '=', 'word')
			.orderBy('id')
			.limit(count)
			.execute()
	).map(({ id }) => id);

describe('word lists', () => {
	it('[AC-30] creates an empty list with a trimmed name of 1 to 40 characters', async () => {
		const userId = await newUser();
		const list = await lists.create(userId, '  Les animaux  ');
		expect(list).toEqual({
			id: expect.any(String),
			name: 'Les animaux',
			createdAt: clock,
			updatedAt: clock,
			words: []
		});
		expect((await lists.create(userId, 'ж'.repeat(40))).name).toHaveLength(40);
		expect(await lists.list(userId)).toHaveLength(2);
	});

	it('[AC-30] refuses an empty name or one longer than 40 characters', async () => {
		const userId = await newUser();
		for (const name of ['', '   ', 'a'.repeat(41)]) {
			expect(await refusal(lists.create(userId, name))).toBe('invalid_list_name');
		}
		const { id } = await lists.create(userId, 'Villes');
		expect(await refusal(lists.rename(userId, id, ' '))).toBe('invalid_list_name');
		expect(await lists.list(userId)).toHaveLength(1);
	});

	it('[AC-30] renames a list and deletes it', async () => {
		const userId = await newUser();
		const { id } = await lists.create(userId, 'Villes');
		const renamed = await lists.rename(userId, id, 'Capitales');
		expect(renamed).toMatchObject({ id, name: 'Capitales', updatedAt: clock });
		expect(renamed.createdAt.getTime()).toBeLessThan(clock.getTime());
		await lists.remove(userId, id);
		expect(await lists.list(userId)).toEqual([]);
		expect(await refusal(lists.remove(userId, id))).toBe('not_found');
	});

	it('[AC-30] refuses a 21st list', async () => {
		const userId = await newUser();
		for (let i = 1; i <= MAX_WORD_LISTS; i++) await lists.create(userId, `Liste ${i}`);
		expect(await refusal(lists.create(userId, 'Une de trop'))).toBe('list_limit_reached');
		expect(await lists.list(userId)).toHaveLength(MAX_WORD_LISTS);
	});

	it('[AC-30] refuses a 21st list even when 2 are asked for at once', async () => {
		const userId = await newUser();
		for (let i = 1; i < MAX_WORD_LISTS; i++) await lists.create(userId, `Liste ${i}`);
		const results = await Promise.allSettled([
			lists.create(userId, 'A'),
			lists.create(userId, 'B')
		]);
		expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
		expect(await lists.list(userId)).toHaveLength(MAX_WORD_LISTS);
	});

	it('[AC-31] adds corpus words with their official transliteration, in the order added', async () => {
		const userId = await newUser();
		const { id } = await lists.create(userId, 'Mots');
		await lists.addWord(userId, id, 'котка');
		const list = await lists.addWord(userId, id, ' България ');
		expect(list.words).toEqual([
			{ cyrillic: 'котка', latin: 'kotka' },
			{ cyrillic: 'България', latin: 'Balgaria' }
		]);
		expect((await lists.list(userId))[0].words).toEqual(list.words);
	});

	it('[AC-31] refuses a word or syllable outside the corpus', async () => {
		const userId = await newUser();
		const { id } = await lists.create(userId, 'Mots');
		for (const word of ['кот', 'hello', 'ма', '']) {
			expect(await refusal(lists.addWord(userId, id, word))).toBe('unknown_word');
		}
		expect((await lists.list(userId))[0].words).toEqual([]);
	});

	it('[AC-31] holds each word at most once', async () => {
		const userId = await newUser();
		const { id } = await lists.create(userId, 'Mots');
		await lists.addWord(userId, id, 'котка');
		expect(await refusal(lists.addWord(userId, id, 'котка'))).toBe('word_already_in_list');
		expect((await lists.list(userId))[0].words).toHaveLength(1);
	});

	it('[AC-31] refuses a 201st word', async () => {
		const userId = await newUser();
		const { id } = await lists.create(userId, 'Tout');
		const words = await corpusWords(MAX_WORDS_PER_LIST + 1);
		expect(words).toHaveLength(MAX_WORDS_PER_LIST + 1);
		await db
			.insertInto('word_list_words')
			.values(words.slice(0, MAX_WORDS_PER_LIST).map((word) => ({ list_id: id, word_id: word })))
			.execute();
		expect(await refusal(lists.addWord(userId, id, words.at(-1)!))).toBe('list_full');
		expect((await lists.list(userId))[0].words).toHaveLength(MAX_WORDS_PER_LIST);
	});

	it('removes a word from a list', async () => {
		const userId = await newUser();
		const { id } = await lists.create(userId, 'Mots');
		await lists.addWord(userId, id, 'котка');
		await lists.addWord(userId, id, 'мама');
		const list = await lists.removeWord(userId, id, 'котка');
		expect(list.words).toEqual([{ cyrillic: 'мама', latin: 'mama' }]);
		expect(list.updatedAt).toEqual(clock);
		expect(await refusal(lists.removeWord(userId, id, 'котка'))).toBe('not_found');
	});

	it('[AC-32] refuses to rename, delete, add to or remove from the list of another user', async () => {
		const [owner, intruder] = [await newUser(), await newUser()];
		const { id } = await lists.create(owner, 'À moi');
		await lists.addWord(owner, id, 'котка');
		const missing = randomUUID();
		for (const listId of [id, missing, 'not-a-uuid']) {
			expect(await refusal(lists.rename(intruder, listId, 'Volée'))).toBe('not_found');
			expect(await refusal(lists.remove(intruder, listId))).toBe('not_found');
			expect(await refusal(lists.addWord(intruder, listId, 'мама'))).toBe('not_found');
			// Not even an unknown word tells the list exists.
			expect(await refusal(lists.addWord(intruder, listId, 'xyz'))).toBe('not_found');
			expect(await refusal(lists.removeWord(intruder, listId, 'котка'))).toBe('not_found');
		}
		expect(await lists.list(owner)).toEqual([
			expect.objectContaining({ id, name: 'À moi', words: [{ cyrillic: 'котка', latin: 'kotka' }] })
		]);
	});

	it("[AC-33] lists only the acting user's lists", async () => {
		const [ana, ben] = [await newUser(), await newUser()];
		await lists.create(ana, 'Ana 1');
		await lists.create(ben, 'Ben 1');
		await lists.create(ana, 'Ana 2');
		expect((await lists.list(ana)).map(({ name }) => name)).toEqual(['Ana 1', 'Ana 2']);
		expect((await lists.list(ben)).map(({ name }) => name)).toEqual(['Ben 1']);
		expect(await lists.list(await newUser())).toEqual([]);
	});

	it('refuses to create a list for an unknown user', async () => {
		expect(await refusal(lists.create(randomUUID(), 'Personne'))).toBe('not_found');
	});

	it('[AC-19] go with the account when it is deleted', async () => {
		const userId = await newUser();
		const { id } = await lists.create(userId, 'Mots');
		await lists.addWord(userId, id, 'котка');
		await account.remove(userId);
		expect(await db.selectFrom('word_lists').where('id', '=', id).selectAll().execute()).toEqual(
			[]
		);
		expect(
			await db.selectFrom('word_list_words').where('list_id', '=', id).selectAll().execute()
		).toEqual([]);
	});
});
