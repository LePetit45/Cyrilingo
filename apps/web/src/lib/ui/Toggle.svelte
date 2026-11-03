<script lang="ts">
	// On/off switch with a label and a hint: a row of the settings screen's framed groups.
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
		padding: 0.875rem 1.25rem;
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

	/* Chunky switch: a track with a darker inner edge and a knob with a lip, like the buttons. */
	input {
		position: relative;
		flex: none;
		width: 3.5rem;
		height: 2rem;
		margin: 0;
		appearance: none;
		background: var(--color-border);
		border: 2px solid var(--color-border-dark);
		border-radius: 1rem;
		cursor: pointer;
		transition:
			background 150ms,
			border-color 150ms;
	}

	input::after {
		content: '';
		position: absolute;
		top: 0.0625rem;
		left: 0.0625rem;
		width: 1.5rem;
		height: 1.5rem;
		background: #fff;
		border-radius: 50%;
		box-shadow: 0 2px 0 var(--color-border-dark);
		transition: transform 150ms;
	}

	input:checked {
		background: var(--color-success);
		border-color: var(--color-success-dark);
	}

	input:checked::after {
		box-shadow: 0 2px 0 var(--color-success-dark);
		transform: translateX(1.625rem);
	}

	input:focus-visible {
		outline-offset: 2px;
	}
</style>
