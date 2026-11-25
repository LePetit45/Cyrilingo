<script lang="ts">
	import { api } from '#lib/api/client.js';
	import { m } from '#lib/i18n/index.js';
	import { MicrophoneError, startRecording, type Recording } from '../audio/recorder.js';
	import Icon from '../Icon.svelte';
	import { checkRecording, type ReadAloudResult } from './read-aloud.js';

	// The microphone of a read-aloud question (SPEC.md › The model feature): a tap starts the
	// recording, a second tap (or 5 seconds) stops it, then the recording is checked by the API.
	// While it works, it says so (AC-48); the verdict goes to the player.
	let {
		word,
		disabled = false,
		onresult
	}: {
		word: string;
		/** Once a verdict is shown, until the learner moves on or tries again. */
		disabled?: boolean;
		onresult: (result: ReadAloudResult) => void;
	} = $props();

	let phase = $state<'idle' | 'starting' | 'recording' | 'analyzing'>('idle');
	let recording: Recording | undefined;

	const status = $derived(
		phase === 'recording'
			? m.question.listening
			: phase === 'analyzing'
				? m.question.analyzing
				: disabled
					? ''
					: m.question.readAloudHint
	);

	async function toggle() {
		if (phase === 'recording') {
			recording?.stop();
			return;
		}
		if (phase !== 'idle' || disabled) return;
		phase = 'starting';
		try {
			recording = await startRecording();
		} catch (error) {
			phase = 'idle';
			const reason = error instanceof MicrophoneError ? error.reason : 'missing';
			onresult({ outcome: 'unavailable', reason });
			return;
		}
		phase = 'recording';
		const finished = recording.finished;
		// The recording ends on a second tap or by itself after 5 seconds.
		await finished.catch(() => {});
		if (phase !== 'recording') return;
		phase = 'analyzing';
		const result = await checkRecording(api.recognizeSpeech, word, finished);
		phase = 'idle';
		recording = undefined;
		onresult(result);
	}

	// Leaving the question (« Je ne peux pas parler », quitting) stops the microphone.
	$effect(() => () => {
		recording?.cancel();
		phase = 'idle';
	});
</script>

<div class="read-aloud">
	<button
		type="button"
		class={['mic', phase]}
		aria-label={phase === 'recording' ? m.question.stopRecording : m.question.startRecording}
		aria-pressed={phase === 'recording'}
		disabled={disabled || phase === 'starting' || phase === 'analyzing'}
		onclick={toggle}
	>
		{#if phase === 'analyzing'}
			<span class="spinner" aria-hidden="true"></span>
		{:else}
			<Icon name={phase === 'recording' ? 'stop' : 'mic'} size={40} />
		{/if}
	</button>
	<p class="status" role="status">{status}</p>
</div>

<style>
	.read-aloud {
		display: grid;
		justify-items: center;
		gap: 0.75rem;
	}

	.mic {
		position: relative;
		display: grid;
		place-items: center;
		width: 6rem;
		height: 6rem;
		color: #fff;
		background: var(--color-accent);
		border: none;
		border-radius: 50%;
		box-shadow: 0 5px 0 var(--color-accent-dark);
		cursor: pointer;
	}

	.mic:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow: 0 2px 0 var(--color-accent-dark);
	}

	.mic:disabled {
		cursor: default;
	}

	.mic:disabled:not(.analyzing) {
		color: var(--color-text-faint);
		background: var(--color-surface-muted);
		box-shadow: 0 5px 0 var(--color-border);
	}

	.recording {
		background: var(--color-error);
		box-shadow: 0 5px 0 var(--color-error-dark);
	}

	/* A ring growing out of the button while it listens. */
	.recording::after {
		position: absolute;
		inset: 0;
		border: 4px solid var(--color-error);
		border-radius: 50%;
		content: '';
		animation: pulse 1.2s ease-out infinite;
	}

	.spinner {
		width: 2.25rem;
		height: 2.25rem;
		border: 4px solid rgb(255 255 255 / 40%);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.status {
		min-height: 1.5em;
		margin: 0;
		font-weight: 700;
		color: var(--color-text-muted);
		text-align: center;
	}

	@keyframes pulse {
		from {
			opacity: 0.8;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(1.5);
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.recording::after,
		.spinner {
			animation-duration: 3s;
		}
	}
</style>
