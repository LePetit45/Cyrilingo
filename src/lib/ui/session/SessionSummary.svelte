<script lang="ts">
	import { BULGARIAN_ALPHABET, type BulgarianLetter } from '#lib/core/alphabet.js';
	import type { Summary } from '#lib/core/engine/session.js';
	import { isLetterLearned } from '#lib/core/progress.js';
	import { m } from '#lib/i18n/index.js';
	import BottomBar from '../BottomBar.svelte';
	import Button from '../Button.svelte';
	import Cyrillic from '../Cyrillic.svelte';
	import { letterGlyph } from '../letters.js';
	import { app } from '../state/app.svelte.js';

	// End-of-session summary (spec §6): first-try success rate and the letters missed. After a
	// lesson, also the letters it taught and how many letters are read so far.
	let {
		title,
		summary,
		newLetters,
		nextHref,
		onreplay
	}: {
		title: string;
		summary: Summary;
		/** The letters a completed lesson taught; left out for a free review. */
		newLetters?: readonly BulgarianLetter[];
		nextHref: string;
		onreplay: () => void;
	} = $props();

	const percent = $derived(Math.round(summary.rate * 100));
	const learnedCount = $derived(
		BULGARIAN_ALPHABET.filter((letter) => isLetterLearned(app.progress, letter)).length
	);

	// Announce the end of the session by moving focus to its title.
	let heading: HTMLElement | undefined = $state();
	$effect(() => {
		heading?.focus();
	});
</script>

<section class="summary" aria-labelledby="summary-title">
	<div class="content">
		<div class="trophy" aria-hidden="true">
			<svg width="88" height="88" viewBox="0 0 32 32">
				<path
					d="M8 7H4.5a4 4 0 0 0 5 5.5M24 7h3.5a4 4 0 0 1-5 5.5"
					fill="none"
					stroke="#ffc21a"
					stroke-width="2.4"
				/>
				<path d="M8 4h16v7a8 8 0 0 1-16 0Z" fill="#ffc21a" />
				<path
					d="M11.5 6.5h2v5a3 3 0 0 0 1.5 2.6"
					fill="none"
					stroke="#fff"
					stroke-opacity="0.5"
					stroke-width="1.6"
					stroke-linecap="round"
				/>
				<rect x="13.5" y="18" width="5" height="5" fill="#d99e00" />
				<rect x="9" y="23" width="14" height="5" rx="2" fill="#ff9600" />
			</svg>
		</div>
		<h1 id="summary-title" tabindex="-1" bind:this={heading}>{title}</h1>
		{#if newLetters}
			<p class="subtitle">{m.summary.newLetters(newLetters.length)}</p>
		{/if}

		<div class="stats">
			<div class="stat accuracy">
				<span class="stat-label">{m.summary.firstTry}</span>
				<span class="stat-value">{percent} %</span>
			</div>
			{#if newLetters}
				<div class="stat letters">
					<span class="stat-label">{m.summary.lettersRead}</span>
					<span class="stat-value">{learnedCount}/{BULGARIAN_ALPHABET.length}</span>
				</div>
			{/if}
		</div>

		{#if newLetters}
			<ul class="chips" aria-label={m.summary.learned}>
				{#each newLetters as letter (letter)}
					<li><Cyrillic>{letterGlyph(letter)}</Cyrillic></li>
				{/each}
			</ul>
		{/if}

		{#if summary.missedLetters.length > 0}
			<div class="missed">
				<h2>{m.summary.missed}</h2>
				<ul class="chips">
					{#each summary.missedLetters as letter (letter)}
						<li><Cyrillic>{letterGlyph(letter)}</Cyrillic></li>
					{/each}
				</ul>
			</div>
		{:else}
			<p class="perfect">{m.summary.noMiss}</p>
		{/if}
	</div>

	<BottomBar actions>
		<Button variant="secondary" class="side" onclick={onreplay}>{m.summary.replay}</Button>
		<Button href={nextHref} class="grow">{m.summary.next}</Button>
	</BottomBar>
</section>

<style>
	.summary {
		display: flex;
		flex: 1;
		flex-direction: column;
	}

	/* Centered in the space above the bottom bar. */
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin: auto 0;
		padding: 1.5rem 0;
		text-align: center;
	}

	.trophy {
		display: grid;
		place-items: center;
		width: 9rem;
		height: 9rem;
		margin-bottom: 0.5rem;
		background: var(--color-gold-light);
		border-radius: 50%;
		animation: pop 600ms cubic-bezier(0.2, 1.6, 0.4, 1);
	}

	h1 {
		margin: 0;
		outline: none;
		font-size: 2rem;
		color: var(--color-gold-ink);
	}

	.subtitle {
		margin: -0.5rem 0 0;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.stats {
		display: flex;
		gap: 0.875rem;
		width: 100%;
		max-width: 22rem;
		margin-top: 0.5rem;
	}

	/* A colored band with the label, above a white box with the value. */
	.stat {
		--tone: var(--color-success-dark);
		display: grid;
		flex: 1;
		overflow: hidden;
		background: var(--tone);
		border: 2px solid var(--tone);
		border-radius: var(--radius-md);
	}

	.letters {
		--tone: var(--color-accent-dark);
	}

	.stat-label {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #fff;
	}

	.stat-value {
		padding: 0.625rem 0;
		font-size: 1.5rem;
		font-weight: 900;
		color: var(--tone);
		background: var(--color-surface);
		border-radius: calc(var(--radius-md) - 2px);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.chips li {
		padding: 0.125rem 0.75rem;
		font-size: 1.625rem;
		font-weight: 800;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		box-shadow: 0 3px 0 var(--color-border);
	}

	.missed h2 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		color: var(--color-text-muted);
	}

	.missed li {
		color: var(--color-error-dark);
		background: var(--color-error-light);
		border-color: var(--color-error-light);
		box-shadow: none;
	}

	.perfect {
		margin: 0;
		font-weight: 800;
		color: var(--color-success-dark);
	}

	@keyframes pop {
		from {
			transform: scale(0);
		}
	}
</style>
