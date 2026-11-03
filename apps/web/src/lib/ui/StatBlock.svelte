<script lang="ts">
	// A score block of the end screens (spec §6): a colored band with the label, above a white box
	// with the value.
	let {
		label,
		value,
		tone = 'success'
	}: { label: string; value: string | number; tone?: 'success' | 'accent' | 'error' } = $props();
</script>

<div class={['stat', tone]}>
	<span class="label">{label}</span>
	<span class="value">{value}</span>
</div>

<style>
	.stat {
		--tone: var(--color-success-dark);
		display: grid;
		flex: 1;
		overflow: hidden;
		text-align: center;
		background: var(--tone);
		border: 2px solid var(--tone);
		border-radius: var(--radius-md);
	}

	.accent {
		--tone: var(--color-accent-dark);
	}

	.error {
		--tone: var(--color-error-dark);
	}

	.label {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #fff;
	}

	.value {
		padding: 0.625rem 0;
		font-size: 1.5rem;
		font-weight: 900;
		color: var(--tone);
		background: var(--color-surface);
		border-radius: calc(var(--radius-md) - 2px);
	}
</style>
