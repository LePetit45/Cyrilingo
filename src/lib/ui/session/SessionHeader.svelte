<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.js';
	import ConfirmDialog from '../ConfirmDialog.svelte';
	import Icon from '../Icon.svelte';
	import ProgressBar from '../ProgressBar.svelte';

	// ✕ button with a confirmation, since leaving discards the session (spec §4.5, §7.2), and the
	// progress bar.
	let {
		progress,
		quitTitle = m.session.quitTitle,
		quitMessage = m.session.quitMessage
	}: { progress?: number; quitTitle?: string; quitMessage?: string } = $props();

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
</style>
