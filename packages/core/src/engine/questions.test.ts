import { describe, expect, it } from 'vitest';
import { BULGARIAN_ALPHABET, type BulgarianLetter } from '../alphabet.js';
import { lettersKnownIn } from '../content/course.js';
import { LETTERS } from '../content/letters.js';
import { seededRandom } from '../random.js';
import { checkReading, lettersIn } from '../reading.js';
import {
	CHOICE_COUNT,
	CONFUSABLE_LETTERS,
	LATIN_TRAPS,
	letterToSound,
	lettersMissed,
	readingFor,
	soundToLetter,
	type SoundChoice
} from './questions.js';

const SEEDS = Array.from({ length: 200 }, (_, seed) => seed);
const ALL = BULGARIAN_ALPHABET;

function choiceKey(choice: SoundChoice): string {
	return 'letter' in choice ? `letter:${choice.letter}` : `latin:${choice.latin}`;
}

describe('confusion tables', () => {
	it('only offer traps that are not an accepted spelling of the letter', () => {
		for (const [letter, latin] of Object.entries(LATIN_TRAPS)) {
			expect(LETTERS[letter as BulgarianLetter].accepted).not.toContain(latin);
		}
	});

	it('pair distinct letters', () => {
		for (const [letter, others] of Object.entries(CONFUSABLE_LETTERS)) {
			expect(others).not.toContain(letter);
		}
	});
});

describe('letterToSound', () => {
	it('offers 4 distinct choices including the right one', () => {
		for (const seed of SEEDS) {
			const letter = ALL[seed % ALL.length];
			const question = letterToSound(letter, ALL, seededRandom(seed));
			expect(question.choices).toHaveLength(CHOICE_COUNT);
			expect(new Set(question.choices.map(choiceKey)).size).toBe(CHOICE_COUNT);
			expect(question.choices).toContainEqual({ letter });
		}
	});

	it('never offers a letter that may be spelled like the Latin trap', () => {
		for (const seed of SEEDS) {
			const question = letterToSound('У', ALL, seededRandom(seed));
			const trap = question.choices.find((choice) => 'latin' in choice);
			if (!trap) continue;
			expect(trap).toEqual({ latin: 'y' });
			expect(question.choices).not.toContainEqual({ letter: 'Й' });
		}
	});

	it('sometimes offers the Latin trap of a false friend', () => {
		const traps = SEEDS.filter((seed) =>
			letterToSound('Р', ALL, seededRandom(seed)).choices.some((choice) => 'latin' in choice)
		);
		expect(traps.length).toBeGreaterThan(SEEDS.length / 2);
		expect(traps.length).toBeLessThan(SEEDS.length);
	});
});

describe('soundToLetter', () => {
	it('offers 4 distinct letters including the right one', () => {
		for (const seed of SEEDS) {
			const letter = ALL[seed % ALL.length];
			const question = soundToLetter(letter, ALL, seededRandom(seed));
			expect(question.choices).toHaveLength(CHOICE_COUNT);
			expect(new Set(question.choices).size).toBe(CHOICE_COUNT);
			expect(question.choices).toContain(letter);
		}
	});

	it('prefers known letters', () => {
		const known = lettersKnownIn('l3');
		for (const seed of SEEDS) {
			const question = soundToLetter('Н', known, seededRandom(seed));
			for (const choice of question.choices) expect(known).toContain(choice);
		}
	});

	it('fills in with other letters when too few are known', () => {
		const known = lettersKnownIn('l1');
		const question = soundToLetter('А', known, seededRandom(1));
		expect(question.choices).toHaveLength(CHOICE_COUNT);
		expect(question.choices.filter((choice) => known.includes(choice))).toHaveLength(3);
	});

	it('sometimes offers a known confusable letter', () => {
		const known = lettersKnownIn('l9');
		const traps = SEEDS.filter((seed) =>
			soundToLetter('Ш', known, seededRandom(seed)).choices.includes('Щ')
		);
		expect(traps.length).toBeGreaterThan(SEEDS.length / 2);
	});
});

describe('readingFor', () => {
	it('picks an unused word containing the letter, readable with the known letters', () => {
		const known = lettersKnownIn('l4');
		for (const seed of SEEDS) {
			const reading = readingFor('В', known, ['Варна'], seededRandom(seed))!;
			expect(lettersIn(reading)).toContain('В');
			for (const letter of lettersIn(reading)) expect(known).toContain(letter);
			expect(reading).not.toBe('Варна');
		}
	});

	it('falls back to a syllable, then to nothing', () => {
		const known = lettersKnownIn('l1');
		expect(readingFor('М', known, ['мама', 'там', 'мат'], seededRandom(1))).toMatch(/^(ма|ам)$/);
		expect(
			readingFor('М', known, ['мама', 'там', 'мат', 'ма', 'ам'], seededRandom(1))
		).toBeUndefined();
	});

	it('can be limited to words', () => {
		const known = lettersKnownIn('l1');
		expect(
			readingFor('М', known, ['мама', 'там', 'мат'], seededRandom(1), { wordsOnly: true })
		).toBeUndefined();
	});
});

describe('lettersMissed', () => {
	it('is the letter asked in a multiple-choice question', () => {
		expect(lettersMissed(soundToLetter('Ж', ALL, seededRandom(1)))).toEqual(['Ж']);
	});

	it('lists the wrong letters of an aligned reading', () => {
		const question = { kind: 'reading', reading: 'ресторант' } as const;
		expect(lettersMissed(question, checkReading('ресторант', 'pectopant'))).toEqual(['Р', 'С']);
	});

	it('falls back to the target letter, then to every letter of the reading', () => {
		expect(lettersMissed({ kind: 'reading', reading: 'жена', letter: 'Ж' })).toEqual(['Ж']);
		expect(lettersMissed({ kind: 'reading', reading: 'мама' }, checkReading('мама', 'x'))).toEqual([
			'М',
			'А'
		]);
	});
});
