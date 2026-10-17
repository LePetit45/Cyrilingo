import { describe, expect, it } from 'vitest';
import type { Question } from './questions.js';
import {
	answer,
	createSession,
	currentQuestion,
	isExamPassed,
	isFinished,
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
});
