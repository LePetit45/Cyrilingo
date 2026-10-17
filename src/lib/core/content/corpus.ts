import type { BulgarianLetter } from '../alphabet.js';

export interface WordData {
	/** Index of the stressed vowel in the word, underlined in reading feedback (spec §5.3, §9). */
	stress: number;
}

/**
 * Words of the corpus (spec §9), written in lowercase with Bulgarian shapes, proper names
 * capitalized (spec §5.3). Grouped by the first lesson whose known letters can spell them.
 * French translations live in the locale content.
 */
export const WORDS = {
	// Readable from lesson 1
	мама: { stress: 1 },
	тата: { stress: 1 },
	там: { stress: 1 },
	мат: { stress: 1 },
	// Readable from lesson 2
	котка: { stress: 1 },
	кмет: { stress: 2 },
	като: { stress: 1 },
	ето: { stress: 0 },
	тема: { stress: 1 },
	атом: { stress: 0 },
	ток: { stress: 1 },
	око: { stress: 2 },
	така: { stress: 3 },
	комета: { stress: 3 },
	// Readable from lesson 3
	ресторант: { stress: 6 },
	сестра: { stress: 5 },
	нос: { stress: 1 },
	сок: { stress: 1 },
	маса: { stress: 1 },
	сто: { stress: 2 },
	море: { stress: 1 },
	метро: { stress: 4 },
	карта: { stress: 1 },
	ракета: { stress: 3 },
	кон: { stress: 1 },
	не: { stress: 1 },
	роман: { stress: 3 },
	река: { stress: 3 },
	// Readable from lesson 4
	Москва: { stress: 5 },
	Варна: { stress: 1 },
	тук: { stress: 1 },
	хор: { stress: 1 },
	хаос: { stress: 1 },
	ехо: { stress: 0 },
	утро: { stress: 0 },
	уста: { stress: 3 },
	вкус: { stress: 2 },
	ум: { stress: 0 },
	муха: { stress: 3 },
	ухо: { stress: 0 },
	// Readable from lesson 5
	кино: { stress: 3 },
	вода: { stress: 3 },
	хотел: { stress: 3 },
	да: { stress: 1 },
	лимон: { stress: 3 },
	вино: { stress: 3 },
	сирене: { stress: 1 },
	такси: { stress: 4 },
	турист: { stress: 3 },
	Лондон: { stress: 1 },
	лекар: { stress: 1 },
	Атина: { stress: 2 },
	салата: { stress: 3 },
	ден: { stress: 1 },
	име: { stress: 0 },
	Рим: { stress: 1 },
	// Readable from lesson 6
	паспорт: { stress: 4 },
	бира: { stress: 1 },
	банка: { stress: 1 },
	баба: { stress: 1 },
	парк: { stress: 1 },
	зима: { stress: 3 },
	роза: { stress: 1 },
	супа: { stress: 1 },
	пари: { stress: 3 },
	Пловдив: { stress: 2 },
	банан: { stress: 3 },
	автобус: { stress: 5 },
	риба: { stress: 1 },
	добре: { stress: 4 },
	аз: { stress: 0 },
	// Readable from lesson 7
	Бургас: { stress: 4 },
	много: { stress: 2 },
	град: { stress: 2 },
	гара: { stress: 1 },
	трамвай: { stress: 5 },
	кафе: { stress: 3 },
	фото: { stress: 1 },
	телефон: { stress: 5 },
	той: { stress: 1 },
	футбол: { stress: 4 },
	гора: { stress: 3 },
	здравей: { stress: 5 },
	книга: { stress: 2 },
	филм: { stress: 1 },
	// Readable from lesson 8
	България: { stress: 4 },
	чай: { stress: 1 },
	път: { stress: 1 },
	театър: { stress: 2 },
	час: { stress: 1 },
	хляб: { stress: 2 },
	мляко: { stress: 2 },
	София: { stress: 1 },
	ябълка: { stress: 0 },
	човек: { stress: 3 },
	къде: { stress: 3 },
	куче: { stress: 1 },
	благодаря: { stress: 8 },
	моля: { stress: 1 },
	// Readable from lesson 9
	шоколад: { stress: 5 },
	жена: { stress: 3 },
	плаж: { stress: 2 },
	жираф: { stress: 3 },
	чаша: { stress: 1 },
	шапка: { stress: 1 },
	още: { stress: 0 },
	къща: { stress: 1 },
	мъж: { stress: 1 },
	Париж: { stress: 3 },
	щастие: { stress: 1 },
	нощ: { stress: 1 },
	душ: { stress: 1 },
	// Readable from lesson 10
	пица: { stress: 1 },
	меню: { stress: 3 },
	шофьор: { stress: 4 },
	цирк: { stress: 1 },
	цена: { stress: 3 },
	център: { stress: 1 },
	юли: { stress: 0 },
	цвете: { stress: 2 },
	улица: { stress: 0 },
	любов: { stress: 3 },
	ключ: { stress: 2 },
	компютър: { stress: 4 },
	бульон: { stress: 4 }
} satisfies Record<string, WordData>;

export type Word = keyof typeof WORDS;

/**
 * Syllables bridging letters and words, used when too few real words can be formed with the
 * letters known (spec §4.3). Grouped by the first lesson that can spell them.
 */
export const SYLLABLES = [
	// Readable from lesson 1
	'ма',
	'та',
	'ам',
	'ат',
	// Readable from lesson 2
	'ко',
	'ке',
	'ме',
	'мо',
	'те',
	'ек',
	// Readable from lesson 3
	'на',
	'но',
	'ра',
	'ре',
	'са',
	'со',
	'ос',
	// Readable from lesson 4
	'ва',
	'ве',
	'ху',
	'ха',
	'ту',
	'му',
	// Readable from lesson 5
	'ли',
	'ла',
	'ди',
	'до',
	'ки',
	'ни',
	// Readable from lesson 6
	'па',
	'пи',
	'по',
	'за',
	'ба',
	'бу',
	// Readable from lesson 7
	'га',
	'го',
	'ги',
	'фа',
	'фи',
	'ой',
	// Readable from lesson 8
	'ча',
	'чи',
	'мя',
	'ля',
	'тя',
	'бъ',
	// Readable from lesson 9
	'ша',
	'шо',
	'жа',
	'жи',
	'ща',
	'щи',
	// Readable from lesson 10
	'ца',
	'ци',
	'це',
	'лю',
	'ню',
	'льо',
	'ньо'
] as const;

export type Syllable = (typeof SYLLABLES)[number];

/** A syllable or word shown in a reading exercise (spec §5.2). */
export type Reading = Word | Syllable;

export function isWord(reading: Reading): reading is Word {
	return Object.hasOwn(WORDS, reading);
}

/** Example words shown on each letter discovery card (spec §5.1). */
export const CARD_EXAMPLES: Readonly<Record<BulgarianLetter, readonly Word[]>> = {
	А: ['мама', 'тата', 'там'],
	Б: ['баба', 'бира', 'банка'],
	В: ['Варна', 'вкус', 'Москва'],
	Г: ['много', 'гара', 'град'],
	Д: ['да', 'вода', 'ден'],
	Е: ['ето', 'тема', 'кмет'],
	Ж: ['жена', 'плаж', 'жираф'],
	З: ['зима', 'роза'],
	И: ['кино', 'вино', 'такси'],
	Й: ['той', 'трамвай'],
	К: ['котка', 'като', 'комета'],
	Л: ['лимон', 'Лондон', 'хотел'],
	М: ['мама', 'там', 'мат'],
	Н: ['нос', 'кон', 'роман'],
	О: ['око', 'атом', 'ток'],
	П: ['парк', 'пари', 'супа'],
	Р: ['море', 'карта', 'ресторант'],
	С: ['сок', 'сто', 'маса'],
	Т: ['тата', 'там', 'мат'],
	У: ['тук', 'ум', 'утро'],
	Ф: ['кафе', 'фото', 'телефон'],
	Х: ['хор', 'хаос', 'ехо'],
	Ц: ['пица', 'цирк', 'цена'],
	Ч: ['чай', 'час', 'човек'],
	Ш: ['шапка', 'шоколад', 'душ'],
	Щ: ['още', 'къща', 'щастие'],
	Ъ: ['път', 'България'],
	Ь: ['шофьор', 'бульон'],
	Ю: ['меню', 'юли', 'любов'],
	Я: ['мляко', 'ябълка', 'София']
};
