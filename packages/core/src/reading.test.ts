import { describe, expect, it } from 'vitest';
import { WORDS, type Word } from './content/corpus.js';
import { LETTERS } from './content/letters.js';
import {
	answerRuns,
	checkReading,
	letterOf,
	lettersIn,
	normalizeAnswer,
	officialTransliteration,
	transliterate
} from './reading.js';

// A French-style spelling for the tests, independent of the locale content.
const FRENCH: Record<string, string> = { Ъ: 'eu', Ь: 'yo', Ю: 'iou', Я: 'ia', У: 'ou', Х: 'kh' };
const french = (text: string) =>
	transliterate(text, (letter) => FRENCH[letter] ?? LETTERS[letter].accepted[0]);

describe('letterOf / lettersIn', () => {
	it('finds the uppercase letter of either case', () => {
		expect(letterOf('д')).toBe('Д');
		expect(letterOf('Щ')).toBe('Щ');
		expect(letterOf('d')).toBeUndefined();
		expect(letterOf('ы')).toBeUndefined();
	});

	it('lists the letters of a text, skipping other characters', () => {
		expect(lettersIn('Ста ра-За')).toEqual(['С', 'Т', 'А', 'Р', 'А', 'З', 'А']);
	});
});

describe('normalizeAnswer', () => {
	it('ignores case, accents, spaces and hyphens', () => {
		expect(normalizeAnswer(' Bălgaria ')).toBe('balgaria');
		expect(normalizeAnswer('Sta-ra Za–gora')).toBe('starazagora');
		expect(normalizeAnswer('ÉTÉ')).toBe('ete');
	});
});

describe('transliterate', () => {
	it('spells letter by letter, keeping the capital of proper names', () => {
		expect(french('шоколад')).toBe('chokolad');
		expect(french('България')).toBe('Beulgariia');
		expect(french('Варна')).toBe('Varna');
	});

	it('spells a taught combination as a unit', () => {
		expect(french('шофьор')).toBe('chofyor');
		expect(french('бульон')).toBe('boulyon');
	});

	it('keeps characters that are not Bulgarian letters', () => {
		expect(french('Стара Загора')).toBe('Stara Zagora');
	});
});

describe('officialTransliteration', () => {
	it('uses the official 2009 spelling', () => {
		expect(officialTransliteration('шоколад')).toBe('shokolad');
		expect(officialTransliteration('щастие')).toBe('shtastie');
		expect(officialTransliteration('шофьор')).toBe('shofyor');
		expect(officialTransliteration('Пловдив')).toBe('Plovdiv');
	});

	it('spells a word-final -ия « ia »', () => {
		expect(officialTransliteration('България')).toBe('Balgaria');
		expect(officialTransliteration('София')).toBe('Sofia');
	});
});

describe('checkReading', () => {
	it('accepts the French phonetic and the official transliterations', () => {
		expect(checkReading('шоколад', 'chokolad').correct).toBe(true);
		expect(checkReading('шоколад', 'shokolad').correct).toBe(true);
		expect(checkReading('България', 'beulgaria').correct).toBe(true);
		expect(checkReading('България', 'Balgaria').correct).toBe(true);
		expect(checkReading('щастие', 'chtastie').correct).toBe(true);
	});

	it('accepts both transliterations mixed within one word', () => {
		expect(checkReading('чаша', 'tchasha').correct).toBe(true);
		expect(checkReading('чаша', 'chacha').correct).toBe(true);
		expect(checkReading('къща', 'keusht').correct).toBe(false);
		expect(checkReading('къща', 'kashta').correct).toBe(true);
		expect(checkReading('къща', 'keuchta').correct).toBe(true);
	});

	it('ignores case, accents, spaces and hyphens', () => {
		expect(checkReading('България', 'Bălgaria').correct).toBe(true);
		expect(checkReading('ресторант', 'RES-TO RANT').correct).toBe(true);
	});

	it('accepts the official « ia » for a word-final -ия', () => {
		expect(checkReading('София', 'Sofia').correct).toBe(true);
		expect(checkReading('София', 'Sofiia').correct).toBe(true);
		expect(checkReading('мляко', 'mlako').correct).toBe(false);
	});

	it('accepts « yo » and « io » for ьо', () => {
		expect(checkReading('шофьор', 'chofyor').correct).toBe(true);
		expect(checkReading('шофьор', 'chofior').correct).toBe(true);
	});

	it('has no typo tolerance', () => {
		expect(checkReading('мама', 'mana').correct).toBe(false);
		expect(checkReading('мама', 'mam').correct).toBe(false);
		expect(checkReading('мама', 'mamaa').correct).toBe(false);
		expect(checkReading('шоколад', 'chocolat').correct).toBe(false);
	});

	it('accepts every corpus word spelled with its first accepted variants', () => {
		for (const word of Object.keys(WORDS) as Word[]) {
			const latin = lettersIn(word)
				.map((letter) => LETTERS[letter].accepted[0])
				.join('');
			expect(checkReading(word, latin).correct, word).toBe(true);
		}
	});

	it('aligns a correct answer letter by letter', () => {
		expect(checkReading('чай', 'tchay').letters).toEqual([
			{ char: 'ч', letter: 'Ч', typed: 'tch', correct: true },
			{ char: 'а', letter: 'А', typed: 'a', correct: true },
			{ char: 'й', letter: 'Й', typed: 'y', correct: true }
		]);
	});

	it('highlights a wrong letter', () => {
		const { letters } = checkReading('шоколад', 'chocolad');
		expect(letters?.map((check) => check.correct)).toEqual([
			true,
			true,
			false,
			true,
			true,
			true,
			true
		]);
		expect(letters?.[2].typed).toBe('c');
	});

	it('highlights false friends read as Latin letters', () => {
		const { letters } = checkReading('ресторант', 'pectopaht');
		expect(letters?.filter((check) => !check.correct).map((check) => check.char)).toEqual([
			'р',
			'с',
			'р',
			'н'
		]);
	});

	it('highlights a missing or an extra letter', () => {
		const missing = checkReading('сестра', 'sesra').letters;
		expect(missing?.find((check) => !check.correct)).toMatchObject({ char: 'т', typed: '' });

		const extra = checkReading('кафе', 'kaffe').letters;
		expect(extra?.filter((check) => !check.correct)).toHaveLength(1);
	});

	it('gives up aligning an answer that is too different', () => {
		expect(checkReading('мляко', 'xyz')).toEqual({ correct: false, letters: null });
		expect(checkReading('чай', 'bonjour')).toEqual({ correct: false, letters: null });
		expect(checkReading('там', '')).toEqual({ correct: false, letters: null });
	});
});

describe('answerRuns', () => {
	it('merges neighboring wrong letters into one stretch', () => {
		expect(answerRuns(checkReading('мляко', 'marko').letters!)).toEqual([
			{ text: 'm', correct: true },
			{ text: 'ar', correct: false },
			{ text: 'ko', correct: true }
		]);
	});

	it('keeps an empty stretch for a letter left out', () => {
		expect(answerRuns(checkReading('сестра', 'sesra').letters!)).toEqual([
			{ text: 'ses', correct: true },
			{ text: '', correct: false },
			{ text: 'ra', correct: true }
		]);
	});
});
