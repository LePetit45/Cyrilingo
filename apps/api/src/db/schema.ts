import type { SectionId } from '@cyrilingo/core/content/types.js';

// Row types of every table, as Kysely sees them. Kept in step with migrations/ by hand: each
// migration that changes a table changes its interface here.

export interface LettersTable {
	id: string;
	section: SectionId;
	position: number;
}

export interface LessonsTable {
	id: string;
	section: SectionId;
	position: number;
}

export interface LessonLettersTable {
	lesson_id: string;
	letter_id: string;
	position: number;
}

export interface WordsTable {
	id: string;
	kind: 'word' | 'syllable';
}

export interface Database {
	letters: LettersTable;
	lessons: LessonsTable;
	lesson_letters: LessonLettersTable;
	words: WordsTable;
}
