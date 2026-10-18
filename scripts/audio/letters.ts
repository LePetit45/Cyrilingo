// How each letter's sound is fed to the text-to-speech voice (spec §10.1). TTS reads an isolated
// letter poorly, so the bench compares several inputs and the owner picks one per letter by ear.
import { escapeXml } from './azure.ts';

export type LetterStrategy = 'bare' | 'name' | 'syllable' | 'ipa';

export interface LetterSpec {
	/** Bulgarian name of the letter, as said at school. */
	name: string;
	/** A short syllable carrying the sound, when the letter is not a vowel already said alone. */
	syllable?: string;
	/** IPA of the sound the course teaches (Ь is taught as ьо). */
	ipa: string;
	/** Input picked by ear on the bench for the app's recording. */
	pick: LetterStrategy;
}

export const LETTER_SPECS: Readonly<Record<string, LetterSpec>> = {
	А: { name: 'а', ipa: 'a', pick: 'bare' },
	Б: { name: 'бъ', syllable: 'ба', ipa: 'b', pick: 'bare' },
	В: { name: 'въ', syllable: 'ва', ipa: 'v', pick: 'bare' },
	Г: { name: 'гъ', syllable: 'га', ipa: 'g', pick: 'name' },
	Д: { name: 'дъ', syllable: 'да', ipa: 'd', pick: 'bare' },
	Е: { name: 'е', ipa: 'ɛ', pick: 'ipa' },
	Ж: { name: 'жъ', syllable: 'жа', ipa: 'ʒ', pick: 'ipa' },
	З: { name: 'зъ', syllable: 'за', ipa: 'z', pick: 'ipa' },
	И: { name: 'и', ipa: 'i', pick: 'ipa' },
	// A bare /j/ sounds like « i »: a trailing schwa makes the voice say the « y » of « yoga ».
	Й: { name: 'и кратко', syllable: 'ай', ipa: 'jə', pick: 'ipa' },
	К: { name: 'къ', syllable: 'ка', ipa: 'k', pick: 'bare' },
	Л: { name: 'лъ', syllable: 'ла', ipa: 'ɫ', pick: 'name' },
	М: { name: 'мъ', syllable: 'ма', ipa: 'm', pick: 'bare' },
	Н: { name: 'нъ', syllable: 'на', ipa: 'n', pick: 'bare' },
	О: { name: 'о', ipa: 'ɔ', pick: 'ipa' },
	П: { name: 'пъ', syllable: 'па', ipa: 'p', pick: 'name' },
	Р: { name: 'ръ', syllable: 'ра', ipa: 'r', pick: 'name' },
	С: { name: 'съ', syllable: 'са', ipa: 's', pick: 'ipa' },
	Т: { name: 'тъ', syllable: 'та', ipa: 't', pick: 'bare' },
	У: { name: 'у', ipa: 'u', pick: 'bare' },
	Ф: { name: 'фъ', syllable: 'фа', ipa: 'f', pick: 'bare' },
	Х: { name: 'хъ', syllable: 'ха', ipa: 'x', pick: 'name' },
	Ц: { name: 'цъ', syllable: 'ца', ipa: 't͡s', pick: 'bare' },
	Ч: { name: 'чъ', syllable: 'ча', ipa: 't͡ʃ', pick: 'bare' },
	Ш: { name: 'шъ', syllable: 'ша', ipa: 'ʃ', pick: 'bare' },
	Щ: { name: 'щъ', syllable: 'ща', ipa: 'ʃt', pick: 'name' },
	Ъ: { name: 'ер голям', syllable: 'мъ', ipa: 'ɤ', pick: 'ipa' },
	Ь: { name: 'ер малък', syllable: 'йо', ipa: 'jɔ', pick: 'ipa' },
	Ю: { name: 'ю', ipa: 'ju', pick: 'bare' },
	Я: { name: 'я', ipa: 'ja', pick: 'ipa' }
};

/** SSML fragment saying `letter` with the given input, or undefined when it has no such input. */
export function letterSsml(letter: string, strategy: LetterStrategy): string | undefined {
	const spec = LETTER_SPECS[letter];
	switch (strategy) {
		case 'bare':
			return escapeXml(letter);
		case 'name':
			return escapeXml(spec.name);
		case 'syllable':
			return spec.syllable && escapeXml(spec.syllable);
		case 'ipa':
			return `<phoneme alphabet="ipa" ph="${escapeXml(spec.ipa)}">${escapeXml(letter.toLowerCase())}</phoneme>`;
	}
}
