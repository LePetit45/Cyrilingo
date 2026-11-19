// The read-aloud recording format (SPEC.md › The model feature › How it works): the browser sends
// 16 kHz mono 16-bit PCM WAV, and anything else is refused before it can reach the provider.

/** A 44-byte header and 5 s of audio make 160 044 bytes; this leaves room for a late stop. */
export const SPEECH_BODY_LIMIT = 200 * 1024;

const SAMPLE_RATE = 16_000;
const PCM = 1;

/**
 * Whether the bytes are a RIFF/WAVE file whose `fmt ` chunk says PCM, 1 channel, 16 000 Hz and
 * 16 bits, with a non-empty `data` chunk that fits in the file.
 */
export function isSpeechWav(bytes: Uint8Array): boolean {
	if (bytes.length < 12 || ascii(bytes, 0) !== 'RIFF' || ascii(bytes, 8) !== 'WAVE') return false;
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let format = false;
	// Chunks follow the 12-byte RIFF header: a 4-letter id, a 32-bit size, then the content,
	// padded to an even length.
	for (let offset = 12; offset + 8 <= bytes.length;) {
		const id = ascii(bytes, offset);
		const size = view.getUint32(offset + 4, true);
		const start = offset + 8;
		if (start + size > bytes.length) return false;
		if (id === 'fmt ') {
			format =
				size >= 16 &&
				view.getUint16(start, true) === PCM &&
				view.getUint16(start + 2, true) === 1 &&
				view.getUint32(start + 4, true) === SAMPLE_RATE &&
				view.getUint16(start + 14, true) === 16;
		} else if (id === 'data') {
			return format && size > 0;
		}
		offset = start + size + (size % 2);
	}
	return false;
}

function ascii(bytes: Uint8Array, offset: number): string {
	return String.fromCharCode(...bytes.subarray(offset, offset + 4));
}
