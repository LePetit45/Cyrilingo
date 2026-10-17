<script lang="ts">
	import { BULGARIAN_ALPHABET, toLowercase, type BulgarianLetter } from '#lib/core/alphabet.js';
	import { isLetterLearned } from '#lib/core/progress.js';
	import { m } from '#lib/i18n/index.js';
	import Cyrillic from '#lib/ui/Cyrillic.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import LetterCard from '#lib/ui/LetterCard.svelte';
	import ProgressBar from '#lib/ui/ProgressBar.svelte';
	import { app } from '#lib/ui/state/app.svelte.js';

	// The 30 letters, learned (their lesson is completed, in green) or not yet (in white) (spec §6,
	// §7.1). Any letter opens its discovery card, learned or not (free navigation, spec §4.2).
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
<div class="progress">
	<p class="count">{m.alphabet.learnedCount(learnedCount, BULGARIAN_ALPHABET.length)}</p>
	<ProgressBar value={learnedCount / BULGARIAN_ALPHABET.length} />
</div>

<ul class="grid">
	{#each BULGARIAN_ALPHABET as letter (letter)}
		{@const learned = isLetterLearned(app.progress, letter)}
		<li>
			<button
				type="button"
				class={['letter', { learned }]}
				onclick={() => open(letter)}
				aria-label="{letter}, {learned ? m.alphabet.learned : m.alphabet.notLearned}"
			>
				<Cyrillic>{letter}{toLowercase(letter)}</Cyrillic>
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
		{@const learned = isLetterLearned(app.progress, selected)}
		<LetterCard letter={selected}>
			{#snippet header()}
				<div class="card-header">
					<button
						type="button"
						class="close"
						aria-label={m.common.close}
						onclick={() => dialog?.close()}
					>
						<Icon name="close" size={28} />
					</button>
					<p class={['status', { learned }]}>
						{#if learned}<Icon name="check" size={18} />{/if}
						{learned ? m.alphabet.learned : m.alphabet.notLearned}
					</p>
				</div>
			{/snippet}
		</LetterCard>
	{/if}
</dialog>

<style>
	h1 {
		margin: 0;
		font-size: 2rem;
	}

	.progress {
		display: grid;
		gap: 0.5rem;
		margin: 0.25rem 0 1.5rem;
	}

	.count {
		margin: 0;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.625rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.letter {
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

	.letter.learned {
		color: #fff;
		background: var(--color-primary);
		border-color: var(--color-primary-dark);
		box-shadow: 0 4px 0 var(--color-primary-dark);
	}

	.letter.learned:active {
		box-shadow: 0 1px 0 var(--color-primary-dark);
	}

	dialog {
		width: min(calc(100% - 1.5rem), 28rem);
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

	/* Same layout as the lesson header: ✕ on the left, the label centered on the card. */
	.card-header {
		display: flex;
		align-items: center;
		margin: -0.5rem -0.75rem 0;
	}

	.close {
		display: grid;
		flex: none;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		color: var(--color-text-muted);
		background: none;
		border: none;
		border-radius: 50%;
		cursor: pointer;
	}

	.close:hover {
		background: var(--color-surface-muted);
	}

	.status {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		margin: 0 2.75rem 0 0;
		font-size: 0.875rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.status.learned {
		color: var(--color-primary-dark);
	}

	@keyframes rise {
		from {
			transform: translateY(2rem);
			opacity: 0;
		}
	}
</style>
