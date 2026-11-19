import { describe, expect, it, vi } from 'vitest';
import { canRetry, checkRecording, resultOf } from './read-aloud.js';

const AUDIO = new Uint8Array([1, 2, 3]);

describe('read-aloud tries', () => {
	it('[AC-43] passes the verdict of the API on', async () => {
		const recognize = vi.fn(async () => ({
			ok: true as const,
			value: { outcome: 'mismatch' as const, heard: 'мляко' }
		}));
		expect(await checkRecording(recognize, 'котка', Promise.resolve(AUDIO))).toEqual({
			outcome: 'mismatch',
			heard: 'мляко'
		});
		expect(recognize).toHaveBeenCalledWith('котка', AUDIO);
	});

	it('[AC-42] counts a recording that could not be read as nothing heard, without calling the API', async () => {
		const recognize = vi.fn();
		expect(await checkRecording(recognize, 'котка', Promise.reject(new Error('empty')))).toEqual({
			outcome: 'not_understood'
		});
		expect(recognize).not.toHaveBeenCalled();
	});

	it('[AC-44] turns an unavailable verdict, a network failure or any refusal into unavailable', () => {
		expect(resultOf({ ok: true, value: { outcome: 'unavailable' } })).toEqual({
			outcome: 'unavailable',
			reason: 'service'
		});
		for (const error of ['network', 'unknown', 'unauthenticated', 'payload_too_large'] as const) {
			expect(resultOf({ ok: false, error })).toEqual({ outcome: 'unavailable', reason: 'service' });
		}
	});

	it('[AC-46] tells a reached quota apart', () => {
		expect(resultOf({ ok: false, error: 'speech_quota_reached' })).toEqual({
			outcome: 'unavailable',
			reason: 'quota'
		});
	});

	it('[AC-43] allows a second try after a mismatch or nothing heard, and no third', () => {
		expect(canRetry({ outcome: 'mismatch', heard: 'мляко' }, 1)).toBe(true);
		expect(canRetry({ outcome: 'not_understood' }, 1)).toBe(true);
		expect(canRetry({ outcome: 'mismatch', heard: 'мляко' }, 2)).toBe(false);
		expect(canRetry({ outcome: 'match' }, 1)).toBe(false);
		expect(canRetry({ outcome: 'unavailable', reason: 'service' }, 1)).toBe(false);
	});
});
