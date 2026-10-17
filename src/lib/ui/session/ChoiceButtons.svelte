<script lang="ts" module>
	export interface Choice {
		key: string;
		label: string;
		/** Whether the label is Bulgarian text (letter glyphs) rather than a Latin sound. */
		cyrillic: boolean;
	}
</script>

<script lang="ts">
	import Cyrillic from '../Cyrillic.svelte';

	// The 4 answers of a multiple-choice question (spec §5.2). Validated as soon as one is picked,
	// by tap, click or keys 1–4 (spec §5.3).
	let {
		choices,
		correctKey,
		selectedKey,
		revealed,
		onchoose
	}: {
		choices: readonly Choice[];
		correctKey: string;
		/** The picked answer, once answered. */
		selectedKey?: string;
		/** Whether the question is answered (picked or "I don't know"), showing the right answer. */
		revealed: boolean;
		onchoose: (key: string) => void;
	} = $props();

	function onkeydown(event: KeyboardEvent) {
		if (revealed || event.defaultPrevented || event.repeat) return;
		if (event.target instanceof HTMLInputElement) return;
		const index = Number(event.key) - 1;
		const choice = choices[index];
		if (!choice) return;
		event.preventDefault();
		onchoose(choice.key);
	}
</script>

<svelte:window {onkeydown} />

<ul class="choices">
	{#each choices as choice, index (choice.key)}
		{@const state = !revealed
			? 'idle'
			: choice.key === correctKey
				? 'correct'
				: choice.key === selectedKey
					? 'wrong'
					: 'faded'}
		<li>
			<button
				type="button"
				class={['choice', state, { cyrillic: choice.cyrillic }]}
				disabled={revealed}
				onclick={() => onchoose(choice.key)}
			>
				<span class="key" aria-hidden="true">{index + 1}</span>
				{#if choice.cyrillic}
					<Cyrillic>{choice.label}</Cyrillic>
				{:else}
					<span>{choice.label}</span>
				{/if}
			</button>
		</li>
	{/each}
</ul>

<style>
	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.875rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.choice {
		--bg: var(--color-surface);
		--edge: var(--color-border-dark);
		--fg: var(--color-text);

		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		min-height: 5.5rem;
		padding: 0.75rem;
		font-size: 2rem;
		font-weight: 900;
		color: var(--fg);
		background: var(--bg);
		border: 2px solid var(--edge);
		border-radius: var(--radius-lg);
		box-shadow: 0 var(--press-depth) 0 var(--edge);
		cursor: pointer;
		touch-action: manipulation;
		transition:
			transform 80ms ease-out,
			box-shadow 80ms ease-out,
			opacity 200ms;
	}

	.choice.cyrillic {
		font-size: 2.5rem;
	}

	.choice:active:not(:disabled) {
		transform: translateY(var(--press-depth));
		box-shadow: 0 0 0 var(--edge);
	}

	.choice:disabled {
		cursor: default;
	}

	.key {
		position: absolute;
		top: 0.375rem;
		left: 0.625rem;
		font-size: 0.8125rem;
		font-weight: 800;
		color: var(--color-text-muted);
	}

	@media (pointer: coarse) {
		.key {
			display: none;
		}
	}

	.correct {
		--bg: var(--color-success-light);
		--edge: var(--color-success);
		--fg: var(--color-success-dark);
		animation: bounce 320ms ease-out;
	}

	.wrong {
		--bg: var(--color-error-light);
		--edge: var(--color-error);
		--fg: var(--color-error-dark);
	}

	.faded {
		opacity: 0.45;
	}

	@keyframes bounce {
		40% {
			transform: scale(1.06);
		}
	}
</style>
