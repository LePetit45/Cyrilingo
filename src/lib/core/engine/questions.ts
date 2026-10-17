// Exercise types and their multiple-choice options (spec §5.2, §5.3).
import { BULGARIAN_ALPHABET, type BulgarianLetter } from '../alphabet.js';
import { isWord, SYLLABLES, WORDS, type Reading, type Word } from '../content/corpus.js';
import { LETTERS } from '../content/letters.js';
import { pick, shuffle, type Random } from '../random.js';
import { lettersIn, type ReadingCheck } from '../reading.js';

/** An answer of a letter → sound question: a letter's sound, or a Latin trap spelling. */
export type SoundChoice = { letter: BulgarianLetter } | { latin: string };

export interface LetterToSoundQuestion {
	kind: 'letterToSound';
	/** The letter shown, whose sound is asked. */
	letter: BulgarianLetter;
	/** 4 choices, including `{ letter }`. */
	choices: readonly SoundChoice[];
}

export interface SoundToLetterQuestion {
	kind: 'soundToLetter';
	/** The letter whose sound is shown. */
	letter: BulgarianLetter;
	/** 4 letters, including `letter`. */
	choices: readonly BulgarianLetter[];
}

export interface ReadingQuestion {
	kind: 'reading';
	reading: Reading;
	/** The letter the reading was chosen for, if any. */
	letter?: BulgarianLetter;
}

export type Question = LetterToSoundQuestion | SoundToLetterQuestion | ReadingQuestion;

export type QuestionKind = Question['kind'];

export const CHOICE_COUNT = 4;

/**
 * Latin spellings a Latin-alphabet reader is tempted to give a letter, because its uppercase or
 * its Bulgarian lowercase shape looks like a Latin letter (spec §3.2, §3.3).
 */
export const LATIN_TRAPS: Readonly<Partial<Record<BulgarianLetter, string>>> = {
	В: 'b',
	Н: 'h',
	Р: 'p',
	С: 'k',
	У: 'y',
	Х: 'x',
	Д: 'g',
	Т: 'm',
	И: 'u',
	П: 'n',
	Я: 'r'
};

/**
 * Letters easily mistaken for one another (spec §5.3): Cyrillic look-alikes, and letters whose
 * shape looks like the Latin letter of the other's sound (Б « b » / В looks like B).
 */
export const CONFUSABLE_LETTERS: Readonly<Partial<Record<BulgarianLetter, BulgarianLetter[]>>> = {
	Б: ['В'],
	В: ['Б'],
	Г: ['Д'],
	Д: ['Г'],
	И: ['Й', 'У'],
	Й: ['И', 'У'],
	М: ['Т'],
	Т: ['М'],
	Н: ['П', 'Х'],
	П: ['Н', 'Р'],
	Р: ['П', 'Я'],
	У: ['И', 'Й'],
	Х: ['Н'],
	Ц: ['Щ'],
	Ш: ['Щ'],
	Щ: ['Ш', 'Ц'],
	Ъ: ['Ь'],
	Ь: ['Ъ'],
	Я: ['Р']
};

// How often a multiple-choice question includes a trap, when one is available: "sometimes"
// (spec §5.3), but often enough that false friends get unlearned.
const TRAP_RATE = 0.7;

/**
 * Letters offered next to `letter` in a multiple-choice question: a confusable letter sometimes,
 * then random letters among those already known, then other letters if too few are known
 * (first lessons). Letters for which `excluded` is true are never offered.
 */
function distractorLetters(
	letter: BulgarianLetter,
	known: readonly BulgarianLetter[],
	count: number,
	random: Random,
	excluded: (candidate: BulgarianLetter) => boolean = () => false
): BulgarianLetter[] {
	const allowed = (candidate: BulgarianLetter) => candidate !== letter && !excluded(candidate);
	const chosen: BulgarianLetter[] = [];
	const trap = pick(
		(CONFUSABLE_LETTERS[letter] ?? []).filter(
			(candidate) => known.includes(candidate) && allowed(candidate)
		),
		random
	);
	if (trap && random() < TRAP_RATE) chosen.push(trap);
	const unknown = BULGARIAN_ALPHABET.filter((candidate) => !known.includes(candidate));
	for (const candidate of [...shuffle(known, random), ...shuffle(unknown, random)]) {
		if (chosen.length === count) break;
		if (allowed(candidate) && !chosen.includes(candidate)) chosen.push(candidate);
	}
	return chosen;
}

export function letterToSound(
	letter: BulgarianLetter,
	known: readonly BulgarianLetter[],
	random: Random
): LetterToSoundQuestion {
	const trap = LATIN_TRAPS[letter];
	const latin = trap !== undefined && random() < TRAP_RATE ? trap : undefined;
	// A letter that may be spelled like the trap would make two identical choices.
	const letters = distractorLetters(
		letter,
		known,
		latin ? CHOICE_COUNT - 2 : CHOICE_COUNT - 1,
		random,
		(candidate) => latin !== undefined && LETTERS[candidate].accepted.includes(latin)
	);
	const choices: SoundChoice[] = [letter, ...letters].map((choice) => ({ letter: choice }));
	if (latin) choices.push({ latin });
	return { kind: 'letterToSound', letter, choices: shuffle(choices, random) };
}

export function soundToLetter(
	letter: BulgarianLetter,
	known: readonly BulgarianLetter[],
	random: Random
): SoundToLetterQuestion {
	const choices = [letter, ...distractorLetters(letter, known, CHOICE_COUNT - 1, random)];
	return { kind: 'soundToLetter', letter, choices: shuffle(choices, random) };
}

/** Whether a syllable or word only uses the given letters. */
export function isReadableWith(reading: string, known: readonly BulgarianLetter[]): boolean {
	return lettersIn(reading).every((letter) => known.includes(letter));
}

const ALL_READINGS: readonly Reading[] = [...(Object.keys(WORDS) as Word[]), ...SYLLABLES];

/**
 * A corpus word (or, failing that, a syllable) containing `letter` and readable with the known
 * letters, avoiding the readings in `used`. Words are preferred over syllables.
 */
export function readingFor(
	letter: BulgarianLetter,
	known: readonly BulgarianLetter[],
	used: readonly Reading[],
	random: Random,
	{ wordsOnly = false } = {}
): Reading | undefined {
	const candidates = ALL_READINGS.filter(
		(reading) =>
			!used.includes(reading) &&
			lettersIn(reading).includes(letter) &&
			isReadableWith(reading, known) &&
			(!wordsOnly || isWord(reading))
	);
	return pick(candidates.filter(isWord), random) ?? pick(candidates, random);
}

/**
 * The letters to work on again after a wrong answer, listed in the end-of-lesson summary
 * (spec §6): the letter asked in a multiple-choice question; for a reading, the letters
 * answered wrong, or the letter it was chosen for, or else all its letters.
 */
export function lettersMissed(question: Question, check?: ReadingCheck): BulgarianLetter[] {
	if (question.kind !== 'reading') return [question.letter];
	const wrong = check?.letters?.filter((letter) => !letter.correct).map(({ letter }) => letter);
	if (wrong?.length) return [...new Set(wrong)];
	return question.letter ? [question.letter] : [...new Set(lettersIn(question.reading))];
}
