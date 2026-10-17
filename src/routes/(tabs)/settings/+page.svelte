<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.js';
	import { hasVoice } from '#lib/ui/audio/voice.js';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { app } from '#lib/ui/state/app.svelte.js';
	import Toggle from '#lib/ui/Toggle.svelte';

	// Settings (spec §7.1): sound switches, progress reset (with a confirmation) and the about page,
	// as grouped lists of rows.
	let confirmingReset = $state(false);
	let resetDone = $state(false);
</script>

<svelte:head>
	<title>{m.settings.title} · {m.app.name}</title>
</svelte:head>

<h1>{m.settings.title}</h1>

<section aria-labelledby="sound-section">
	<h2 id="sound-section">{m.settings.soundSection}</h2>
	<div class="group">
		{#if hasVoice}
			<Toggle
				label={m.settings.sound}
				hint={m.settings.soundHint}
				checked={app.settings.sound}
				onchange={(sound) => app.updateSettings({ sound })}
			/>
		{/if}
		<Toggle
			label={m.settings.soundEffects}
			hint={m.settings.soundEffectsHint}
			checked={app.settings.soundEffects}
			onchange={(soundEffects) => app.updateSettings({ soundEffects })}
		/>
	</div>
</section>

<section aria-labelledby="progress-section">
	<h2 id="progress-section">{m.settings.progressSection}</h2>
	<div class="group">
		<button type="button" class="row danger" onclick={() => (confirmingReset = true)}>
			{m.settings.reset}
		</button>
	</div>
	<p class="status" role="status">{resetDone ? m.settings.resetDone : ''}</p>
</section>

<section aria-labelledby="app-section">
	<h2 id="app-section">{m.settings.appSection}</h2>
	<div class="group">
		<a class="row" href={resolve('/(tabs)/about')}>
			{m.settings.about}
			<Icon name="forward" size={22} />
		</a>
	</div>
</section>

<ConfirmDialog
	bind:open={confirmingReset}
	title={m.settings.resetTitle}
	message={m.settings.resetMessage}
	confirmLabel={m.settings.resetConfirm}
	danger
	onconfirm={() => {
		app.resetProgress();
		resetDone = true;
	}}
/>

<style>
	h1 {
		margin: 0 0 1.5rem;
		font-size: 2rem;
	}

	section {
		display: grid;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	h2 {
		margin: 0 0 0 0.25rem;
		font-size: 0.875rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	/* Rows framed together, with a separator between them. */
	.group {
		display: grid;
		overflow: hidden;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.group > :global(* + *) {
		border-top: 2px solid var(--color-border);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 3.5rem;
		padding: 0.75rem 1.25rem;
		font: inherit;
		font-weight: 800;
		text-align: left;
		text-decoration: none;
		color: var(--color-text);
		background: none;
		border: none;
		cursor: pointer;
	}

	.row :global(svg) {
		flex: none;
		color: var(--color-text-faint);
	}

	.row:hover {
		background: var(--color-surface-muted);
	}

	.danger {
		color: var(--color-error-dark);
	}

	.status {
		min-height: 1.5em;
		margin: 0;
		text-align: center;
		font-weight: 700;
		color: var(--color-success-dark);
	}

	.status:empty {
		display: none;
	}
</style>
