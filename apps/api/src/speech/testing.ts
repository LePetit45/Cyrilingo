// A stand-in for the speech provider in the tests and the end-to-end API (SPEC.md › Tests and
// coverage). Test code only: no test calls a real provider.
import {
	SpeechProviderError,
	type Recognition,
	type SpeechClient,
	type SpeechLanguage
} from './client.js';

/**
 * What the fake does on the next calls: answer a recognition (right, wrong or garbage text, or
 * nothing heard), fail with a provider status, or never answer (until the call is aborted).
 */
export type FakeBehavior = Recognition | { failWith: number } | 'hang';

export class FakeSpeechClient implements SpeechClient {
	/** Everything the provider would have received, to check nothing else is sent (AC-47). */
	readonly calls: { audio: Uint8Array; language: SpeechLanguage }[] = [];

	constructor(public behavior: FakeBehavior = { status: 'no_match' }) {}

	recognize(
		audio: Uint8Array,
		language: SpeechLanguage,
		signal: AbortSignal
	): Promise<Recognition> {
		this.calls.push({ audio, language });
		const behavior = this.behavior;
		if (behavior === 'hang') {
			return new Promise((_, reject) => {
				signal.addEventListener('abort', () => reject(signal.reason as Error), { once: true });
			});
		}
		if ('failWith' in behavior) return Promise.reject(new SpeechProviderError(behavior.failWith));
		return Promise.resolve(behavior);
	}
}

/** A WAV file of silence, 16 kHz mono 16-bit PCM unless told otherwise. */
export function makeWav({
	seconds = 1,
	sampleRate = 16_000,
	channels = 1,
	bits = 16,
	format = 1
}: {
	seconds?: number;
	sampleRate?: number;
	channels?: number;
	bits?: number;
	format?: number;
} = {}): Uint8Array {
	const dataSize = Math.round(seconds * sampleRate) * channels * (bits / 8);
	const bytes = new Uint8Array(44 + dataSize);
	const view = new DataView(bytes.buffer);
	const text = (offset: number, value: string) =>
		[...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
	text(0, 'RIFF');
	view.setUint32(4, 36 + dataSize, true);
	text(8, 'WAVE');
	text(12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, format, true);
	view.setUint16(22, channels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * channels * (bits / 8), true);
	view.setUint16(32, channels * (bits / 8), true);
	view.setUint16(34, bits, true);
	text(36, 'data');
	view.setUint32(40, dataSize, true);
	return bytes;
}
