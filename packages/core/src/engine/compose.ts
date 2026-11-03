// Question lists of lessons, free review and the final exam (spec §4.3, §4.4, §4.6, §4.7).
import { BULGARIAN_ALPHABET, type BulgarianLetter } from '../alphabet.js';
import { getLesson, LESSONS, lettersKnownIn } from '../content/course.js';
import { WORDS, type Reading, type Word } from '../content/corpus.js';
import { pick, shuffle, type Random } from '../random.js';
import { lettersIn } from '../reading.js';
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
/** Questions in the final exam, one per letter (spec §4.6). */
export const EXAM_QUESTION_COUNT = BULGARIAN_ALPHABET.length;
/** Reading questions in the final exam: a majority (spec §4.6). */
export const EXAM_READING_COUNT = 16;

/** Readings mixing new and previously learned letters in a lesson (spec §4.3, step 3). */
export const MIXED_READING_COUNT = 3;

/**
 * The questions of a lesson, in play order (spec §4.3). Discovery cards come before them. Its
 * readings are drawn at random from the corpus, so replaying a lesson shows other words.
 */
export function composeLesson(lessonId: string, random: Random): Question[] {
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

	return [...spread(newLetters, random), ...mixed, ...shuffle(review, random)];
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
 * The final exam (spec §4.6): one question per letter, mixing the three exercise types with a
 * majority of word readings, all with distinct words.
 */
export function composeExam(random: Random): Question[] {
	const known = BULGARIAN_ALPHABET;
	const letters = shuffle(BULGARIAN_ALPHABET, random);
	const kinds = new Map<BulgarianLetter, QuestionKind>(
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

function randomKind(random: Random): QuestionKind {
	return pick(['letterToSound', 'soundToLetter', 'reading'] as const, random)!;
}

/**
 * A question of the given kind on a letter. A reading uses an unused corpus entry, recorded in
 * `used`; when none fits, a multiple-choice question is asked instead.
 */
function questionFor(
	letter: BulgarianLetter,
	kind: QuestionKind,
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
