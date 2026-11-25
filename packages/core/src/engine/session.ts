// Playing a list of questions: lessons and free review repeat missed questions until each one is
// answered correctly (spec §4.5); the final exam counts every answer once (spec §4.6).
import { BULGARIAN_ALPHABET, type BulgarianLetter } from '../alphabet.js';
import type { Question } from './questions.js';

/** Share of correct answers needed to pass the final exam (spec §4.6, §12). */
export const EXAM_PASS_RATE = 0.9;

/** A missed question comes back after this many other questions, when there are enough left. */
export const REPEAT_GAP = 3;

export interface Session {
	/** The planned questions. */
	readonly questions: readonly Question[];
	/** Indexes into `questions` of the questions left to answer; the first one is the current one. */
	readonly queue: readonly number[];
	/** Whether missed questions come back until answered correctly (lessons, free review). */
	readonly repeatMisses: boolean;
	/** Indexes of the questions answered correctly. */
	readonly correct: readonly number[];
	/** Indexes of the questions answered wrong at least once. */
	readonly missed: readonly number[];
	/**
	 * Indexes of the read-aloud questions that ended without a right answer and never come back
	 * (SPEC.md › The model feature): failed twice, skipped, or unavailable.
	 */
	readonly passed: readonly number[];
	/** Letters to work on again, from wrong answers. */
	readonly missedLetters: readonly BulgarianLetter[];
}

export interface Answer {
	correct: boolean;
	/** Letters to list in the summary when the answer is wrong (see `lettersMissed`). */
	missedLetters?: readonly BulgarianLetter[];
}

export function createSession(
	questions: readonly Question[],
	{ repeatMisses }: { repeatMisses: boolean }
): Session {
	return {
		questions,
		queue: questions.map((_, index) => index),
		repeatMisses,
		correct: [],
		missed: [],
		passed: [],
		missedLetters: []
	};
}

/** The question to answer now, or undefined once the session is over. */
export function currentQuestion(session: Session): Question | undefined {
	const index = session.queue[0];
	return index === undefined ? undefined : session.questions[index];
}

export function isFinished(session: Session): boolean {
	return session.queue.length === 0;
}

/**
 * Records the answer to the current question. With `repeatMisses`, a wrong answer sends the
 * question back a few places later in the queue.
 */
export function answer(session: Session, { correct, missedLetters = [] }: Answer): Session {
	const [index, ...rest] = session.queue;
	if (index === undefined) throw new Error('The session is over');
	if (correct) return { ...session, queue: rest, correct: [...session.correct, index] };

	const queue = session.repeatMisses
		? [...rest.slice(0, REPEAT_GAP), index, ...rest.slice(REPEAT_GAP)]
		: rest;
	return {
		...session,
		queue,
		missed: session.missed.includes(index) ? session.missed : [...session.missed, index],
		missedLetters: [...new Set([...session.missedLetters, ...missedLetters])]
	};
}

/**
 * A failed try at the current read-aloud question: it counts as missed in the summary, and stays
 * current for the second try (AC-43).
 */
export function missTry(session: Session): Session {
	const index = session.queue[0];
	if (index === undefined) throw new Error('The session is over');
	if (session.missed.includes(index)) return session;
	return { ...session, missed: [...session.missed, index] };
}

/**
 * Moves on from the current read-aloud question without a right answer: it never comes back
 * (AC-43). With `dropReadAloud` (« Je ne peux pas parler », unavailable), the read-aloud
 * questions still to come are taken out as well (AC-41). A passed question with no failed try
 * is left out of the summary's rate.
 */
export function pass(session: Session, { dropReadAloud = false } = {}): Session {
	const [index, ...rest] = session.queue;
	if (index === undefined) throw new Error('The session is over');
	const dropped = dropReadAloud
		? rest.filter((other) => session.questions[other].kind === 'readAloud')
		: [];
	return {
		...session,
		queue: rest.filter((other) => !dropped.includes(other)),
		passed: [...session.passed, index, ...dropped]
	};
}

/**
 * How far the learner is, from 0 to 1. With `repeatMisses`, only correct answers and passed
 * read-aloud questions move it forward (spec §4.5); otherwise every answer does.
 */
export function progress(session: Session): number {
	const total = session.questions.length;
	if (total === 0) return 1;
	const done = session.repeatMisses
		? session.correct.length + session.passed.length
		: total - session.queue.length;
	return done / total;
}

export interface Summary {
	/** Number of questions counted: the planned ones, less those passed without a try. */
	total: number;
	/**
	 * Questions answered correctly on the first try. For the exam, where nothing is repeated,
	 * this is the score.
	 */
	firstTry: number;
	/** `firstTry / total`, from 0 to 1. */
	rate: number;
	/** Letters missed during the session, in alphabetical order. */
	missedLetters: BulgarianLetter[];
}

/** End-of-session summary (spec §6): first-try success rate and missed letters. */
export function summarize(session: Session): Summary {
	const untried = session.passed.filter((index) => !session.missed.includes(index));
	const total = session.questions.length - untried.length;
	const firstTry = session.correct.filter((index) => !session.missed.includes(index)).length;
	return {
		total,
		firstTry,
		rate: total === 0 ? 1 : firstTry / total,
		missedLetters: BULGARIAN_ALPHABET.filter((letter) => session.missedLetters.includes(letter))
	};
}

/** Whether an exam summary is a pass (spec §4.6). */
export function isExamPassed(summary: Summary): boolean {
	return summary.rate >= EXAM_PASS_RATE;
}

/** The fewest correct answers out of `total` that pass the exam (spec §4.6): 27 out of 30. */
export function examPassMark(total: number): number {
	let mark = Math.floor(total * EXAM_PASS_RATE);
	while (mark / total < EXAM_PASS_RATE) mark++;
	return mark;
}
