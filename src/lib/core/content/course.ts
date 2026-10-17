import type { BulgarianLetter } from '../alphabet.js';
import type { Lesson } from './types.js';

/**
 * The 10 lessons of the path, in course order (spec §4.1). Within a group, letters that form real
 * words earliest with the letters already known come first, and ties are broken by letter
 * frequency in Bulgarian. Past the first lesson every remaining letter forms words right away,
 * so the order is frequency-driven, except that Ь (taught as ьо) comes last (spec §3.3).
 */
export const LESSONS: readonly Lesson[] = [
	// А, Т, М give мама, тата, там from the first lesson.
	{
		id: 'l1',
		section: 'allies',
		letters: ['А', 'Т', 'М'],
		letterReadings: ['ам', 'тата', 'мама'],
		mixedReadings: ['там', 'мат', 'та']
	},
	{
		id: 'l2',
		section: 'allies',
		letters: ['Е', 'О', 'К'],
		letterReadings: ['ето', 'атом', 'котка'],
		mixedReadings: ['комета', 'тема', 'така']
	},
	{
		id: 'l3',
		section: 'falseFriends',
		letters: ['Н', 'С', 'Р'],
		letterReadings: ['нос', 'маса', 'море'],
		mixedReadings: ['ресторант', 'сестра', 'метро']
	},
	{
		id: 'l4',
		section: 'falseFriends',
		letters: ['В', 'У', 'Х'],
		letterReadings: ['Варна', 'тук', 'ехо'],
		mixedReadings: ['Москва', 'утро', 'муха']
	},
	{
		id: 'l5',
		section: 'greekCousins',
		letters: ['И', 'Д', 'Л'],
		letterReadings: ['кино', 'вода', 'лимон'],
		mixedReadings: ['хотел', 'такси', 'сирене']
	},
	{
		id: 'l6',
		section: 'greekCousins',
		letters: ['П', 'З', 'Б'],
		letterReadings: ['парк', 'зима', 'бира'],
		mixedReadings: ['паспорт', 'банан', 'автобус']
	},
	{
		id: 'l7',
		section: 'greekCousins',
		letters: ['Г', 'Й', 'Ф'],
		letterReadings: ['много', 'трамвай', 'кафе'],
		mixedReadings: ['телефон', 'футбол', 'гара']
	},
	{
		id: 'l8',
		section: 'newcomers',
		letters: ['Ъ', 'Я', 'Ч'],
		letterReadings: ['път', 'мляко', 'чай'],
		mixedReadings: ['България', 'човек', 'театър']
	},
	// Щ is introduced right after Ш, as Ш + т.
	{
		id: 'l9',
		section: 'newcomers',
		letters: ['Ш', 'Ж', 'Щ'],
		letterReadings: ['шапка', 'жена', 'още'],
		mixedReadings: ['шоколад', 'къща', 'плаж']
	},
	{
		id: 'l10',
		section: 'newcomers',
		letters: ['Ц', 'Ю', 'Ь'],
		letterReadings: ['пица', 'меню', 'шофьор'],
		mixedReadings: ['цирк', 'бульон', 'улица']
	}
];

export function getLesson(id: string): Lesson {
	const lesson = LESSONS.find((candidate) => candidate.id === id);
	if (!lesson) throw new Error(`Unknown lesson: ${id}`);
	return lesson;
}

/** The lesson that introduces a letter. */
export function lessonIntroducing(letter: BulgarianLetter): Lesson {
	const lesson = LESSONS.find((candidate) => candidate.letters.includes(letter));
	if (!lesson) throw new Error(`No lesson introduces ${letter}`);
	return lesson;
}

/**
 * Letters a lesson may use: its own and those of every earlier lesson, whether the learner did
 * them or not (spec §4.2).
 */
export function lettersKnownIn(lessonId: string): BulgarianLetter[] {
	const index = LESSONS.indexOf(getLesson(lessonId));
	return LESSONS.slice(0, index + 1).flatMap((lesson) => lesson.letters);
}
