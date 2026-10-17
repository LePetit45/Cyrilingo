/** The 30 letters of the Bulgarian alphabet, uppercase, in alphabetical order (spec §3.1). */
export const BULGARIAN_ALPHABET = [
	'А',
	'Б',
	'В',
	'Г',
	'Д',
	'Е',
	'Ж',
	'З',
	'И',
	'Й',
	'К',
	'Л',
	'М',
	'Н',
	'О',
	'П',
	'Р',
	'С',
	'Т',
	'У',
	'Ф',
	'Х',
	'Ц',
	'Ч',
	'Ш',
	'Щ',
	'Ъ',
	'Ь',
	'Ю',
	'Я'
] as const;

export type BulgarianLetter = (typeof BULGARIAN_ALPHABET)[number];

/** Lowercase form of a Bulgarian letter. */
export function toLowercase(letter: BulgarianLetter): string {
	return letter.toLocaleLowerCase('bg');
}
