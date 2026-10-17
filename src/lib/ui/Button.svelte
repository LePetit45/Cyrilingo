<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	// Chunky rounded button with a darker bottom edge that flattens when pressed (spec §8). Renders a link when `href` is set.
	type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'accent' | 'ghost';

	let {
		variant = 'primary',
		href,
		wide = false,
		children,
		class: className,
		...rest
	}: HTMLButtonAttributes & {
		variant?: Variant;
		href?: string;
		wide?: boolean;
		children: Snippet;
	} = $props();
</script>

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass a resolved href -->
	<a {href} class={['button', variant, { wide }, className]}>{@render children()}</a>
{:else}
	<button type="button" class={['button', variant, { wide }, className]} {...rest}>
		{@render children()}
	</button>
{/if}

<style>
	.button {
		--bg: var(--color-primary);
		--edge: var(--color-primary-dark);
		--fg: #fff;

		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 3.25rem;
		padding: 0.75rem 1.5rem;
		/* 19px bold counts as large text for contrast (WCAG: 14pt bold). */
		font-size: 1.1875rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		line-height: 1.2;
		text-transform: uppercase;
		text-decoration: none;
		text-align: center;
		color: var(--fg);
		background: var(--bg);
		border: 2px solid var(--bg);
		border-radius: var(--radius-md);
		box-shadow: 0 var(--press-depth) 0 var(--edge);
		cursor: pointer;
		user-select: none;
		touch-action: manipulation;
		transition:
			transform 80ms ease-out,
			box-shadow 80ms ease-out,
			filter 120ms;
	}

	/* Hover styles only for real pointers: on touch screens they would stick after a tap. */
	@media (hover: hover) {
		.button:hover:not(:disabled) {
			filter: brightness(1.06);
		}

		.secondary:hover:not(:disabled),
		.ghost:hover:not(:disabled) {
			filter: none;
			background: var(--color-surface-muted);
		}
	}

	.button:active:not(:disabled) {
		transform: translateY(var(--press-depth));
		box-shadow: 0 0 0 var(--edge);
	}

	.button:disabled {
		--bg: var(--color-border);
		--fg: var(--color-text-faint);
		box-shadow: none;
		cursor: not-allowed;
	}

	.wide {
		width: 100%;
	}

	/* Outlined: white with a gray border and edge. */
	.secondary {
		--bg: var(--color-surface);
		--edge: var(--color-border);
		--fg: var(--color-accent-dark);
		border-color: var(--color-border);
	}

	.success {
		--bg: var(--color-success);
		--edge: var(--color-success-dark);
	}

	.danger {
		--bg: var(--color-error);
		--edge: var(--color-error-dark);
	}

	.accent {
		--bg: var(--color-accent);
		--edge: var(--color-accent-dark);
	}

	.ghost {
		--bg: transparent;
		--edge: transparent;
		--fg: var(--color-text-muted);
		box-shadow: none;
	}

	.ghost:active:not(:disabled) {
		transform: none;
	}
</style>
