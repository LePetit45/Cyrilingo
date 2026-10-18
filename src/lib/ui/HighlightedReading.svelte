<script lang="ts">
	import type { BulgarianLetter } from '#lib/core/alphabet.js';
	import { letterOf } from '#lib/core/reading.js';
	import Cyrillic from './Cyrillic.svelte';

	// A syllable or word with every occurrence of the letter being learned underlined (spec §5.1,
	// §5.3). The stress is not shown: the audio carries it.
	let { reading, letter }: { reading: string; letter?: BulgarianLetter } = $props();

	const chars = $derived([...reading]);
</script>

<Cyrillic
	>{#each chars as char, index (index)}{#if letter && letterOf(char) === letter}<u>{char}</u
			>{:else}{char}{/if}{/each}</Cyrillic
>

<style>
	u {
		text-decoration-thickness: 0.12em;
		text-underline-offset: 0.12em;
		text-decoration-color: var(--color-primary);
	}
</style>
