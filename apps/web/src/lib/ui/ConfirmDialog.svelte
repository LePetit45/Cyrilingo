<script lang="ts">
	import { m } from '#lib/i18n/index.js';
	import Button from './Button.svelte';

	// Modal confirmation, built on <dialog> for focus trapping and Escape to cancel.
	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel,
		cancelLabel = m.common.cancel,
		danger = false,
		onconfirm
	}: {
		open?: boolean;
		title: string;
		message: string;
		confirmLabel: string;
		cancelLabel?: string;
		danger?: boolean;
		onconfirm: () => void;
	} = $props();

	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="confirm-title"
	aria-describedby="confirm-message"
	onclose={() => (open = false)}
	onclick={(event) => {
		// A click on the backdrop cancels.
		if (event.target === dialog) open = false;
	}}
>
	<h2 id="confirm-title">{title}</h2>
	<p id="confirm-message">{message}</p>
	<div class="actions">
		<Button variant="secondary" wide onclick={() => (open = false)}>{cancelLabel}</Button>
		<Button
			variant={danger ? 'danger' : 'primary'}
			wide
			onclick={() => {
				open = false;
				onconfirm();
			}}>{confirmLabel}</Button
		>
	</div>
</dialog>

<style>
	dialog {
		width: min(calc(100% - 2rem), 400px);
		padding: 1.5rem;
		color: var(--color-text);
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 6px 0 var(--color-border-dark);
	}

	dialog[open] {
		animation: pop 160ms ease-out;
	}

	dialog::backdrop {
		background: rgb(31 27 46 / 0.45);
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
	}

	p {
		margin: 0 0 1.5rem;
		color: var(--color-text-muted);
	}

	.actions {
		display: grid;
		gap: 0.75rem;
	}

	@keyframes pop {
		from {
			transform: scale(0.92);
			opacity: 0;
		}
	}
</style>
