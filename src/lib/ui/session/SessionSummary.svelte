<script lang="ts">
	import { BULGARIAN_ALPHABET, type BulgarianLetter } from '#lib/core/alphabet.js';
	import type { Summary } from '#lib/core/engine/session.js';
	import { isLetterLearned } from '#lib/core/progress.js';
	import { m } from '#lib/i18n/index.js';
	import BottomBar from '../BottomBar.svelte';
	import Button from '../Button.svelte';
	import LetterChips from '../LetterChips.svelte';
	import StatBlock from '../StatBlock.svelte';
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
			<StatBlock label={m.summary.firstTry} value="{percent} %" />
			{#if newLetters}
				<StatBlock
					label={m.summary.lettersRead}
					value="{learnedCount}/{BULGARIAN_ALPHABET.length}"
					tone="accent"
				/>
			{/if}
		</div>

		{#if newLetters}
			<LetterChips letters={newLetters} label={m.summary.learned} />
		{/if}

		{#if summary.missedLetters.length > 0}
			<div class="missed">
				<h2>{m.summary.missed}</h2>
				<LetterChips letters={summary.missedLetters} missed />
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

	.missed h2 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		color: var(--color-text-muted);
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
