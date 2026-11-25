// The microphone, for read-aloud questions (SPEC.md › The model feature): records until stopped,
// 5 seconds at most, then hands the recording over as 16 kHz mono WAV.
import { toSpeechWav } from './wav.js';

/** The longest recording: it stops by itself after this long. */
export const MAX_RECORDING_MS = 5_000;

/**
 * How long the recording goes on after the tap that stops it: learners tap as they say the last
 * sound, which would otherwise be cut.
 */
export const STOP_TAIL_MS = 500;

/**
 * How long the microphone records before the learner is told to speak: a microphone just opened
 * often misses its first fraction of a second, which would cut the start of the word.
 */
export const WARM_UP_MS = 300;

/** Why no recording could be made: the microphone was refused, or there is none. */
export class MicrophoneError extends Error {
	override name = 'MicrophoneError';

	constructor(readonly reason: 'denied' | 'missing') {
		super(`Microphone ${reason}`);
	}
}

export interface Recording {
	/** Resolves to the WAV file once the recording stopped, on `stop` or on the auto-stop. */
	finished: Promise<Uint8Array>;
	/** Stops the recording, `STOP_TAIL_MS` later. */
	stop(): void;
	/** Stops and throws the recording away, as when the learner leaves the question. */
	cancel(): void;
}

/**
 * Asks for the microphone and starts recording; resolves once the learner may speak. Rejects
 * with a `MicrophoneError`.
 */
export async function startRecording(): Promise<Recording> {
	if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
		throw new MicrophoneError('missing');
	}
	let stream: MediaStream;
	try {
		stream = await navigator.mediaDevices.getUserMedia({
			// Noise suppression and echo cancellation can swallow a short word: nothing plays while
			// recording, and the speech model copes with room noise.
			audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false }
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
	const stopNow = () => {
		clearTimeout(timer);
		clearTimeout(tail);
		if (recorder.state !== 'inactive') recorder.stop();
	};
	let tail: ReturnType<typeof setTimeout> | undefined;
	const started = new Promise<void>((resolve) => {
		recorder.addEventListener('start', () => resolve(), { once: true });
	});
	recorder.start();
	// Told to speak only once the recorder runs and the microphone had time to warm up.
	await Promise.race([started, stopped.catch(() => {})]);
	await new Promise((resolve) => setTimeout(resolve, WARM_UP_MS));
	const timer = setTimeout(stopNow, MAX_RECORDING_MS);

	const finished = stopped.finally(release).then(async () => {
		if (cancelled) throw new Error('Recording cancelled');
		const blob = new Blob(chunks, { type: recorder.mimeType });
		return toSpeechWav(await blob.arrayBuffer());
	});
	// A cancelled recording is never awaited: its rejection must not surface as unhandled.
	finished.catch(() => {});

	return {
		finished,
		stop() {
			tail ??= setTimeout(stopNow, STOP_TAIL_MS);
		},
		cancel() {
			cancelled = true;
			stopNow();
		}
	};
}
