<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.js';
	import ConfirmDialog from '../ConfirmDialog.svelte';
	import Icon from '../Icon.svelte';
	import ProgressBar from '../ProgressBar.svelte';

	// ✕ button with a confirmation, since leaving discards the session (spec §4.5, §7.2), and the
	// progress bar or a short label (« Lettre 1 sur 3 »).
	let {
		progress,
		label,
		quitTitle = m.session.quitTitle,
		quitMessage = m.session.quitMessage
	}: { progress?: number; label?: string; quitTitle?: string; quitMessage?: string } = $props();

	let confirming = $state(false);
</script>

<header>
	<button
		type="button"
		class="quit"
		aria-label={m.session.quit}
		onclick={() => (confirming = true)}
	>
		<Icon name="close" size={28} />
	</button>
	{#if progress !== undefined}
		<ProgressBar value={progress} />
	{:else if label}
		<p class="label">{label}</p>
	{/if}
</header>

<ConfirmDialog
	bind:open={confirming}
	title={quitTitle}
	message={quitMessage}
	confirmLabel={m.session.quitConfirm}
	cancelLabel={m.session.quitCancel}
	danger
	onconfirm={() => goto(resolve('/(tabs)'))}
/>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 3rem;
	}

	.quit {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		color: var(--color-text-muted);
		background: none;
		border: none;
		border-radius: 50%;
		cursor: pointer;
	}

	.quit:hover {
		background: var(--color-surface-muted);
	}

	/* Centered on the screen: the ✕ button on the left is balanced by the same space on the right. */
	.label {
		flex: 1;
		margin: 0 3.5rem 0 0;
		font-weight: 800;
		text-align: center;
		color: var(--color-text-muted);
	}
</style>
