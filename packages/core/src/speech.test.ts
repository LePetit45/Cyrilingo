import { describe, expect, it } from 'vitest';
import {
	editDistance,
	isSameWord,
	normalizeSpeech,
	syllableCount,
	validHeardText
} from './speech.js';

describe('validHeardText', () => {
	it('[AC-42] keeps a text of Bulgarian letters, spaces and hyphens, lowercased and without punctuation', () => {
		expect(validHeardText('Котка.')).toBe('котка');
		expect(validHeardText('  Добро   утро! ')).toBe('добро утро');
		expect(validHeardText('Стара-Загора')).toBe('стара-загора');
		expect(validHeardText('«Мляко»?')).toBe('мляко');
	});

	it('[AC-42] composes letters written as a base and a combining mark (Unicode NFC)', () => {
		// й as и followed by a combining breve.
		expect(validHeardText('чай')).toBe('чай');
	});

	it('[AC-42] refuses an empty text, more than 40 characters, Latin letters, digits and other Cyrillic letters', () => {
		for (const text of ['', ' . ', 'kotka', 'котка2', '2', 'мыло', 'ёлка', 'ѝ', 'котка cat']) {
			expect(validHeardText(text)).toBeNull();
		}
		expect(validHeardText('а'.repeat(40))).toBe('а'.repeat(40));
		expect(validHeardText('а'.repeat(41))).toBeNull();
	});
});

describe('isSameWord', () => {
	it('[AC-43] accepts the expected word, whatever its case', () => {
		expect(isSameWord('котка', 'котка')).toBe(true);
		expect(isSameWord('софия', 'София')).toBe(true);
	});

	it('[AC-43] ignores spaces and hyphens the model put in the word', () => {
		expect(isSameWord('аз бука', 'азбука')).toBe(true);
		expect(isSameWord('стара загора', 'Стара-Загора')).toBe(true);
	});

	it('[AC-43] accepts one letter added, missing or changed in a word of 4 letters or more', () => {
		expect(isSameWord('вече', 'вечер')).toBe(true);
		expect(isSameWord('меска', 'маска')).toBe(true);
		expect(isSameWord('в париж', 'Париж')).toBe(true);
		expect(isSameWord('тима', 'тема')).toBe(true);
	});

	it('[AC-43] refuses two letters off, any letter off in a shorter word, and nothing heard', () => {
		expect(isSameWord('селета', 'салата')).toBe(false);
		expect(isSameWord('студа', 'студент')).toBe(false);
		expect(isSameWord('ми', 'име')).toBe(false);
		expect(isSameWord('ние', 'име')).toBe(false);
		expect(isSameWord('', 'име')).toBe(false);
		expect(isSameWord(' - ', 'мама')).toBe(false);
	});
});

describe('editDistance', () => {
	it('counts the letters to add, remove or change', () => {
		expect(editDistance('', '')).toBe(0);
		expect(editDistance('котка', 'котка')).toBe(0);
		expect(editDistance('котка', 'котки')).toBe(1);
		expect(editDistance('кот', 'котка')).toBe(2);
		expect(editDistance('', 'абв')).toBe(3);
		expect(editDistance('маска', 'меске')).toBe(2);
	});
});

describe('normalizeSpeech', () => {
	it('lowercases with the Bulgarian rules, drops punctuation and symbols, keeps hyphens', () => {
		expect(normalizeSpeech('ЩЪРКЕЛ, ЖАБА & Co.')).toBe('щъркел жаба co');
	});
});

describe('syllableCount', () => {
	it('counts the vowel letters of a word', () => {
		expect(syllableCount('да')).toBe(1);
		expect(syllableCount('мама')).toBe(2);
		expect(syllableCount('Ябълка')).toBe(3);
		expect(syllableCount('чай')).toBe(1);
		expect(syllableCount('юли')).toBe(2);
		expect(syllableCount('сг')).toBe(0);
	});
});
