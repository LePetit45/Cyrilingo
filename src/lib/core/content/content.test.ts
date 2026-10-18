import { describe, expect, it } from 'vitest';
import { BULGARIAN_ALPHABET, toLowercase, type BulgarianLetter } from '../alphabet.js';
import { getLesson, LESSONS, lessonIntroducing, lettersKnownIn } from './course.js';
import { LETTERS } from './letters.js';
import { isSpelledBy } from './testing.js';
import { SECTION_IDS, type SectionId } from './types.js';

// Letter groups as listed in spec §3.2.
const SPEC_GROUPS: Record<SectionId, string> = {
	allies: 'АЕКМОТ',
	falseFriends: 'ВНРСУХ',
	greekCousins: 'БГДЛПФИЙЗ',
	newcomers: 'ЖЦЧШЩЪЬЮЯ'
};

describe('LESSONS', () => {
	it('has 10 lessons with unique ids and 3 distinct letters each', () => {
		expect(LESSONS).toHaveLength(10);
		expect(new Set(LESSONS.map((lesson) => lesson.id)).size).toBe(10);
		for (const lesson of LESSONS) expect(new Set(lesson.letters).size).toBe(3);
	});

	it('introduces every letter in exactly one lesson', () => {
		const introduced = LESSONS.flatMap((lesson) => lesson.letters);
		expect(introduced).toHaveLength(30);
		expect([...introduced].sort()).toEqual([...BULGARIAN_ALPHABET].sort());
	});

	it('follows the section order with 2 + 2 + 3 + 3 lessons', () => {
		const sections = LESSONS.map((lesson) => lesson.section);
		expect(sections).toEqual(
			SECTION_IDS.flatMap((id, index) => Array<SectionId>([2, 2, 3, 3][index]).fill(id))
		);
	});

	it('puts the letters of each spec group in its section', () => {
		for (const section of SECTION_IDS) {
			const letters = LESSONS.filter((lesson) => lesson.section === section).flatMap(
				(lesson) => lesson.letters
			);
			expect([...letters].sort().join('')).toBe([...SPEC_GROUPS[section]].sort().join(''));
		}
	});

	it('teaches Ь in the last lesson', () => {
		expect(LESSONS.at(-1)!.letters).toContain('Ь');
	});
});

describe('course lookups', () => {
	it('finds a lesson by id', () => {
		expect(getLesson('l3').letters).toEqual(['Н', 'С', 'Р']);
		expect(() => getLesson('nope')).toThrow();
	});

	it('finds the lesson introducing a letter', () => {
		expect(lessonIntroducing('А').id).toBe('l1');
		expect(lessonIntroducing('Ь').id).toBe('l10');
	});

	it('lists the letters known in a lesson, including its own', () => {
		expect(lettersKnownIn('l1')).toEqual(['А', 'Т', 'М']);
		expect(lettersKnownIn('l2')).toEqual(['А', 'Т', 'М', 'Е', 'О', 'К']);
		expect(lettersKnownIn('l10')).toHaveLength(30);
	});
});

describe('LETTERS', () => {
	const entries = Object.entries(LETTERS) as [BulgarianLetter, (typeof LETTERS)[BulgarianLetter]][];

	it('accepts distinct lowercase ASCII variants for every letter', () => {
		for (const [, data] of entries) {
			expect(data.accepted.length).toBeGreaterThan(0);
			expect(new Set(data.accepted).size).toBe(data.accepted.length);
			for (const variant of data.accepted) expect(variant).toMatch(/^[a-z]+$/);
		}
	});

	it('accepts the official transliteration', () => {
		for (const [letter, data] of entries) {
			expect(isSpelledBy(data.taughtAs ?? toLowercase(letter), data.official)).toBe(true);
		}
	});

	it('teaches a letter as a combination of itself and earlier letters', () => {
		for (const [letter, data] of entries) {
			if (!data.taughtAs) continue;
			const [first, ...others] = data.taughtAs;
			expect(first).toBe(toLowercase(letter));
			const known = lettersKnownIn(lessonIntroducing(letter).id).map(toLowercase);
			for (const other of others) expect(known).toContain(other);
		}
	});

	it('flags the letters with a distinct Bulgarian lowercase shape', () => {
		const flagged = entries.filter(([, data]) => data.distinctBulgarianLowercase);
		expect(flagged.map(([letter]) => toLowercase(letter)).join('')).toBe('вгджзийкптцшщъью');
	});
});
