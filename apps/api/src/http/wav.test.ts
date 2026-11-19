import { describe, expect, it } from 'vitest';
import { makeWav } from '../speech/testing.js';
import { isSpeechWav } from './wav.js';

describe('isSpeechWav', () => {
	it('[AC-49] accepts 16 kHz mono 16-bit PCM WAV with audio data', () => {
		expect(isSpeechWav(makeWav())).toBe(true);
		expect(isSpeechWav(makeWav({ seconds: 5 }))).toBe(true);
	});

	it('[AC-49] skips other chunks before the audio data', () => {
		const wav = makeWav();
		// A 6-byte LIST chunk (padded to 6) between `fmt ` and `data`.
		const list = new Uint8Array(
			[...'LIST'].map((c) => c.charCodeAt(0)).concat([6, 0, 0, 0, 1, 2, 3, 4, 5, 6])
		);
		const withList = new Uint8Array([...wav.subarray(0, 36), ...list, ...wav.subarray(36)]);
		expect(isSpeechWav(withList)).toBe(true);
	});

	it('[AC-49] refuses another format, rate, channel count or sample size', () => {
		expect(isSpeechWav(makeWav({ sampleRate: 44_100 }))).toBe(false);
		expect(isSpeechWav(makeWav({ channels: 2 }))).toBe(false);
		expect(isSpeechWav(makeWav({ bits: 8 }))).toBe(false);
		expect(isSpeechWav(makeWav({ format: 3 }))).toBe(false);
	});

	it('[AC-49] refuses no audio data, a cut file and anything that is not WAV', () => {
		expect(isSpeechWav(makeWav({ seconds: 0 }))).toBe(false);
		expect(isSpeechWav(makeWav().subarray(0, 100))).toBe(false);
		expect(isSpeechWav(makeWav().subarray(0, 40))).toBe(false);
		expect(isSpeechWav(new TextEncoder().encode('OggS not a wav file at all'))).toBe(false);
		expect(isSpeechWav(new Uint8Array())).toBe(false);
	});
});
