import { describe, expect, it } from 'vitest';
import { isSameWord, normalizeSpeech, syllableCount, validHeardText } from './speech.js';

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
	it('[AC-43] compares the normalized text heard with the normalized expected word', () => {
		expect(isSameWord('котка', 'котка')).toBe(true);
		expect(isSameWord('софия', 'София')).toBe(true);
		expect(isSameWord('котки', 'котка')).toBe(false);
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
