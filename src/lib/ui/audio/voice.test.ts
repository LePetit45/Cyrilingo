import { describe, expect, it } from 'vitest';
import { BULGARIAN_ALPHABET } from '../../core/alphabet.js';
import { SYLLABLES, WORDS } from '../../core/content/corpus.js';
import { voiceUrl } from './voice.js';

// Recordings are generated from the course content (spec §10.1): after editing the corpus, run
// `npm run audio` so every new reading gets its files.
describe('recordings', () => {
	it('exist for every letter', () => {
		const missing = BULGARIAN_ALPHABET.filter((letter) => !voiceUrl(letter));
		expect(missing).toEqual([]);
	});

	it('exist at normal and slow speed for every word and syllable', () => {
		const missing = [...Object.keys(WORDS), ...SYLLABLES].filter(
			(reading) => !voiceUrl(reading) || !voiceUrl(reading, true)
		);
		expect(missing).toEqual([]);
	});
});
