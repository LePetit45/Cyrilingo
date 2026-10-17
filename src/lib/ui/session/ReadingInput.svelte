<script lang="ts">
	import { m } from '#lib/i18n/index.js';
	import { isShortcutBlocked } from '../keyboard.js';
	import OnScreenKeyboard from './OnScreenKeyboard.svelte';

	// Answer input of a reading question (spec §5.4): the in-app AZERTY keyboard on touch devices
	// (the native one never opens), a plain text field typed with the physical keyboard elsewhere.
	// Enter submits; the session's « Vérifier » button does too.
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

	// A hardware keyboard on a touch device (tablet keyboard, touchscreen laptop) types too.
	function onkeydown(event: KeyboardEvent) {
		if (!touch || disabled || isShortcutBlocked(event)) return;
		if (/^[a-z]$/i.test(event.key)) value += event.key.toLowerCase();
		else if (event.key === 'Backspace') value = value.slice(0, -1);
		else if (event.key === 'Enter') submit();
		else return;
		event.preventDefault();
	}
</script>

<svelte:window {onkeydown} />

{#if touch}
	<div class="display" class:disabled aria-live="polite">
		<span class="visually-hidden">{m.question.answerLabel}</span>
		{#if value}
			<span class="typed">{value}</span>
			{#if !disabled}<span class="caret" aria-hidden="true"></span>{/if}
		{:else}
			<!-- Empty: the caret sits at the start, where typing begins, before the placeholder. -->
			{#if !disabled}<span class="caret empty" aria-hidden="true"></span>{/if}
			<span class="placeholder">{m.question.answerPlaceholder}</span>
		{/if}
	</div>
	<!-- Once answered, the keyboard makes room for the feedback. -->
	{#if !disabled}
		<OnScreenKeyboard
			onkey={(key) => (value += key)}
			onbackspace={() => (value = value.slice(0, -1))}
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
		flex: none;
		background: var(--color-accent);
		animation: blink 1s steps(1) infinite;
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

	.caret.empty {
		margin: 0 2px 0 0;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
