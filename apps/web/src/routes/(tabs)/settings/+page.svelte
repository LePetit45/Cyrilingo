<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.js';
	import Button from '#lib/ui/Button.svelte';
	import { hasVoice } from '#lib/ui/audio/voice.js';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { account } from '#lib/ui/state/account.svelte.js';
	import { app } from '#lib/ui/state/app.svelte.js';
	import { AsyncState } from '#lib/ui/state/async.svelte.js';
	import { progressSync } from '#lib/ui/state/progress-sync.svelte.js';
	import Toggle from '#lib/ui/Toggle.svelte';

	// Settings (SPEC.md › Screens): the account (or an invitation to sign in), sound switches,
	// progress reset (with a confirmation) and the about page, as grouped lists of rows.
	let confirmingReset = $state(false);
	// Signed in, the reset goes to the account first, so it can fail (AC-25).
	const reset = new AsyncState();

	let confirmingDelete = $state(false);
	const accountAction = new AsyncState();
	/** The sentence shown once an account action succeeded. */
	let accountDone = $state('');

	async function signOut() {
		const result = await accountAction.run(() => account.signOut());
		if (result?.ok) accountDone = m.account.signedOut;
	}

	async function deleteAccount() {
		const result = await accountAction.run(() => account.deleteAccount());
		if (result?.ok) accountDone = m.account.deleted;
	}

	/** « Mot de passe · Google »: how the account can sign in, once the API described it. */
	const signInMethods = $derived.by(() => {
		const details = account.details;
		if (!details) return '';
		return [
			details.hasPassword && m.account.withPassword,
			details.providers.includes('google') && m.account.withGoogle
		]
			.filter(Boolean)
			.join(' · ');
	});

	// The account's agent key (SPEC.md › MCP tools). The API keeps only its hash, so the key can be
	// shown only right after « Régénérer », while this page stays open; it is never stored.
	const agentKey = new AsyncState();
	let agentToken = $state('');
	let agentTokenShown = $state(false);
	let confirmingRegenerate = $state(false);
	const hasAgentToken = $derived(account.details?.hasAgentToken ?? false);

	/** The line under the key: what can be done with it now. */
	const agentKeyStatus = $derived(
		agentToken
			? m.account.agentKeyFresh
			: hasAgentToken
				? m.account.agentKeyHidden
				: account.details
					? m.account.agentKeyNone
					: ''
	);

	async function regenerateAgentKey() {
		agentTokenShown = false;
		const result = await agentKey.run(() => account.regenerateAgentToken());
		if (result?.ok) agentToken = result.value.token;
	}

	function resetProgress() {
		void reset.run(() => progressSync.reset());
	}
</script>

<svelte:head>
	<title>{m.settings.title} · {m.app.name}</title>
</svelte:head>

<h1>{m.settings.title}</h1>

<section aria-labelledby="account-section" aria-busy={accountAction.loading}>
	<h2 id="account-section">{m.account.section}</h2>
	{#if account.signedIn}
		<div class="group">
			<div class="row static">
				<span class="label">{m.account.email}</span>
				<span class="value">{account.email}</span>
			</div>
			{#if signInMethods}
				<div class="row static">
					<span class="label">{m.account.signInWith}</span>
					<span class="value">{signInMethods}</span>
				</div>
			{/if}
			<a class="row" href={resolve('/(tabs)/settings/password')}>
				{account.details?.hasPassword === false ? m.account.setPassword : m.account.changePassword}
				<Icon name="forward" size={22} />
			</a>
			<div class="agent-key" aria-busy={agentKey.loading}>
				<label class="label" for="agent-key">{m.account.agentKey}</label>
				<p class="hint">{m.account.agentKeyIntro}</p>
				<div class="key-row">
					<input
						id="agent-key"
						type={agentTokenShown ? 'text' : 'password'}
						readonly
						autocomplete="off"
						value={agentToken}
						placeholder={hasAgentToken ? '••••••••••••••••' : ''}
						aria-describedby="agent-key-status"
						onfocus={(event) => event.currentTarget.select()}
					/>
					<button
						type="button"
						class="key-button"
						disabled={!agentToken}
						aria-pressed={agentTokenShown}
						onclick={() => (agentTokenShown = !agentTokenShown)}
					>
						{agentTokenShown ? m.account.hide : m.account.show}
					</button>
					<button
						type="button"
						class="key-button"
						disabled={agentKey.loading}
						onclick={() => (hasAgentToken ? (confirmingRegenerate = true) : regenerateAgentKey())}
					>
						{agentKey.loading ? m.auth.busy : m.account.regenerate}
					</button>
				</div>
				<p id="agent-key-status" class="hint" class:fresh={agentToken}>{agentKeyStatus}</p>
				<p class="error" role="alert">{agentKey.error ? m.errors[agentKey.error] : ''}</p>
			</div>
			<button type="button" class="row" disabled={accountAction.loading} onclick={signOut}>
				{accountAction.loading ? m.auth.busy : m.account.signOut}
			</button>
			<button
				type="button"
				class="row danger"
				disabled={accountAction.loading}
				onclick={() => (confirmingDelete = true)}
			>
				{m.account.deleteAccount}
			</button>
		</div>
	{:else}
		<div class="group invite">
			<p>{m.account.guestInvite}</p>
			<div class="actions">
				<Button href={resolve('/(tabs)/signin')} wide>{m.account.signIn}</Button>
				<Button href={resolve('/(tabs)/signup')} variant="secondary" wide>
					{m.account.signUp}
				</Button>
			</div>
		</div>
	{/if}
	<p class="error" role="alert">{accountAction.error ? m.errors[accountAction.error] : ''}</p>
	<p class="status" role="status">{accountAction.status === 'success' ? accountDone : ''}</p>
</section>

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

<section aria-labelledby="progress-section" aria-busy={reset.loading}>
	<h2 id="progress-section">{m.settings.progressSection}</h2>
	<div class="group">
		<button
			type="button"
			class="row danger"
			disabled={reset.loading}
			onclick={() => (confirmingReset = true)}
		>
			{reset.loading ? m.auth.busy : m.settings.reset}
		</button>
	</div>
	<p class="error" role="alert">{reset.error ? m.errors[reset.error] : ''}</p>
	<p class="status" role="status">{reset.status === 'success' ? m.settings.resetDone : ''}</p>
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
	bind:open={confirmingDelete}
	title={m.account.deleteTitle}
	message={m.account.deleteMessage}
	confirmLabel={m.account.deleteConfirm}
	danger
	onconfirm={deleteAccount}
/>

<ConfirmDialog
	bind:open={confirmingRegenerate}
	title={m.account.regenerateTitle}
	message={m.account.regenerateMessage}
	confirmLabel={m.account.regenerateConfirm}
	onconfirm={regenerateAgentKey}
/>

<ConfirmDialog
	bind:open={confirmingReset}
	title={m.settings.resetTitle}
	message={account.signedIn ? m.settings.resetMessageSignedIn : m.settings.resetMessage}
	confirmLabel={m.settings.resetConfirm}
	danger
	onconfirm={resetProgress}
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

	.row:hover:not(.static, :disabled) {
		background: var(--color-surface-muted);
	}

	.row:disabled {
		color: var(--color-text-faint);
		cursor: wait;
	}

	/* Rows following each other in a group are separated, like the switches. */
	.group > .row + .row {
		border-top: 2px solid var(--color-border);
	}

	.static {
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 0.125rem;
		cursor: default;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	/* A long e-mail wraps instead of widening the page. */
	.value {
		max-width: 100%;
		overflow-wrap: anywhere;
	}

	/* The agent key: its label, the field and its two buttons, then what can be done with it. */
	.agent-key {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.5rem;
		padding: 0.75rem 1.25rem 1rem;
	}

	.agent-key p {
		margin: 0;
	}

	.hint {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.hint.fresh {
		font-weight: 700;
		color: var(--color-accent-dark);
	}

	.hint:empty {
		display: none;
	}

	.key-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	/* The key is long and has no spaces: it scrolls inside its field instead of widening the page. */
	.key-row input {
		flex: 1 1 100%;
		width: 100%;
		min-width: 0;
		min-height: 3rem;
		padding: 0.5rem 0.875rem;
		font-family: var(--font-mono);
		font-size: 1rem;
		color: var(--color-text);
		background: var(--color-surface-muted);
		border: 2px solid var(--color-border-dark);
		border-radius: var(--radius-md);
	}

	.key-row input::placeholder {
		color: var(--color-text-muted);
	}

	.key-row input:focus {
		border-color: var(--color-accent);
		background: var(--color-surface);
	}

	/* Small buttons, like the rows: the key is a detail of the account, not an action of the page. */
	.key-button {
		flex: 1;
		min-height: 3rem;
		padding: 0 0.875rem;
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 800;
		color: var(--color-accent-dark);
		background: var(--color-surface);
		border: 2px solid var(--color-border-dark);
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.key-button:hover:not(:disabled) {
		background: var(--color-surface-muted);
	}

	.key-button:disabled {
		color: var(--color-text-faint);
		cursor: not-allowed;
	}

	.invite {
		gap: 1rem;
		padding: 1.25rem;
	}

	.invite > :global(* + *) {
		border-top: none;
	}

	.invite p {
		margin: 0;
		font-weight: 700;
	}

	.actions {
		display: grid;
		gap: 0.75rem;
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
