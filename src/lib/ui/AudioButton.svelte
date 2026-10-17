<script lang="ts">
	import { m } from '#lib/i18n/index.js';
	import { playVoice, voiceUrl } from './audio/voice.js';
	import Icon from './Icon.svelte';
	import { app } from './state/app.svelte.js';

	// Plays the recording of a letter or a word. Hidden when there is no recording or when the
	// voice is turned off in the settings.
	let { name, autoplay = false }: { name: string; autoplay?: boolean } = $props();

	const available = $derived(app.settings.sound && voiceUrl(name) !== undefined);

	$effect(() => {
		if (autoplay && available) playVoice(name);
	});
</script>

{#if available}
	<button type="button" class="audio" onclick={() => playVoice(name)} aria-label={m.common.listen}>
		<Icon name="speaker" size={26} />
	</button>
{/if}

<style>
	.audio {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		color: #fff;
		background: var(--color-accent);
		border: none;
		border-radius: 50%;
		box-shadow: 0 4px 0 var(--color-accent-dark);
		cursor: pointer;
	}

	.audio:active {
		transform: translateY(3px);
		box-shadow: 0 1px 0 var(--color-accent-dark);
	}
</style>
