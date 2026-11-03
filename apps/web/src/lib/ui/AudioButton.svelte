<script lang="ts">
	import { m } from '#lib/i18n/index.js';
	import { playVoice, voiceUrl } from './audio/voice.js';
	import Icon from './Icon.svelte';
	import { app } from './state/app.svelte.js';

	// Plays the recording of a letter or a reading, with a second « turtle » button for the
	// slowed-down version when there is one (readings only). Hidden when there is no recording or
	// when the voice is turned off in the settings.
	let { name, autoplay = false }: { name: string; autoplay?: boolean } = $props();

	const available = $derived(app.settings.sound && voiceUrl(name) !== undefined);
	const slowAvailable = $derived(available && voiceUrl(name, true) !== undefined);

	$effect(() => {
		if (autoplay && available) playVoice(name);
	});
</script>

{#if available}
	<span class="buttons">
		<button
			type="button"
			class="audio"
			onclick={() => playVoice(name)}
			aria-label={m.common.listen}
		>
			<Icon name="speaker" size={26} />
		</button>
		{#if slowAvailable}
			<button
				type="button"
				class="audio slow"
				onclick={() => playVoice(name, true)}
				aria-label={m.common.listenSlowly}
			>
				<Icon name="turtle" size={22} />
			</button>
		{/if}
	</span>
{/if}

<style>
	.buttons {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.audio {
		display: grid;
		place-items: center;
		width: 4.25rem;
		height: 3rem;
		color: #fff;
		background: var(--color-primary);
		border: none;
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--color-primary-dark);
		cursor: pointer;
	}

	.slow {
		width: 3.5rem;
		height: 2.5rem;
	}

	.audio:active {
		transform: translateY(3px);
		box-shadow: 0 1px 0 var(--color-primary-dark);
	}
</style>
