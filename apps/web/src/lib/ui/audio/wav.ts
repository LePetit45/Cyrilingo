// The read-aloud recording format (SPEC.md › The model feature › How it works): 16 kHz mono
// 16-bit PCM WAV, made in the browser so the server does no audio processing.

export const SPEECH_SAMPLE_RATE = 16_000;

/** A WAV file of 16-bit PCM samples, from samples between -1 and 1 (clipped beyond). */
export function encodeWav(samples: Float32Array, sampleRate = SPEECH_SAMPLE_RATE): Uint8Array {
	const bytes = new Uint8Array(44 + samples.length * 2);
	const view = new DataView(bytes.buffer);
	const text = (offset: number, value: string) => {
		for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
	};
	text(0, 'RIFF');
	view.setUint32(4, 36 + samples.length * 2, true);
	text(8, 'WAVE');
	text(12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true); // PCM
	view.setUint16(22, 1, true); // mono
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true); // bytes per second
	view.setUint16(32, 2, true); // bytes per sample frame
	view.setUint16(34, 16, true); // bits per sample
	text(36, 'data');
	view.setUint32(40, samples.length * 2, true);
	samples.forEach((sample, i) => {
		const clipped = Math.max(-1, Math.min(1, sample));
		view.setInt16(44 + i * 2, clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff, true);
	});
	return bytes;
}

/** The average of the channels, sample by sample. */
export function downmix(channels: readonly Float32Array[]): Float32Array {
	if (channels.length === 1) return channels[0];
	const mono = new Float32Array(channels[0]?.length ?? 0);
	for (const channel of channels) {
		channel.forEach((sample, i) => (mono[i] += sample / channels.length));
	}
	return mono;
}

/**
 * Turns what `MediaRecorder` recorded (WebM, MP4… whatever the browser makes) into 16 kHz mono
 * WAV. Decoding through a 16 kHz `OfflineAudioContext` resamples on the way, and needs no
 * `AudioContext`: nothing is played.
 */
export async function toSpeechWav(recorded: ArrayBuffer): Promise<Uint8Array> {
	const context = new OfflineAudioContext(1, 1, SPEECH_SAMPLE_RATE);
	const audio = await context.decodeAudioData(recorded);
	const channels = Array.from({ length: audio.numberOfChannels }, (_, i) =>
		audio.getChannelData(i)
	);
	return encodeWav(downmix(channels), audio.sampleRate);
}
