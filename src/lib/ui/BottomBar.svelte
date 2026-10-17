<script lang="ts">
	import type { Snippet } from 'svelte';

	// Bar fixed to the bottom of the screen, across the whole width, for the main actions of the
	// play screens (spec §8): a white bar with a top border, or the green / red answer feedback.
	// The same height is kept free in the page, so nothing hides behind it.
	//
	// In `actions` mode, children are laid out as a row of buttons: give the main one the `grow`
	// class (it takes the free width on phones, a fixed width on the right on desktop) and a
	// secondary one the `side` class (smaller text, which keeps it on one line).
	let {
		tone,
		actions = false,
		children
	}: { tone?: 'correct' | 'wrong'; actions?: boolean; children: Snippet } = $props();

	let height = $state(0);
</script>

<div class="space" style:height="{height}px"></div>

<div class={['bar', tone]} bind:offsetHeight={height}>
	<div class={['inner', { actions }]}>
		{@render children()}
	</div>
</div>

<style>
	.space {
		flex: none;
	}

	.bar {
		--footer-width: var(--column-width);
		position: fixed;
		inset: auto 0 0;
		z-index: 5;
		padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
		background: var(--color-bg);
		border-top: 2px solid var(--color-border);
	}

	.correct,
	.wrong {
		background: var(--color-success-light);
		border-top-color: transparent;
		animation: slide-up 220ms cubic-bezier(0.2, 1.2, 0.5, 1);
	}

	.wrong {
		background: var(--color-error-light);
	}

	.inner {
		max-width: var(--footer-width);
		margin: 0 auto;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
	}

	.actions :global(.grow) {
		flex: 1;
	}

	/* Dark text on white reads fine smaller. Alone, it takes the whole width on phones. */
	.actions :global(.side) {
		flex: 1;
		padding-inline: 1rem;
		font-size: 1rem;
		white-space: nowrap;
	}

	.actions :global(.side:not(:only-child)) {
		flex: none;
	}

	@media (min-width: 900px) {
		.bar {
			--footer-width: 60rem;
			padding-top: 1.5rem;
			padding-bottom: 1.5rem;
		}

		.actions {
			justify-content: space-between;
		}

		.actions :global(.grow) {
			flex: 0 0 12rem;
			margin-left: auto;
		}

		.actions :global(.side) {
			flex: none;
		}
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
	}
</style>
