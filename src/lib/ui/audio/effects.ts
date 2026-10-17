// Discreet correct / wrong sound effects (spec §8), synthesized with the Web Audio API so no
// audio file needs to be downloaded or cached.

let context: AudioContext | undefined;

function audioContext(): AudioContext | undefined {
	if (typeof AudioContext === 'undefined') return undefined;
	context ??= new AudioContext();
	if (context.state === 'suspended') void context.resume();
	return context;
}

/** Plays a short sequence of notes: [frequency in Hz, start in s, duration in s]. */
function playNotes(notes: [number, number, number][], type: OscillatorType, volume: number) {
	const audio = audioContext();
	if (!audio) return;
	const now = audio.currentTime;
	for (const [frequency, start, duration] of notes) {
		const oscillator = audio.createOscillator();
		const gain = audio.createGain();
		oscillator.type = type;
		oscillator.frequency.value = frequency;
		gain.gain.setValueAtTime(0, now + start);
		gain.gain.linearRampToValueAtTime(volume, now + start + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
		oscillator.connect(gain).connect(audio.destination);
		oscillator.start(now + start);
		oscillator.stop(now + start + duration);
	}
}

export type Effect = 'correct' | 'wrong' | 'complete';

export function playEffect(effect: Effect): void {
	try {
		if (effect === 'correct') {
			playNotes(
				[
					[880, 0, 0.12],
					[1318.5, 0.09, 0.22]
				],
				'sine',
				0.18
			);
		} else if (effect === 'wrong') {
			playNotes(
				[
					[220, 0, 0.16],
					[174.6, 0.12, 0.24]
				],
				'triangle',
				0.2
			);
		} else {
			playNotes(
				[
					[523.3, 0, 0.14],
					[659.3, 0.12, 0.14],
					[784, 0.24, 0.14],
					[1046.5, 0.36, 0.4]
				],
				'sine',
				0.18
			);
		}
	} catch {
		// Sound effects are a nicety: never let them break the lesson.
	}
}

/** Light vibration on a wrong answer, where supported (spec §8). */
export function vibrateWrong(): void {
	try {
		navigator.vibrate?.(120);
	} catch {
		// Not supported or not allowed.
	}
}
