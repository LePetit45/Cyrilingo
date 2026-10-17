<script lang="ts">
	import type { Reading } from '#lib/core/content/corpus.js';
	import Cyrillic from './Cyrillic.svelte';
	import { stressOf } from './letters.js';

	// A Bulgarian word with its stressed vowel underlined (spec §5.3). Syllables have no stress.
	let { reading }: { reading: Reading } = $props();

	const stress = $derived(stressOf(reading));
</script>

<Cyrillic
	>{#if stress === undefined}{reading}{:else}{reading.slice(0, stress)}<u>{reading[stress]}</u
		>{reading.slice(stress + 1)}{/if}</Cyrillic
>

<style>
	u {
		text-decoration-thickness: 0.12em;
		text-underline-offset: 0.12em;
		text-decoration-color: var(--color-primary);
	}
</style>
