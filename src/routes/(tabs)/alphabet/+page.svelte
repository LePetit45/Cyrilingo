<script lang="ts">
	import { BULGARIAN_ALPHABET, toLowercase, type BulgarianLetter } from '#lib/core/alphabet.js';
	import { lessonIntroducing } from '#lib/core/content/course.js';
	import { isLetterLearned } from '#lib/core/progress.js';
	import { m } from '#lib/i18n/index.js';
	import Cyrillic from '#lib/ui/Cyrillic.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import LetterCard from '#lib/ui/LetterCard.svelte';
	import { app } from '#lib/ui/state/app.svelte.js';

	// The 30 letters, learned (their lesson is completed) or not yet (spec §6, §7.1). Any letter
	// opens its discovery card, learned or not (free navigation, spec §4.2).
	const learnedCount = $derived(
		BULGARIAN_ALPHABET.filter((letter) => isLetterLearned(app.progress, letter)).length
	);

	let selected = $state<BulgarianLetter | undefined>();
	let dialog: HTMLDialogElement | undefined = $state();

	function open(letter: BulgarianLetter) {
		selected = letter;
		dialog?.showModal();
	}
</script>

<svelte:head>
	<title>{m.alphabet.title} · {m.app.name}</title>
</svelte:head>

<h1>{m.alphabet.title}</h1>
<p class="count">{m.alphabet.learnedCount(learnedCount, BULGARIAN_ALPHABET.length)}</p>

<ul class="grid">
	{#each BULGARIAN_ALPHABET as letter (letter)}
		{@const learned = isLetterLearned(app.progress, letter)}
		<li>
			<button
				type="button"
				class={['letter', lessonIntroducing(letter).section, { learned }]}
				onclick={() => open(letter)}
				aria-label="{letter}, {learned ? m.alphabet.learned : m.alphabet.notLearned}"
			>
				<Cyrillic>{letter}{toLowercase(letter)}</Cyrillic>
				{#if learned}<span class="check" aria-hidden="true"><Icon name="check" size={14} /></span
					>{/if}
			</button>
		</li>
	{/each}
</ul>

<dialog
	bind:this={dialog}
	aria-label={selected}
	onclose={() => (selected = undefined)}
	onclick={(event) => {
		if (event.target === dialog) dialog?.close();
	}}
>
	{#if selected}
		<button type="button" class="close" aria-label={m.common.close} onclick={() => dialog?.close()}>
			<Icon name="close" size={26} />
		</button>
		<LetterCard letter={selected} />
	{/if}
</dialog>

<style>
	h1 {
		margin: 0;
		font-size: 2rem;
	}

	.count {
		margin: 0.25rem 0 1.25rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.letter {
		--section: var(--color-allies);
		--section-dark: var(--color-allies-dark);

		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 1;
		padding: 0;
		font-size: 1.625rem;
		font-weight: 800;
		color: var(--color-text-muted);
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--color-border-dark);
		cursor: pointer;
		touch-action: manipulation;
	}

	.letter:active {
		transform: translateY(3px);
		box-shadow: 0 1px 0 var(--color-border-dark);
	}

	.falseFriends {
		--section: var(--color-false-friends);
		--section-dark: var(--color-false-friends-dark);
	}

	.greekCousins {
		--section: var(--color-greek-cousins);
		--section-dark: var(--color-greek-cousins-dark);
	}

	.newcomers {
		--section: var(--color-newcomers);
		--section-dark: var(--color-newcomers-dark);
	}

	.letter.learned {
		color: #fff;
		background: var(--section);
		border-color: var(--section-dark);
		box-shadow: 0 4px 0 var(--section-dark);
	}

	.check {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		display: grid;
		place-items: center;
		width: 1.125rem;
		height: 1.125rem;
		color: var(--section-dark);
		background: #fff;
		border-radius: 50%;
	}

	dialog {
		width: min(calc(100% - 1.5rem), var(--column-width));
		max-height: calc(100dvh - 2rem);
		padding: 0;
		overflow-y: auto;
		background: transparent;
		border: none;
	}

	dialog[open] {
		animation: rise 200ms ease-out;
	}

	dialog::backdrop {
		background: rgb(31 27 46 / 0.5);
	}

	.close {
		position: sticky;
		top: 0.5rem;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		margin: 0.5rem 0.5rem -3.25rem auto;
		color: var(--color-text-muted);
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: 50%;
		cursor: pointer;
	}

	@keyframes rise {
		from {
			transform: translateY(2rem);
			opacity: 0;
		}
	}
</style>
