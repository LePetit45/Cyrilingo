import { describe, expect, it } from 'vitest';
import { BULGARIAN_ALPHABET, toLowercase } from './alphabet';

describe('BULGARIAN_ALPHABET', () => {
	it('has 30 distinct letters', () => {
		expect(BULGARIAN_ALPHABET).toHaveLength(30);
		expect(new Set(BULGARIAN_ALPHABET).size).toBe(30);
	});

	it('only contains basic Cyrillic uppercase letters, in code point order', () => {
		const codePoints = BULGARIAN_ALPHABET.map((letter) => letter.codePointAt(0)!);
		for (const codePoint of codePoints) {
			expect(codePoint).toBeGreaterThanOrEqual(0x0410);
			expect(codePoint).toBeLessThanOrEqual(0x042f);
		}
		expect(codePoints).toEqual([...codePoints].sort((a, b) => a - b));
	});
});

describe('toLowercase', () => {
	it('returns the lowercase Cyrillic letter', () => {
		expect(toLowercase('Д')).toBe('д');
		expect(toLowercase('Щ')).toBe('щ');
	});
});
