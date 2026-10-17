<script lang="ts" module>
	/** Rows of a keyboard layout. A Cyrillic layout can be added for dictation later (spec §5.4). */
	export const AZERTY: readonly string[] = ['azertyuiop', 'qsdfghjklm', 'wxcvbn'];
</script>

<script lang="ts">
	import { m } from '#lib/i18n/index.js';
	import Icon from '../Icon.svelte';

	// In-app keyboard for touch devices (spec §5.4): no autocorrect, no layout jump.
	let {
		layout = AZERTY,
		disabled = false,
		canSubmit,
		onkey,
		onbackspace,
		onsubmit
	}: {
		layout?: readonly string[];
		disabled?: boolean;
		canSubmit: boolean;
		onkey: (key: string) => void;
		onbackspace: () => void;
		onsubmit: () => void;
	} = $props();
</script>

<div class="keyboard" role="group" aria-label={m.keyboard.label}>
	{#each layout as row, rowIndex (row)}
		<div class="row">
			{#each row as key (key)}
				<button type="button" class="key" {disabled} onclick={() => onkey(key)}>{key}</button>
			{/each}
			{#if rowIndex === layout.length - 1}
				<button
					type="button"
					class="key wide"
					{disabled}
					onclick={onbackspace}
					aria-label={m.keyboard.backspace}
				>
					<Icon name="backspace" size={22} />
				</button>
			{/if}
		</div>
	{/each}
	<button type="button" class="submit" disabled={disabled || !canSubmit} onclick={onsubmit}>
		{m.keyboard.validate}
	</button>
</div>

<style>
	.keyboard {
		display: grid;
		gap: 0.4rem;
		padding: 0.5rem 0.25rem 0;
		user-select: none;
	}

	.row {
		display: flex;
		justify-content: center;
		gap: 0.3rem;
	}

	.key {
		display: grid;
		place-items: center;
		flex: 0 1 2.5rem;
		min-width: 0;
		height: 3rem;
		padding: 0;
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--color-text);
		background: var(--color-surface);
		border: 1.5px solid var(--color-border-dark);
		border-radius: var(--radius-sm);
		box-shadow: 0 3px 0 var(--color-border-dark);
		touch-action: manipulation;
		cursor: pointer;
	}

	.key:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow: none;
		background: var(--color-surface-muted);
	}

	.key.wide {
		flex-basis: 4rem;
	}

	.submit {
		height: 3.25rem;
		margin-top: 0.25rem;
		font-size: 1.125rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		color: #fff;
		background: var(--color-success);
		border: 2px solid var(--color-success-dark);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--color-success-dark);
		touch-action: manipulation;
		cursor: pointer;
	}

	.submit:disabled {
		color: var(--color-text-muted);
		background: var(--color-surface-muted);
		border-color: var(--color-border-dark);
		box-shadow: 0 4px 0 var(--color-border-dark);
		cursor: not-allowed;
	}

	.submit:active:not(:disabled) {
		transform: translateY(4px);
		box-shadow: none;
	}
</style>
