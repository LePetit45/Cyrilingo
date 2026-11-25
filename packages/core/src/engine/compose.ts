// Question lists of lessons, free review and the final exam (spec §4.3, §4.4, §4.6, §4.7).
import { BULGARIAN_ALPHABET, type BulgarianLetter } from '../alphabet.js';
import { getLesson, LESSONS, lettersKnownIn } from '../content/course.js';
import { isWord, WORDS, type Reading, type Word } from '../content/corpus.js';
import { pick, shuffle, type Random } from '../random.js';
import { lettersIn } from '../reading.js';
import { syllableCount } from '../speech.js';
import {
	letterToSound,
	pickReading,
	readingFor,
	soundToLetter,
	type Question,
	type QuestionKind
} from './questions.js';

/** Review questions per lesson (spec §4.4). */
export const LESSON_REVIEW_COUNT = 4;
/** Questions in a free review (spec §4.7). */
export const FREE_REVIEW_COUNT = 12;
/** Words asked at most in « Réviser ma liste » (SPEC.md › Review). */
export const LIST_REVIEW_COUNT = 12;
/** Questions in the final exam, one per letter (spec §4.6). */
export const EXAM_QUESTION_COUNT = BULGARIAN_ALPHABET.length;
/** Reading questions in the final exam: a majority (spec §4.6). */
export const EXAM_READING_COUNT = 16;

/** Readings mixing new and previously learned letters in a lesson (spec §4.3, step 3). */
export const MIXED_READING_COUNT = 3;
/** Read-aloud questions in a lesson, for a signed-in learner (SPEC.md › The model feature). */
export const READ_ALOUD_COUNT = 2;

/**
 * The questions of a lesson, in play order (spec §4.3). Discovery cards come before them. Its
 * readings are drawn at random from the corpus, so replaying a lesson shows other words. With
 * `readAloud` (a signed-in learner, the feature on), up to 2 read-aloud questions are added on
 * words of its readings, after the questions on the new letters (AC-40).
 */
export function composeLesson(
	lessonId: string,
	random: Random,
	{ readAloud = false }: { readAloud?: boolean } = {}
): Question[] {
	const lesson = getLesson(lessonId);
	const known = lettersKnownIn(lessonId);
	const used: Reading[] = [];

	// Step 2: every new letter goes through the three exercise types.
	const newLetters = lesson.letters.flatMap((letter): Question[] => [
		letterToSound(letter, known, random),
		soundToLetter(letter, known, random),
		questionFor(letter, 'reading', known, used, random)
	]);
	// Step 3: readings mixing new and previously learned letters (only new ones in lesson 1).
	const isNew = (letter: BulgarianLetter) => lesson.letters.includes(letter);
	const isMixed = (reading: Reading) =>
		lettersIn(reading).some(isNew) &&
		(known.length === lesson.letters.length || !lettersIn(reading).every(isNew));
	const mixed: Question[] = [];
	for (let i = 0; i < MIXED_READING_COUNT; i++) {
		const reading = pickReading(isMixed, known, used, random);
		if (!reading) break;
		used.push(reading);
		mixed.push({ kind: 'reading', reading });
	}
	// Step 4: review of earlier letters.
	const review = reviewLetters(lessonId, random).map((letter) =>
		questionFor(letter, randomKind(random), known, used, random)
	);

	const questions = [...spread(newLetters, random), ...mixed, ...shuffle(review, random)];
	if (!readAloud) return questions;
	// Step 5: read-aloud questions, among the questions that follow the new letters.
	for (const word of readAloudWords(used, random)) {
		const at =
			newLetters.length + Math.floor(random() * (questions.length - newLetters.length + 1));
		questions.splice(at, 0, { kind: 'readAloud', word });
	}
	return questions;
}

/**
 * Words to read aloud, among the lesson's readings: words of 2 syllables or more first, since
 * one-syllable words such as да or не are poorly recognized on their own, then shorter ones
 * when too few exist. None in a lesson of syllables only.
 */
export function readAloudWords(readings: readonly Reading[], random: Random): Word[] {
	const words = [...new Set(readings.filter(isWord))];
	const long = words.filter((word) => syllableCount(word) >= 2);
	const short = words.filter((word) => syllableCount(word) < 2);
	return [...shuffle(long, random), ...shuffle(short, random)].slice(0, READ_ALOUD_COUNT);
}

/**
 * Letters reviewed in a lesson (spec §4.4): half from the 2 previous lessons, half older ones
 * picked at random. When one half has too few letters, the other fills in.
 */
export function reviewLetters(lessonId: string, random: Random): BulgarianLetter[] {
	const index = LESSONS.indexOf(getLesson(lessonId));
	const recent = shuffle(
		LESSONS.slice(Math.max(0, index - 2), index).flatMap((lesson) => lesson.letters),
		random
	);
	const older = shuffle(
		LESSONS.slice(0, Math.max(0, index - 2)).flatMap((lesson) => lesson.letters),
		random
	);
	const half = LESSON_REVIEW_COUNT / 2;
	const fromOlder = Math.min(older.length, Math.max(half, LESSON_REVIEW_COUNT - recent.length));
	const fromRecent = Math.min(recent.length, LESSON_REVIEW_COUNT - fromOlder);
	return [...recent.slice(0, fromRecent), ...older.slice(0, fromOlder)];
}

/**
 * A free review (spec §4.7): questions on random letters of the completed lessons, with readings
 * drawn from the whole corpus among those readable once the furthest completed lesson is known.
 * Empty when no lesson is completed.
 */
export function composeFreeReview(
	completedLessonIds: readonly string[],
	random: Random
): Question[] {
	const completed = LESSONS.filter((lesson) => completedLessonIds.includes(lesson.id));
	const furthest = completed.at(-1);
	if (!furthest) return [];
	const known = lettersKnownIn(furthest.id);
	const letters = completed.flatMap((lesson) => lesson.letters);

	// Every letter comes up once before any comes up again.
	const targets: BulgarianLetter[] = [];
	while (targets.length < FREE_REVIEW_COUNT) targets.push(...shuffle(letters, random));

	const used: Reading[] = [];
	return targets
		.slice(0, FREE_REVIEW_COUNT)
		.map((letter) => questionFor(letter, randomKind(random), known, used, random));
}

/**
 * « Réviser ma liste » (SPEC.md › Review): a reading question on each of up to 12 words of a
 * personal list, picked at random. Words the corpus no longer has are left out. Empty for a list
 * without words: such a list cannot be reviewed.
 */
export function composeListReview(words: readonly string[], random: Random): Question[] {
	const readable = [...new Set(words)].filter((word): word is Word => Object.hasOwn(WORDS, word));
	return shuffle(readable, random)
		.slice(0, LIST_REVIEW_COUNT)
		.map((reading) => ({ kind: 'reading', reading }));
}

/**
 * The final exam (spec §4.6): one question per letter, mixing the three exercise types with a
 * majority of word readings, all with distinct words.
 */
export function composeExam(random: Random): Question[] {
	const known = BULGARIAN_ALPHABET;
	const letters = shuffle(BULGARIAN_ALPHABET, random);
	const kinds = new Map<BulgarianLetter, LetterQuestionKind>(
		letters.map((letter, index) => [
			letter,
			index < EXAM_READING_COUNT ? 'reading' : index % 2 === 0 ? 'letterToSound' : 'soundToLetter'
		])
	);

	// Readings are assigned rarest letters first, so they still find an unused word.
	const used: Reading[] = [];
	const byRarity = [...letters].sort(
		(a, b) => wordCount(a) - wordCount(b) || letters.indexOf(a) - letters.indexOf(b)
	);
	const questions = new Map(
		byRarity.map((letter) => [
			letter,
			questionFor(letter, kinds.get(letter)!, known, used, random, { wordsOnly: true })
		])
	);
	return shuffle(
		letters.map((letter) => questions.get(letter)!),
		random
	);
}

function wordCount(letter: BulgarianLetter): number {
	return (Object.keys(WORDS) as Word[]).filter((word) => lettersIn(word).includes(letter)).length;
}

/** The kinds a letter can be asked with; read aloud is asked on a word, not a letter. */
type LetterQuestionKind = Exclude<QuestionKind, 'readAloud'>;

function randomKind(random: Random): LetterQuestionKind {
	return pick(['letterToSound', 'soundToLetter', 'reading'] as const, random)!;
}

/**
 * A question of the given kind on a letter. A reading uses an unused corpus entry, recorded in
 * `used`; when none fits, a multiple-choice question is asked instead.
 */
function questionFor(
	letter: BulgarianLetter,
	kind: LetterQuestionKind,
	known: readonly BulgarianLetter[],
	used: Reading[],
	random: Random,
	options: { wordsOnly?: boolean } = {}
): Question {
	if (kind === 'reading') {
		const reading = readingFor(letter, known, used, random, options);
		if (reading) {
			used.push(reading);
			return { kind: 'reading', reading, letter };
		}
		kind = random() < 0.5 ? 'letterToSound' : 'soundToLetter';
	}
	return kind === 'letterToSound'
		? letterToSound(letter, known, random)
		: soundToLetter(letter, known, random);
}

/**
 * Shuffles questions so that, as far as possible, two questions on the same letter do not
 * follow each other.
 */
export function spread(questions: readonly Question[], random: Random): Question[] {
	let best = shuffle(questions, random);
	for (let attempt = 0; attempt < 50 && repeats(best) > 0; attempt++) {
		const candidate = shuffle(questions, random);
		if (repeats(candidate) < repeats(best)) best = candidate;
	}
	return best;
}

function repeats(questions: readonly Question[]): number {
	return questions.filter(
		(question, index) =>
			index > 0 && question.letter !== undefined && question.letter === questions[index - 1].letter
	).length;
}
