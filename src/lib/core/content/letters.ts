import type { BulgarianLetter } from '../alphabet.js';
import type { LetterData } from './types.js';

/**
 * Locale-independent data for the 30 letters (spec §3.4, §5.3). This is the reviewed table of
 * accepted Latin variants: each Cyrillic letter is checked on its own against its list, so both
 * transliterations can be mixed within one word.
 *
 * `distinctBulgarianLowercase` matches the letters Sofia Sans draws differently under its Russian
 * `locl` substitutions: Bulgarian shapes are the font's defaults. л is not flagged: the app
 * shows its standard shape (see scripts/fonts/patch-sofia-sans.py).
 */
export const LETTERS: Readonly<Record<BulgarianLetter, LetterData>> = {
	А: { official: 'a', accepted: ['a'], distinctBulgarianLowercase: false },
	Б: { official: 'b', accepted: ['b'], distinctBulgarianLowercase: false },
	В: { official: 'v', accepted: ['v'], distinctBulgarianLowercase: true },
	Г: { official: 'g', accepted: ['g'], distinctBulgarianLowercase: true },
	Д: { official: 'd', accepted: ['d'], distinctBulgarianLowercase: true },
	Е: { official: 'e', accepted: ['e'], distinctBulgarianLowercase: false },
	Ж: { official: 'zh', accepted: ['j', 'zh'], distinctBulgarianLowercase: true },
	З: { official: 'z', accepted: ['z'], distinctBulgarianLowercase: true },
	И: { official: 'i', accepted: ['i'], distinctBulgarianLowercase: true },
	Й: { official: 'y', accepted: ['y', 'i'], distinctBulgarianLowercase: true },
	К: { official: 'k', accepted: ['k'], distinctBulgarianLowercase: true },
	Л: { official: 'l', accepted: ['l'], distinctBulgarianLowercase: false },
	М: { official: 'm', accepted: ['m'], distinctBulgarianLowercase: false },
	Н: { official: 'n', accepted: ['n'], distinctBulgarianLowercase: false },
	О: { official: 'o', accepted: ['o'], distinctBulgarianLowercase: false },
	П: { official: 'p', accepted: ['p'], distinctBulgarianLowercase: true },
	Р: { official: 'r', accepted: ['r'], distinctBulgarianLowercase: false },
	С: { official: 's', accepted: ['s'], distinctBulgarianLowercase: false },
	Т: { official: 't', accepted: ['t'], distinctBulgarianLowercase: true },
	У: { official: 'u', accepted: ['ou', 'u'], distinctBulgarianLowercase: false },
	Ф: { official: 'f', accepted: ['f'], distinctBulgarianLowercase: false },
	Х: { official: 'h', accepted: ['h', 'kh'], distinctBulgarianLowercase: false },
	Ц: { official: 'ts', accepted: ['ts', 'tz'], distinctBulgarianLowercase: true },
	Ч: { official: 'ch', accepted: ['tch', 'ch'], distinctBulgarianLowercase: false },
	Ш: { official: 'sh', accepted: ['ch', 'sh'], distinctBulgarianLowercase: true },
	Щ: { official: 'sht', accepted: ['cht', 'sht'], distinctBulgarianLowercase: true },
	Ъ: { official: 'a', accepted: ['a', 'eu', 'u'], distinctBulgarianLowercase: true },
	Ь: { official: 'yo', accepted: ['y', 'i'], taughtAs: 'ьо', distinctBulgarianLowercase: true },
	Ю: { official: 'yu', accepted: ['iou', 'yu', 'ju'], distinctBulgarianLowercase: true },
	Я: { official: 'ya', accepted: ['ia', 'ya', 'ja'], distinctBulgarianLowercase: false }
};
