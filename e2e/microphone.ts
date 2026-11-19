import type { Page } from '@playwright/test';

/**
 * Stands in for the microphone, so the tests can read words aloud without a sound card or a
 * permission prompt: `getUserMedia` gives a stream of nothing, and `MediaRecorder` hands over
 * half a second of silence as a real WAV file. The app still decodes it and converts it to
 * 16 kHz WAV, as with a real recording. With `denied`, the microphone is refused instead.
 */
export async function fakeMicrophone(page: Page, { denied = false } = {}) {
	await page.addInitScript((denied) => {
		const samples = 8_000;
		const wav = new DataView(new ArrayBuffer(44 + samples * 2));
		const text = (offset: number, value: string) =>
			[...value].forEach((char, i) => wav.setUint8(offset + i, char.charCodeAt(0)));
		text(0, 'RIFF');
		wav.setUint32(4, 36 + samples * 2, true);
		text(8, 'WAVE');
		text(12, 'fmt ');
		wav.setUint32(16, 16, true);
		wav.setUint16(20, 1, true);
		wav.setUint16(22, 1, true);
		wav.setUint32(24, 16_000, true);
		wav.setUint32(28, 32_000, true);
		wav.setUint16(32, 2, true);
		wav.setUint16(34, 16, true);
		text(36, 'data');
		wav.setUint32(40, samples * 2, true);

		class FakeMediaRecorder extends EventTarget {
			state: RecordingState = 'inactive';
			mimeType = 'audio/wav';
			start() {
				this.state = 'recording';
			}
			stop() {
				this.state = 'inactive';
				const data = new Event('dataavailable') as Event & { data: Blob };
				data.data = new Blob([wav.buffer], { type: 'audio/wav' });
				this.dispatchEvent(data);
				this.dispatchEvent(new Event('stop'));
			}
		}

		Object.defineProperty(window, 'MediaRecorder', { value: FakeMediaRecorder });
		Object.defineProperty(navigator, 'mediaDevices', {
			value: {
				getUserMedia: async () => {
					if (denied) throw new DOMException('Permission denied', 'NotAllowedError');
					return { getTracks: () => [{ stop() {} }] };
				}
			}
		});
	}, denied);
}
