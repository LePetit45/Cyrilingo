import { describe, expect, it } from 'vitest';
import { downmix, encodeWav } from './wav.js';

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
