<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	// Big rounded button with a "pressed" effect (spec §8). Renders a link when `href` is set.
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
		font-size: 1.125rem;
		font-weight: 800;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		text-decoration: none;
		text-align: center;
		color: var(--fg);
		background: var(--bg);
		border: 2px solid var(--edge);
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

	.button:hover:not(:disabled) {
		filter: brightness(1.05);
	}

	.button:active:not(:disabled) {
		transform: translateY(var(--press-depth));
		box-shadow: 0 0 0 var(--edge);
	}

	.button:disabled {
		--bg: var(--color-surface-muted);
		--edge: var(--color-border-dark);
		--fg: var(--color-text-muted);
		cursor: not-allowed;
	}

	.wide {
		width: 100%;
	}

	.secondary {
		--bg: var(--color-surface);
		--edge: var(--color-border-dark);
		--fg: var(--color-accent-dark);
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
