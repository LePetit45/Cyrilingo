<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.js';
	import { hasVoice } from '#lib/ui/audio/voice.js';
	import Button from '#lib/ui/Button.svelte';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import { app } from '#lib/ui/state/app.svelte.js';
	import Toggle from '#lib/ui/Toggle.svelte';

	let confirmingReset = $state(false);
	let resetDone = $state(false);
</script>

<h1>{m.settings.title}</h1>

<div class="settings">
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

	<Button variant="secondary" wide onclick={() => (confirmingReset = true)}>
		{m.settings.reset}
	</Button>
	<p class="status" role="status">{resetDone ? m.settings.resetDone : ''}</p>

	<a class="about" href={resolve('/(tabs)/about')}>{m.settings.about}</a>
</div>

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

	.settings {
		display: grid;
		gap: 1rem;
	}

	.status {
		min-height: 1.5em;
		margin: 0;
		text-align: center;
		font-weight: 700;
		color: var(--color-success-dark);
	}

	.about {
		justify-self: center;
	}
</style>
