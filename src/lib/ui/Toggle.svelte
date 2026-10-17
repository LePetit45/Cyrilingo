<script lang="ts">
	// On/off switch with a label and a hint, for the settings screen.
	let {
		checked = $bindable(false),
		label,
		hint,
		onchange
	}: {
		checked?: boolean;
		label: string;
		hint?: string;
		onchange?: (checked: boolean) => void;
	} = $props();
</script>

<label class="toggle">
	<span class="text">
		<span class="label">{label}</span>
		{#if hint}<span class="hint">{hint}</span>{/if}
	</span>
	<input
		type="checkbox"
		role="switch"
		bind:checked
		onchange={(event) => onchange?.(event.currentTarget.checked)}
	/>
</label>

<style>
	.toggle {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.text {
		display: grid;
		flex: 1;
	}

	.label {
		font-weight: 800;
	}

	.hint {
		font-size: 0.9375rem;
		color: var(--color-text-muted);
	}

	input {
		position: relative;
		flex: none;
		width: 3.5rem;
		height: 2rem;
		margin: 0;
		appearance: none;
		background: var(--color-border-dark);
		border-radius: 1rem;
		cursor: pointer;
		transition: background 150ms;
	}

	input::after {
		content: '';
		position: absolute;
		top: 0.25rem;
		left: 0.25rem;
		width: 1.5rem;
		height: 1.5rem;
		background: #fff;
		border-radius: 50%;
		box-shadow: 0 2px 0 rgb(0 0 0 / 0.15);
		transition: transform 150ms;
	}

	input:checked {
		background: var(--color-success);
	}

	input:checked::after {
		transform: translateX(1.5rem);
	}
</style>
