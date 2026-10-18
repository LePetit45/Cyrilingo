<script lang="ts">
	import type { BulgarianLetter } from '#lib/core/alphabet.js';
	import Cyrillic from './Cyrillic.svelte';
	import { letterGlyph } from './letters.js';

	// A row of letter chips for the end screens (spec §6): the letters learned, or missed (in red).
	let {
		letters,
		missed = false,
		label
	}: { letters: readonly BulgarianLetter[]; missed?: boolean; label?: string } = $props();
</script>

<ul class={['chips', { missed }]} aria-label={label}>
	{#each letters as letter (letter)}
		<li><Cyrillic>{letterGlyph(letter)}</Cyrillic></li>
	{/each}
</ul>

<style>
	.chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 0.125rem 0.75rem;
		font-size: 1.625rem;
		font-weight: 800;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		box-shadow: 0 3px 0 var(--color-border);
	}

	.missed li {
		color: var(--color-error-dark);
		background: var(--color-error-light);
		border-color: var(--color-error-light);
		box-shadow: none;
	}
</style>
