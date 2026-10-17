<script lang="ts">
	import type { Summary } from '#lib/core/engine/session.js';
	import { m } from '#lib/i18n/index.js';
	import Button from '../Button.svelte';
	import Cyrillic from '../Cyrillic.svelte';
	import Icon from '../Icon.svelte';
	import { letterGlyph } from '../letters.js';

	// End-of-session summary (spec §6): first-try success rate and the letters missed.
	let {
		title,
		summary,
		nextHref,
		onreplay
	}: { title: string; summary: Summary; nextHref: string; onreplay: () => void } = $props();

	const percent = $derived(Math.round(summary.rate * 100));

	// Announce the end of the session by moving focus to its title.
	let heading: HTMLElement | undefined = $state();
	$effect(() => {
		heading?.focus();
	});
</script>

<section class="summary" aria-labelledby="summary-title">
	<div class="trophy" aria-hidden="true"><Icon name="star" size={64} /></div>
	<h1 id="summary-title" tabindex="-1" bind:this={heading}>{title}</h1>

	<div class="score">
		<span class="percent">{percent} %</span>
		<span class="label">{m.summary.firstTry}</span>
	</div>

	{#if summary.missedLetters.length > 0}
		<div class="missed">
			<h2>{m.summary.missed}</h2>
			<ul>
				{#each summary.missedLetters as letter (letter)}
					<li><Cyrillic>{letterGlyph(letter)}</Cyrillic></li>
				{/each}
			</ul>
		</div>
	{:else}
		<p class="perfect">{m.summary.noMiss}</p>
	{/if}

	<div class="actions">
		<Button href={nextHref} wide>{m.summary.next}</Button>
		<Button variant="secondary" wide onclick={onreplay}>{m.summary.replay}</Button>
	</div>
</section>

<style>
	.summary {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		padding-top: 2rem;
		text-align: center;
	}

	.trophy {
		display: grid;
		place-items: center;
		width: 7.5rem;
		height: 7.5rem;
		color: #fff;
		background: var(--color-gold);
		border-radius: 50%;
		box-shadow: 0 7px 0 var(--color-gold-dark);
		animation: pop 600ms cubic-bezier(0.2, 1.6, 0.4, 1);
	}

	.trophy :global(svg) {
		fill: currentColor;
	}

	h1 {
		margin: 0;
		outline: none;
		font-size: 2rem;
	}

	.score {
		display: grid;
		padding: 1rem 2rem;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 5px 0 var(--color-border-dark);
	}

	.percent {
		font-size: 2.75rem;
		font-weight: 900;
		color: var(--color-success-dark);
	}

	.label {
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.missed h2 {
		margin: 0 0 0.5rem;
		font-size: 1.125rem;
	}

	.missed ul {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.missed li {
		padding: 0.25rem 0.75rem;
		font-size: 1.75rem;
		font-weight: 900;
		color: var(--color-error-dark);
		background: var(--color-error-light);
		border-radius: var(--radius-md);
	}

	.perfect {
		margin: 0;
		font-weight: 800;
		color: var(--color-success-dark);
	}

	.actions {
		display: grid;
		gap: 0.875rem;
		width: 100%;
		margin-top: auto;
	}

	@keyframes pop {
		from {
			transform: scale(0);
		}
	}
</style>
