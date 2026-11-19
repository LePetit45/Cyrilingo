<script lang="ts">
	import type { ApiErrorCode } from '#lib/api/client.js';
	import { m } from '#lib/i18n/index.js';
	import Button from '../Button.svelte';
	import TextField from '../TextField.svelte';

	// Modal form asking for a word list name, to create or rename a list. `onsubmit` resolves to
	// an error code when the API refused, shown as a sentence; the dialog closes on success.
	let {
		open = $bindable(false),
		title,
		submitLabel,
		initial = '',
		onsubmit
	}: {
		open?: boolean;
		title: string;
		submitLabel: string;
		initial?: string;
		onsubmit: (name: string) => Promise<ApiErrorCode | null>;
	} = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let name = $state('');
	let busy = $state(false);
	let error = $state<ApiErrorCode | null>(null);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			name = initial;
			error = null;
			dialog.showModal();
		}
		if (!open && dialog.open) dialog.close();
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		busy = true;
		error = await onsubmit(name);
		busy = false;
		if (!error) open = false;
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="name-dialog-title"
	onclose={() => (open = false)}
	onclick={(event) => {
		if (event.target === dialog) open = false;
	}}
>
	<form onsubmit={submit} aria-busy={busy}>
		<h2 id="name-dialog-title">{title}</h2>
		<TextField
			id="list-name"
			label={m.lists.name}
			hint={m.lists.nameHint}
			bind:value={name}
			maxlength={40}
			autocomplete="off"
			required
		/>
		<p class="error" role="alert">{error ? m.errors[error] : ''}</p>
		<div class="actions">
			<Button variant="secondary" wide onclick={() => (open = false)}>{m.common.cancel}</Button>
			<Button type="submit" wide disabled={busy || name.trim() === ''}>
				{busy ? m.auth.busy : submitLabel}
			</Button>
		</div>
	</form>
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

	dialog::backdrop {
		background: rgb(31 27 46 / 0.45);
	}

	form {
		display: grid;
		gap: 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.error {
		margin: 0;
		padding: 0.75rem 1rem;
		font-weight: 700;
		color: var(--color-error-dark);
		background: var(--color-error-light);
		border-radius: var(--radius-sm);
	}

	.error:empty {
		display: none;
	}

	.actions {
		display: grid;
		gap: 0.75rem;
	}
</style>
