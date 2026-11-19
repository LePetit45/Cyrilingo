import type { Db } from './database.js';

// Queries on personal word lists. Every query on a list is scoped to its owner: a list of
// somebody else is not found, exactly like a missing one (SPEC.md › Authorization).

export interface WordListRow {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	/** The list's words, in the order they were added. */
	words: string[];
}

const listColumns = ['id', 'name', 'created_at as createdAt', 'updated_at as updatedAt'] as const;

/** The user's lists, oldest first, with their words. */
export async function findWordLists(db: Db, userId: string): Promise<WordListRow[]> {
	const lists = await db
		.selectFrom('word_lists')
		.select(listColumns)
		.where('user_id', '=', userId)
		.orderBy('created_at')
		.orderBy('id')
		.execute();
	if (lists.length === 0) return [];
	const words = await db
		.selectFrom('word_list_words')
		.select(['list_id', 'word_id'])
		.where(
			'list_id',
			'in',
			lists.map(({ id }) => id)
		)
		.orderBy('added_at')
		.orderBy('word_id')
		.execute();
	return lists.map((list) => ({
		...list,
		words: words.filter(({ list_id }) => list_id === list.id).map(({ word_id }) => word_id)
	}));
}

/** One of the user's lists, or undefined when the user has no list with this id. */
export async function findWordList(
	db: Db,
	userId: string,
	listId: string
): Promise<WordListRow | undefined> {
	return (await findWordLists(db, userId)).find(({ id }) => id === listId);
}

/**
 * Creates a list, unless the user already has `max` lists. The user's row is locked meanwhile,
 * so two requests at once cannot both pass the limit. Undefined for an unknown user.
 */
export async function insertWordList(
	db: Db,
	userId: string,
	{ name, max, at }: { name: string; max: number; at: Date }
): Promise<{ id: string } | 'limit' | undefined> {
	return db.transaction().execute(async (trx) => {
		const user = await trx
			.selectFrom('users')
			.select('id')
			.where('id', '=', userId)
			.forUpdate()
			.executeTakeFirst();
		if (!user) return undefined;
		const { count } = await trx
			.selectFrom('word_lists')
			.select((eb) => eb.fn.countAll<string>().as('count'))
			.where('user_id', '=', userId)
			.executeTakeFirstOrThrow();
		if (Number(count) >= max) return 'limit';
		return trx
			.insertInto('word_lists')
			.values({ user_id: userId, name, created_at: at, updated_at: at })
			.returning('id')
			.executeTakeFirstOrThrow();
	});
}

/** Renames one of the user's lists. False when the user has no list with this id. */
export async function renameWordList(
	db: Db,
	userId: string,
	listId: string,
	{ name, at }: { name: string; at: Date }
): Promise<boolean> {
	const result = await db
		.updateTable('word_lists')
		.set({ name, updated_at: at })
		.where('id', '=', listId)
		.where('user_id', '=', userId)
		.executeTakeFirst();
	return result.numUpdatedRows > 0n;
}

/** Deletes one of the user's lists and its words (cascade). False when there is no such list. */
export async function deleteWordList(db: Db, userId: string, listId: string): Promise<boolean> {
	const result = await db
		.deleteFrom('word_lists')
		.where('id', '=', listId)
		.where('user_id', '=', userId)
		.executeTakeFirst();
	return result.numDeletedRows > 0n;
}

/** True when the corpus has this word (syllables are not words). */
export async function isCorpusWord(db: Db, word: string): Promise<boolean> {
	const row = await db
		.selectFrom('words')
		.select('id')
		.where('id', '=', word)
		.where('kind', '=', 'word')
		.executeTakeFirst();
	return row !== undefined;
}

/**
 * Adds a corpus word to one of the user's lists, unless the list has it already or holds `max`
 * words. The list's row is locked meanwhile, so two requests at once cannot both pass the limit.
 */
export async function insertListWord(
	db: Db,
	userId: string,
	listId: string,
	{ word, max, at }: { word: string; max: number; at: Date }
): Promise<'added' | 'not_found' | 'duplicate' | 'full'> {
	return db.transaction().execute(async (trx) => {
		const list = await trx
			.selectFrom('word_lists')
			.select('id')
			.where('id', '=', listId)
			.where('user_id', '=', userId)
			.forUpdate()
			.executeTakeFirst();
		if (!list) return 'not_found';
		const words = await trx
			.selectFrom('word_list_words')
			.select('word_id')
			.where('list_id', '=', listId)
			.execute();
		if (words.some(({ word_id }) => word_id === word)) return 'duplicate';
		if (words.length >= max) return 'full';
		await trx
			.insertInto('word_list_words')
			.values({ list_id: listId, word_id: word, added_at: at })
			.execute();
		await trx.updateTable('word_lists').set({ updated_at: at }).where('id', '=', listId).execute();
		return 'added';
	});
}

/**
 * Removes a word from one of the user's lists. False when the user has no such list, or the list
 * does not hold this word.
 */
export async function deleteListWord(
	db: Db,
	userId: string,
	listId: string,
	{ word, at }: { word: string; at: Date }
): Promise<boolean> {
	return db.transaction().execute(async (trx) => {
		const result = await trx
			.deleteFrom('word_list_words')
			.where('list_id', '=', listId)
			.where('word_id', '=', word)
			.where((eb) =>
				eb.exists(
					eb
						.selectFrom('word_lists')
						.select('id')
						.where('id', '=', listId)
						.where('user_id', '=', userId)
				)
			)
			.executeTakeFirst();
		if (result.numDeletedRows === 0n) return false;
		await trx.updateTable('word_lists').set({ updated_at: at }).where('id', '=', listId).execute();
		return true;
	});
}
