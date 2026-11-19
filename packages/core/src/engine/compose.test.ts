import { describe, expect, it } from 'vitest';
import { BULGARIAN_ALPHABET, type BulgarianLetter } from '../alphabet.js';
import { getLesson, LESSONS, lettersKnownIn } from '../content/course.js';
import { isWord, WORDS } from '../content/corpus.js';
import { seededRandom } from '../random.js';
import { lettersIn } from '../reading.js';
import {
	composeExam,
	composeFreeReview,
	composeLesson,
	composeListReview,
	EXAM_QUESTION_COUNT,
	EXAM_READING_COUNT,
	FREE_REVIEW_COUNT,
	LIST_REVIEW_COUNT,
	READ_ALOUD_COUNT,
	readAloudWords,
	reviewLetters
} from './compose.js';
import type { Question } from './questions.js';

const SEEDS = Array.from({ length: 50 }, (_, seed) => seed);

/** Every letter a question shows: asked letter, choices, reading. */
function lettersShown(question: Question): BulgarianLetter[] {
	if (question.kind === 'reading') return lettersIn(question.reading);
	if (question.kind === 'readAloud') return lettersIn(question.word);
	if (question.kind === 'soundToLetter') return [...question.choices];
	return [question.letter];
}

describe('composeLesson', () => {
	it('has 9 questions on the new letters, 3 mixed readings, then up to 4 review questions', () => {
		const sizes = LESSONS.map((lesson) => composeLesson(lesson.id, seededRandom(1)).length);
		expect(sizes).toEqual([12, 15, 16, 16, 16, 16, 16, 16, 16, 16]);
	});

	it('takes every new letter through the three exercise types', () => {
		for (const lesson of LESSONS) {
			for (const seed of SEEDS) {
				const questions = composeLesson(lesson.id, seededRandom(seed)).slice(0, 9);
				for (const letter of lesson.letters) {
					const onLetter = questions.filter((question) => question.letter === letter);
					expect(onLetter.map((question) => question.kind).sort()).toEqual([
						'letterToSound',
						'reading',
						'soundToLetter'
					]);
					const reading = onLetter.find((question) => question.kind === 'reading');
					expect(lettersIn(reading?.kind === 'reading' ? reading.reading : '')).toContain(letter);
				}
			}
		}
	});

	it('follows with readings mixing new and earlier letters', () => {
		for (const lesson of LESSONS.slice(1)) {
			for (const seed of SEEDS) {
				const mixed = composeLesson(lesson.id, seededRandom(seed)).slice(9, 12);
				for (const question of mixed) {
					expect(question.kind).toBe('reading');
					const letters = question.kind === 'reading' ? lettersIn(question.reading) : [];
					const isNew = (letter: BulgarianLetter) => lesson.letters.includes(letter);
					expect(letters.some(isNew)).toBe(true);
					expect(letters.some((letter) => !isNew(letter))).toBe(true);
				}
			}
		}
	});

	it('reads words rather than syllables from the second lesson on', () => {
		for (const lesson of LESSONS.slice(1)) {
			for (const seed of SEEDS) {
				for (const question of composeLesson(lesson.id, seededRandom(seed)).slice(0, 12)) {
					if (question.kind === 'reading') expect(isWord(question.reading)).toBe(true);
				}
			}
		}
	});

	it('shows other words when a lesson is replayed', () => {
		const readings = (seed: number) =>
			composeLesson('l6', seededRandom(seed)).flatMap((question) =>
				question.kind === 'reading' ? [question.reading] : []
			);
		const first = readings(1);
		const shared = readings(2).filter((reading) => first.includes(reading));
		expect(shared.length).toBeLessThan(first.length / 2);
	});

	it('ends with review questions on earlier letters', () => {
		for (const seed of SEEDS) {
			const review = composeLesson('l7', seededRandom(seed)).slice(12);
			const earlier = lettersKnownIn('l6');
			for (const question of review) expect(earlier).toContain(question.letter);
		}
	});

	it('only reads known letters, and never repeats a reading', () => {
		for (const lesson of LESSONS) {
			for (const seed of SEEDS) {
				const questions = composeLesson(lesson.id, seededRandom(seed));
				const known = lettersKnownIn(lesson.id);
				const readings = questions.flatMap((question) =>
					question.kind === 'reading' ? [question.reading] : []
				);
				expect(new Set(readings).size).toBe(readings.length);
				for (const reading of readings) {
					for (const letter of lettersIn(reading)) expect(known).toContain(letter);
				}
			}
		}
	});

	it('shows only known letters from the third lesson on', () => {
		for (const lesson of LESSONS.slice(2)) {
			for (const seed of SEEDS) {
				const known = lettersKnownIn(lesson.id);
				for (const question of composeLesson(lesson.id, seededRandom(seed))) {
					for (const letter of lettersShown(question)) expect(known).toContain(letter);
				}
			}
		}
	});

	it('avoids two questions in a row on the same new letter', () => {
		const questions = composeLesson('l5', seededRandom(4)).slice(0, 9);
		for (let i = 1; i < questions.length; i++) {
			expect(questions[i].letter).not.toBe(questions[i - 1].letter);
		}
	});

	it('is reproducible with a seed and varies otherwise', () => {
		expect(composeLesson('l3', seededRandom(7))).toEqual(composeLesson('l3', seededRandom(7)));
		expect(composeLesson('l3', seededRandom(7))).not.toEqual(composeLesson('l3', seededRandom(8)));
	});
});

describe('reviewLetters', () => {
	const lessonOf = (letter: BulgarianLetter) =>
		LESSONS.findIndex((lesson) => lesson.letters.includes(letter));

	it('has nothing to review in the first lesson', () => {
		expect(reviewLetters('l1', seededRandom(1))).toEqual([]);
	});

	it('reviews the letters of the only earlier lessons', () => {
		expect(reviewLetters('l2', seededRandom(1)).sort()).toEqual(['А', 'М', 'Т']);
		expect(reviewLetters('l3', seededRandom(1))).toHaveLength(4);
	});

	it('takes half from the 2 previous lessons and half from older ones', () => {
		for (const seed of SEEDS) {
			const letters = reviewLetters('l8', seededRandom(seed));
			expect(new Set(letters).size).toBe(4);
			expect(letters.filter((letter) => lessonOf(letter) >= 5)).toHaveLength(2);
			expect(letters.filter((letter) => lessonOf(letter) < 5)).toHaveLength(2);
		}
	});
});

describe('composeFreeReview', () => {
	it('is empty before any lesson is completed', () => {
		expect(composeFreeReview([], seededRandom(1))).toEqual([]);
	});

	it('asks 12 questions on letters of completed lessons', () => {
		for (const seed of SEEDS) {
			const questions = composeFreeReview(['l2', 'l5'], seededRandom(seed));
			expect(questions).toHaveLength(FREE_REVIEW_COUNT);
			const completed = [...getLesson('l2').letters, ...getLesson('l5').letters];
			for (const question of questions) expect(completed).toContain(question.letter);
		}
	});

	it('reads only letters known up to the furthest completed lesson', () => {
		for (const seed of SEEDS) {
			const known = lettersKnownIn('l5');
			for (const question of composeFreeReview(['l5', 'l1'], seededRandom(seed))) {
				if (question.kind !== 'reading') continue;
				for (const letter of lettersIn(question.reading)) expect(known).toContain(letter);
			}
		}
	});

	it('covers every letter once before repeating one', () => {
		const questions = composeFreeReview(['l1', 'l2'], seededRandom(5));
		expect(new Set(questions.slice(0, 6).map((question) => question.letter)).size).toBe(6);
	});
});

describe('composeListReview', () => {
	const words = Object.keys(WORDS);

	it('[AC-34] asks a reading question on each word of a short list', () => {
		const list = ['котка', 'мама', 'България'];
		const questions = composeListReview(list, seededRandom(1));
		expect(questions).toHaveLength(3);
		expect(questions.every((question) => question.kind === 'reading')).toBe(true);
		expect(
			questions.map((question) => (question.kind === 'reading' ? question.reading : '')).sort()
		).toEqual([...list].sort());
	});

	it('[AC-34] asks on 12 distinct words of a longer list, picked at random', () => {
		const list = words.slice(0, 40);
		const first = composeListReview(list, seededRandom(1));
		expect(first).toHaveLength(LIST_REVIEW_COUNT);
		const readings = first.map((question) => (question.kind === 'reading' ? question.reading : ''));
		expect(new Set(readings).size).toBe(LIST_REVIEW_COUNT);
		for (const reading of readings) expect(list).toContain(reading);
		expect(composeListReview(list, seededRandom(2))).not.toEqual(first);
	});

	it('[AC-34] cannot review an empty list', () => {
		expect(composeListReview([], seededRandom(1))).toEqual([]);
	});

	it('leaves out words the corpus no longer has', () => {
		expect(composeListReview(['котка', 'нямаго'], seededRandom(1))).toEqual([
			{ kind: 'reading', reading: 'котка' }
		]);
	});
});

describe('composeExam', () => {
	it('asks one question per letter', () => {
		for (const seed of SEEDS) {
			const questions = composeExam(seededRandom(seed));
			expect(questions).toHaveLength(EXAM_QUESTION_COUNT);
			expect(questions.map((question) => question.letter).sort()).toEqual(
				[...BULGARIAN_ALPHABET].sort()
			);
		}
	});

	it('is mostly distinct word readings', () => {
		for (const seed of SEEDS) {
			const questions = composeExam(seededRandom(seed));
			const readings = questions.flatMap((question) =>
				question.kind === 'reading' ? [question.reading] : []
			);
			expect(readings).toHaveLength(EXAM_READING_COUNT);
			expect(readings.length).toBeGreaterThan(EXAM_QUESTION_COUNT / 2);
			expect(new Set(readings).size).toBe(readings.length);
			for (const reading of readings) expect(isWord(reading)).toBe(true);
			for (const question of questions) {
				if (question.kind === 'reading')
					expect(lettersIn(question.reading)).toContain(question.letter);
			}
		}
	});

	it('mixes the two multiple-choice types', () => {
		const kinds = composeExam(seededRandom(1)).map((question) => question.kind);
		expect(kinds.filter((kind) => kind === 'letterToSound')).toHaveLength(7);
		expect(kinds.filter((kind) => kind === 'soundToLetter')).toHaveLength(7);
	});
});

describe('read-aloud questions in a lesson', () => {
	const readAloudOf = (questions: Question[]) =>
		questions.flatMap((question) => (question.kind === 'readAloud' ? [question.word] : []));

	it('[AC-40] adds 2 read-aloud questions on words of the lesson, on top of its questions', () => {
		for (const lesson of LESSONS.slice(1)) {
			for (const seed of SEEDS.slice(0, 10)) {
				const plain = composeLesson(lesson.id, seededRandom(seed));
				const questions = composeLesson(lesson.id, seededRandom(seed), { readAloud: true });
				const words = readAloudOf(questions);
				expect(words).toHaveLength(READ_ALOUD_COUNT);
				expect(questions).toHaveLength(plain.length + READ_ALOUD_COUNT);
				// The same lesson, with the read-aloud questions taken out.
				expect(questions.filter((question) => question.kind !== 'readAloud')).toEqual(plain);
				// On words the lesson asks to read.
				const readings = plain.flatMap((q) => (q.kind === 'reading' ? [q.reading] : []));
				for (const word of words) expect(readings).toContain(word);
				expect(new Set(words).size).toBe(words.length);
			}
		}
	});

	it('[AC-40] asks them after the questions on the new letters', () => {
		for (const seed of SEEDS) {
			const questions = composeLesson('l4', seededRandom(seed), { readAloud: true });
			const first = questions.findIndex((question) => question.kind === 'readAloud');
			expect(first).toBeGreaterThanOrEqual(9);
		}
	});

	it('[AC-40] has none without the option', () => {
		for (const lesson of LESSONS) {
			expect(readAloudOf(composeLesson(lesson.id, seededRandom(1)))).toEqual([]);
		}
	});

	it('[AC-40] asks only the words among the readings of lesson 1, which reads mostly syllables', () => {
		for (const seed of SEEDS) {
			const questions = composeLesson('l1', seededRandom(seed), { readAloud: true });
			const readings = questions.flatMap((q) => (q.kind === 'reading' ? [q.reading] : []));
			const words = readAloudOf(questions);
			expect(words.length).toBeLessThanOrEqual(READ_ALOUD_COUNT);
			for (const word of words) expect(readings).toContain(word);
		}
	});

	it('[AC-40] prefers words of 2 syllables or more, and falls back on shorter ones', () => {
		for (const seed of SEEDS.slice(0, 10)) {
			expect(
				readAloudWords(['да', 'мама', 'не', 'котка', 'ма'], seededRandom(seed)).sort()
			).toEqual(['котка', 'мама']);
			const fallback = readAloudWords(['да', 'мама', 'ма'], seededRandom(seed));
			expect(fallback[0]).toBe('мама');
			expect(fallback).toHaveLength(2);
		}
		expect(readAloudWords(['мама', 'мама', 'ма'], seededRandom(1))).toEqual(['мама']);
		expect(readAloudWords(['ма', 'та'], seededRandom(1))).toEqual([]);
	});
});
