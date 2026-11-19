import { officialTransliteration } from '@cyrilingo/core/reading.js';
import type { Db } from '../db/database.js';
import {
	deleteListWord,
	deleteWordList,
	findWordList,
	findWordLists,
	insertListWord,
	insertWordList,
	isCorpusWord,
	renameWordList,
	type WordListRow
} from '../db/word-lists.js';
import { ServiceError } from './errors.js';

/** Lists a learner may have (AC-30). */
export const MAX_WORD_LISTS = 20;
/** Words a list may hold (AC-31). */
export const MAX_WORDS_PER_LIST = 200;
/** Characters of a list name, once trimmed (AC-30). */
export const MAX_LIST_NAME_LENGTH = 40;

/** A word of a list: the Cyrillic text and its official Latin transliteration. */
export interface ListWord {
	cyrillic: string;
	latin: string;
}

/** A personal word list, as the HTTP routes and the MCP tools answer it. */
export interface WordList {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	/** In the order they were added. */
	words: ListWord[];
}

export interface WordListService {
	/** The acting user's lists, oldest first (AC-33). */
	list(userId: string): Promise<WordList[]>;
	/** Creates an empty list (AC-30). */
	create(userId: string, name: string): Promise<WordList>;
	rename(userId: string, listId: string, name: string): Promise<WordList>;
	/** Deletes a list and every word in it. */
	remove(userId: string, listId: string): Promise<void>;
	/** Adds a corpus word, written in Cyrillic (AC-31). */
	addWord(userId: string, listId: string, word: string): Promise<WordList>;
	removeWord(userId: string, listId: string, word: string): Promise<WordList>;
}

// List ids are UUIDs; any other id names no list, and must not reach PostgreSQL as one.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Personal word lists (SPEC.md › Word lists and authorization). Every function takes the acting
 * user's id first, and a list owned by somebody else is `not_found`, exactly like a missing one
 * (AC-32): ids cannot be probed.
 */
export function createWordListService(db: Db, now: () => Date = () => new Date()): WordListService {
	async function get(userId: string, listId: string): Promise<WordList> {
		const list = UUID.test(listId) ? await findWordList(db, userId, listId) : undefined;
		if (!list) throw new ServiceError('not_found');
		return present(list);
	}

	function checkListId(listId: string): void {
		if (!UUID.test(listId)) throw new ServiceError('not_found');
	}

	return {
		async list(userId) {
			return (await findWordLists(db, userId)).map(present);
		},

		async create(userId, name) {
			const created = await insertWordList(db, userId, {
				name: listName(name),
				max: MAX_WORD_LISTS,
				at: now()
			});
			if (created === undefined) throw new ServiceError('not_found');
			if (created === 'limit') throw new ServiceError('list_limit_reached');
			return get(userId, created.id);
		},

		async rename(userId, listId, name) {
			const newName = listName(name);
			checkListId(listId);
			if (!(await renameWordList(db, userId, listId, { name: newName, at: now() }))) {
				throw new ServiceError('not_found');
			}
			return get(userId, listId);
		},

		async remove(userId, listId) {
			checkListId(listId);
			if (!(await deleteWordList(db, userId, listId))) throw new ServiceError('not_found');
		},

		async addWord(userId, listId, word) {
			checkListId(listId);
			const text = word.trim().normalize('NFC');
			// The list comes first: somebody else's list must not tell whether a word exists.
			await get(userId, listId);
			if (!(await isCorpusWord(db, text))) throw new ServiceError('unknown_word');
			const outcome = await insertListWord(db, userId, listId, {
				word: text,
				max: MAX_WORDS_PER_LIST,
				at: now()
			});
			if (outcome === 'not_found') throw new ServiceError('not_found');
			if (outcome === 'duplicate') throw new ServiceError('word_already_in_list');
			if (outcome === 'full') throw new ServiceError('list_full');
			return get(userId, listId);
		},

		async removeWord(userId, listId, word) {
			checkListId(listId);
			const text = word.trim().normalize('NFC');
			if (!(await deleteListWord(db, userId, listId, { word: text, at: now() }))) {
				throw new ServiceError('not_found');
			}
			return get(userId, listId);
		}
	};
}

/** The trimmed name, or `invalid_list_name` when it is empty or too long. */
function listName(name: string): string {
	const trimmed = name.trim();
	const length = [...trimmed].length;
	if (length === 0 || length > MAX_LIST_NAME_LENGTH) throw new ServiceError('invalid_list_name');
	return trimmed;
}

function present({ words, ...list }: WordListRow): WordList {
	return {
		...list,
		words: words.map((cyrillic) => ({ cyrillic, latin: officialTransliteration(cyrillic) }))
	};
}
