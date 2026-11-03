<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	// A labeled text field of a form, with an optional hint under it.
	let {
		label,
		hint,
		value = $bindable(''),
		id,
		...rest
	}: HTMLInputAttributes & { label: string; hint?: string; id: string } = $props();
</script>

<div class="field">
	<label for={id}>{label}</label>
	<input {id} bind:value aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
	{#if hint}
		<p id="{id}-hint" class="hint">{hint}</p>
	{/if}
</div>

<style>
	.field {
		display: grid;
		gap: 0.375rem;
	}

	label {
		font-weight: 800;
	}

	input {
		width: 100%;
		min-height: 3.25rem;
		padding: 0.5rem 1rem;
		font: inherit;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text);
		background: var(--color-surface-muted);
		border: 2px solid var(--color-border-dark);
		border-radius: var(--radius-md);
	}

	input:focus {
		border-color: var(--color-accent);
		background: var(--color-surface);
	}

	.hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
