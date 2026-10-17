<script lang="ts">
	import { m } from '#lib/i18n/index.js';
	import Button from '../Button.svelte';
	import OnScreenKeyboard from './OnScreenKeyboard.svelte';

	// Answer input of a reading question (spec §5.4): the in-app AZERTY keyboard on touch devices
	// (the native one never opens), a plain text field typed with the physical keyboard elsewhere.
	let {
		value = $bindable(''),
		disabled,
		onsubmit
	}: { value?: string; disabled: boolean; onsubmit: () => void } = $props();

	const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
	const canSubmit = $derived(value.trim() !== '');

	let input: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (!touch && !disabled) input?.focus();
	});

	function submit() {
		if (canSubmit && !disabled) onsubmit();
	}
</script>

{#if touch}
	<div class="display" class:disabled aria-live="polite">
		<span class="visually-hidden">{m.question.answerLabel}</span>
		{#if value}
			<span class="typed">{value}</span>
		{:else}
			<span class="placeholder">{m.question.answerPlaceholder}</span>
		{/if}
		{#if !disabled}<span class="caret" aria-hidden="true"></span>{/if}
	</div>
	<!-- Once answered, the keyboard makes room for the feedback. -->
	{#if !disabled}
		<OnScreenKeyboard
			{canSubmit}
			onkey={(key) => (value += key)}
			onbackspace={() => (value = value.slice(0, -1))}
			onsubmit={submit}
		/>
	{/if}
{:else}
	<form
		class="desktop"
		onsubmit={(event) => {
			event.preventDefault();
			submit();
		}}
	>
		<label class="visually-hidden" for="reading-answer">{m.question.answerLabel}</label>
		<input
			id="reading-answer"
			bind:this={input}
			bind:value
			{disabled}
			type="text"
			lang="fr"
			placeholder={m.question.answerPlaceholder}
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
			onkeydown={(event) => {
				// Enter validates here; keep it from also reaching the "continue" shortcut.
				if (event.key === 'Enter') {
					event.preventDefault();
					submit();
				}
			}}
		/>
		<Button type="submit" variant="success" wide disabled={disabled || !canSubmit}>
			{m.question.validate}
		</Button>
	</form>
{/if}

<style>
	.display {
		display: flex;
		align-items: center;
		min-height: 3.5rem;
		padding: 0.5rem 1rem;
		font-size: 1.5rem;
		font-weight: 800;
		background: var(--color-surface);
		border: 2px solid var(--color-border-dark);
		border-radius: var(--radius-md);
	}

	.display.disabled {
		background: var(--color-surface-muted);
	}

	.placeholder {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.caret {
		width: 2px;
		height: 1.6rem;
		margin-left: 2px;
		background: var(--color-accent);
		animation: blink 1s steps(1) infinite;
	}

	.desktop {
		display: grid;
		gap: 1rem;
	}

	input {
		width: 100%;
		min-height: 3.5rem;
		padding: 0.5rem 1rem;
		font: inherit;
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--color-text);
		background: var(--color-surface);
		border: 2px solid var(--color-border-dark);
		border-radius: var(--radius-md);
	}

	input::placeholder {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	input:disabled {
		background: var(--color-surface-muted);
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
