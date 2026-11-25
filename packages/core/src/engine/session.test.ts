import { describe, expect, it } from 'vitest';
import type { Question } from './questions.js';
import {
	answer,
	createSession,
	currentQuestion,
	examPassMark,
	isExamPassed,
	isFinished,
	missTry,
	pass,
	progress,
	REPEAT_GAP,
	summarize,
	type Session
} from './session.js';

const QUESTIONS: Question[] = ['ма', 'та', 'ам', 'ат', 'ко', 'ке'].map((reading) => ({
	kind: 'reading',
	reading: reading as 'ма'
}));

const reading = (session: Session) => {
	const question = currentQuestion(session);
	return question?.kind === 'reading' ? question.reading : undefined;
};

describe('a lesson session (repeating misses)', () => {
	const start = () => createSession(QUESTIONS, { repeatMisses: true });

	it('plays the questions in order', () => {
		let session = start();
		expect(reading(session)).toBe('ма');
		session = answer(session, { correct: true });
		expect(reading(session)).toBe('та');
		expect(progress(session)).toBeCloseTo(1 / 6);
	});

	it('does not move the progress bar on a wrong answer, and repeats the question later', () => {
		let session = answer(start(), { correct: false, missedLetters: ['М'] });
		expect(progress(session)).toBe(0);
		expect(session.queue).toHaveLength(QUESTIONS.length);
		const order: (string | undefined)[] = [];
		while (!isFinished(session)) {
			order.push(reading(session));
			session = answer(session, { correct: true });
		}
		expect(order).toEqual(['та', 'ам', 'ат', 'ма', 'ко', 'ке']);
		expect(order.indexOf('ма')).toBe(REPEAT_GAP);
		expect(progress(session)).toBe(1);
	});

	it('brings a missed question back right away when nothing else is left', () => {
		let session = createSession(QUESTIONS.slice(0, 1), { repeatMisses: true });
		session = answer(session, { correct: false });
		expect(reading(session)).toBe('ма');
		expect(isFinished(session)).toBe(false);
	});

	it('ends once every question has been answered correctly', () => {
		let session = start();
		let answers = 0;
		while (!isFinished(session)) {
			session = answer(session, { correct: answers++ % 3 !== 0 });
		}
		expect(answers).toBeGreaterThan(QUESTIONS.length);
		expect(currentQuestion(session)).toBeUndefined();
		expect(() => answer(session, { correct: true })).toThrow();
	});

	it('scores first-try answers and lists missed letters alphabetically', () => {
		let session = start();
		session = answer(session, { correct: false, missedLetters: ['М', 'А'] });
		session = answer(session, { correct: false, missedLetters: ['Т'] });
		while (!isFinished(session)) {
			session = answer(session, { correct: true });
		}
		expect(summarize(session)).toEqual({
			total: 6,
			firstTry: 4,
			rate: 4 / 6,
			missedLetters: ['А', 'М', 'Т']
		});
	});

	it('counts a question missed twice once', () => {
		let session = createSession(QUESTIONS.slice(0, 1), { repeatMisses: true });
		session = answer(session, { correct: false, missedLetters: ['М'] });
		session = answer(session, { correct: false, missedLetters: ['М'] });
		session = answer(session, { correct: true });
		expect(summarize(session)).toMatchObject({ total: 1, firstTry: 0, missedLetters: ['М'] });
	});
});

describe('an exam session (no repeats)', () => {
	const start = (questions = QUESTIONS) => createSession(questions, { repeatMisses: false });

	it('moves on after a wrong answer, and every answer moves the progress bar', () => {
		const session = answer(start(), { correct: false });
		expect(reading(session)).toBe('та');
		expect(progress(session)).toBeCloseTo(1 / 6);
	});

	it('ends after one answer per question', () => {
		let session = start();
		for (let i = 0; i < QUESTIONS.length; i++) session = answer(session, { correct: i % 2 === 0 });
		expect(isFinished(session)).toBe(true);
		expect(summarize(session)).toMatchObject({ total: 6, firstTry: 3 });
	});

	it('is passed with at least 90% correct answers', () => {
		const exam = Array.from({ length: 30 }, () => QUESTIONS[0]);
		const play = (wrong: number) => {
			let session = start(exam);
			for (let i = 0; i < exam.length; i++) session = answer(session, { correct: i >= wrong });
			return isExamPassed(summarize(session));
		};
		expect(play(0)).toBe(true);
		expect(play(3)).toBe(true);
		expect(play(4)).toBe(false);
	});

	it('needs 27 correct answers out of 30', () => {
		expect(examPassMark(30)).toBe(27);
		expect(examPassMark(10)).toBe(9);
	});
});

describe('read-aloud questions in a lesson session', () => {
	// A reading, two read-aloud questions, then another reading.
	const MIXED: Question[] = [
		{ kind: 'reading', reading: 'ма' },
		{ kind: 'readAloud', word: 'мама' },
		{ kind: 'readAloud', word: 'котка' },
		{ kind: 'reading', reading: 'та' }
	];
	const atFirstReadAloud = () =>
		answer(createSession(MIXED, { repeatMisses: true }), { correct: true });

	it('[AC-43] a right answer counts on the first try', () => {
		const session = answer(atFirstReadAloud(), { correct: true });
		expect(currentQuestion(session)).toEqual({ kind: 'readAloud', word: 'котка' });
		expect(progress(session)).toBe(2 / 4);
	});

	it('[AC-43] a failed try keeps the question for a second try and counts it as missed', () => {
		let session = missTry(atFirstReadAloud());
		expect(currentQuestion(session)).toEqual({ kind: 'readAloud', word: 'мама' });
		expect(progress(session)).toBe(1 / 4);
		session = answer(missTry(session), { correct: true });
		expect(currentQuestion(session)).toEqual({ kind: 'readAloud', word: 'котка' });
		for (const next of [{ correct: true }, { correct: true }]) session = answer(session, next);
		expect(isFinished(session)).toBe(true);
		expect(summarize(session)).toMatchObject({ total: 4, firstTry: 3 });
	});

	it('[AC-43] after 2 failed tries the question is passed: the bar moves on and it never comes back', () => {
		let session = pass(missTry(missTry(atFirstReadAloud())));
		expect(progress(session)).toBe(2 / 4);
		expect(currentQuestion(session)).toEqual({ kind: 'readAloud', word: 'котка' });
		session = answer(answer(session, { correct: true }), { correct: true });
		expect(isFinished(session)).toBe(true);
		expect(summarize(session)).toMatchObject({ total: 4, firstTry: 3, missedLetters: [] });
	});

	it('[AC-41] skipping removes the read-aloud questions to come and counts neither right nor wrong', () => {
		let session = pass(atFirstReadAloud(), { dropReadAloud: true });
		expect(currentQuestion(session)).toEqual({ kind: 'reading', reading: 'та' });
		expect(progress(session)).toBe(3 / 4);
		session = answer(session, { correct: true });
		expect(isFinished(session)).toBe(true);
		expect(summarize(session)).toMatchObject({ total: 2, firstTry: 2, rate: 1 });
	});

	it('[AC-41] an unavailable second try still counts the failed first try', () => {
		const session = pass(missTry(atFirstReadAloud()), { dropReadAloud: true });
		const done = answer(session, { correct: true });
		expect(summarize(done)).toMatchObject({ total: 3, firstTry: 2 });
	});

	it('refuses to go on once the session is over', () => {
		const over = createSession([], { repeatMisses: true });
		expect(() => missTry(over)).toThrow('The session is over');
		expect(() => pass(over)).toThrow('The session is over');
	});
});
