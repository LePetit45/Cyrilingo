import type { SectionId } from '@cyrilingo/core/content/types.js';
import type { Generated } from 'kysely';

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

export interface UsersTable {
	id: Generated<string>;
	email: string;
	email_verified: Generated<boolean>;
	password_hash: string | null;
	exam_passed_at: Date | null;
	created_at: Generated<Date>;
}

export type SessionKind = 'browser' | 'agent';

export interface SessionsTable {
	/** SHA-256 of the token, in hex. */
	id: string;
	user_id: string;
	kind: SessionKind;
	expires_at: Date;
	created_at: Generated<Date>;
}

export interface Database {
	letters: LettersTable;
	lessons: LessonsTable;
	lesson_letters: LessonLettersTable;
	words: WordsTable;
	users: UsersTable;
	sessions: SessionsTable;
}
