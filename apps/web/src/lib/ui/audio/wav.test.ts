import { describe, expect, it } from 'vitest';
import { downmix, encodeWav, louder, lowCut, MAX_GAIN, TARGET_PEAK } from './wav.js';

describe('encodeWav', () => {
	it('writes a 16 kHz mono 16-bit PCM WAV header', () => {
		const wav = encodeWav(new Float32Array(16_000));
		const view = new DataView(wav.buffer);
		const text = (offset: number) => String.fromCharCode(...wav.subarray(offset, offset + 4));
		expect(wav.length).toBe(44 + 32_000);
		expect([text(0), text(8), text(12), text(36)]).toEqual(['RIFF', 'WAVE', 'fmt ', 'data']);
		expect(view.getUint32(4, true)).toBe(36 + 32_000);
		expect(view.getUint16(20, true)).toBe(1);
		expect(view.getUint16(22, true)).toBe(1);
		expect(view.getUint32(24, true)).toBe(16_000);
		expect(view.getUint32(28, true)).toBe(32_000);
		expect(view.getUint16(34, true)).toBe(16);
		expect(view.getUint32(40, true)).toBe(32_000);
	});

	it('turns samples into 16-bit integers, clipping beyond -1 and 1', () => {
		const wav = encodeWav(new Float32Array([0, 1, -1, 2, -2, 0.5]));
		const view = new DataView(wav.buffer);
		const samples = Array.from({ length: 6 }, (_, i) => view.getInt16(44 + i * 2, true));
		expect(samples).toEqual([0, 32767, -32768, 32767, -32768, 16383]);
	});
});

describe('downmix', () => {
	it('averages the channels', () => {
		expect(downmix([new Float32Array([1, 0.5])])).toEqual(new Float32Array([1, 0.5]));
		expect(downmix([new Float32Array([1, 0]), new Float32Array([0, 0.5])])).toEqual(
			new Float32Array([0.5, 0.25])
		);
	});
});

describe('lowCut', () => {
	const tone = (hertz: number) =>
		Float32Array.from({ length: 16_000 }, (_, i) => Math.sin((2 * Math.PI * hertz * i) / 16_000));
	const peak = (samples: Float32Array) => Math.max(...samples.slice(8_000).map(Math.abs));

	it('removes a constant offset and weakens a hum, but keeps the voice', () => {
		expect(peak(lowCut(new Float32Array(16_000).fill(0.5)))).toBeLessThan(0.001);
		expect(peak(lowCut(tone(30)))).toBeLessThan(0.35);
		expect(peak(lowCut(tone(1_000)))).toBeGreaterThan(0.95);
	});
});

describe('louder', () => {
	it('brings the loudest sample to the target', () => {
		expect(louder(new Float32Array([0.3, -0.45, 0.1]))).toEqual(
			new Float32Array([0.3, -0.45, 0.1].map((sample) => (sample * TARGET_PEAK) / 0.45))
		);
	});

	it('amplifies by 10 at most, never makes quieter, and leaves silence alone', () => {
		expect(louder(new Float32Array([0.001]))[0]).toBeCloseTo(0.001 * MAX_GAIN, 6);
		expect(louder(new Float32Array([1, -0.5]))).toEqual(new Float32Array([1, -0.5]));
		expect(louder(new Float32Array(3))).toEqual(new Float32Array(3));
	});
});
