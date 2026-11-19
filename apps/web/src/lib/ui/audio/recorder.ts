// The microphone, for read-aloud questions (SPEC.md › The model feature): records until stopped,
// 5 seconds at most, then hands the recording over as 16 kHz mono WAV.
import { toSpeechWav } from './wav.js';

/** The longest recording: it stops by itself after this long. */
export const MAX_RECORDING_MS = 5_000;

/** Why no recording could be made: the microphone was refused, or there is none. */
export class MicrophoneError extends Error {
	override name = 'MicrophoneError';

	constructor(readonly reason: 'denied' | 'missing') {
		super(`Microphone ${reason}`);
	}
}

export interface Recording {
	/** Stops (if still recording) and resolves to the WAV file. Also resolves on the auto-stop. */
	finished: Promise<Uint8Array>;
	stop(): void;
	/** Stops and throws the recording away, as when the learner leaves the question. */
	cancel(): void;
}

/** Asks for the microphone and starts recording. Rejects with a `MicrophoneError`. */
export async function startRecording(): Promise<Recording> {
	if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
		throw new MicrophoneError('missing');
	}
	let stream: MediaStream;
	try {
		stream = await navigator.mediaDevices.getUserMedia({
			audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
		});
	} catch (error) {
		const name = (error as { name?: string } | null)?.name;
		throw new MicrophoneError(
			name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'missing'
		);
	}

	const recorder = new MediaRecorder(stream);
	const chunks: Blob[] = [];
	let cancelled = false;
	const release = () => stream.getTracks().forEach((track) => track.stop());
	recorder.addEventListener('dataavailable', (event) => {
		if (event.data.size > 0) chunks.push(event.data);
	});
	const stopped = new Promise<void>((resolve, reject) => {
		recorder.addEventListener('stop', () => resolve());
		recorder.addEventListener('error', () => reject(new MicrophoneError('missing')));
	});
	const stop = () => {
		clearTimeout(timer);
		if (recorder.state !== 'inactive') recorder.stop();
	};
	const timer = setTimeout(stop, MAX_RECORDING_MS);
	recorder.start();

	const finished = stopped.finally(release).then(async () => {
		if (cancelled) throw new Error('Recording cancelled');
		const blob = new Blob(chunks, { type: recorder.mimeType });
		return toSpeechWav(await blob.arrayBuffer());
	});
	// A cancelled recording is never awaited: its rejection must not surface as unhandled.
	finished.catch(() => {});

	return {
		finished,
		stop,
		cancel() {
			cancelled = true;
			stop();
		}
	};
}
