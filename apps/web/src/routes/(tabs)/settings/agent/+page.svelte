<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.js';
	import Button from '#lib/ui/Button.svelte';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { account } from '#lib/ui/state/account.svelte.js';
	import { AsyncState } from '#lib/ui/state/async.svelte.js';

	// Agent tokens for the MCP server (SPEC.md › MCP tools): create one, shown once on this page,
	// or revoke them all. The token lives in this component only, never in storage.
	const create = new AsyncState();
	const revoke = new AsyncState();
	let token = $state('');
	let copied = $state(false);
	let confirmingRevoke = $state(false);

	$effect(() => {
		if (!account.signedIn) void goto(resolve('/(tabs)/settings'));
	});

	async function createToken() {
		token = '';
		copied = false;
		revoke.reset();
		const result = await create.run(() => account.createAgentToken());
		if (result?.ok) token = result.value.token;
	}

	async function copyToken() {
		try {
			await navigator.clipboard.writeText(token);
			copied = true;
		} catch {
			// No clipboard (insecure context, refused): the field stays selectable by hand.
			copied = false;
		}
	}

	async function revokeTokens() {
		create.reset();
		const result = await revoke.run(() => account.revokeAgentTokens());
		if (result?.ok) token = '';
	}
</script>

<svelte:head>
	<title>{m.agent.title} · {m.app.name}</title>
</svelte:head>

<header>
	<a class="back" href={resolve('/(tabs)/settings')} aria-label={m.agent.back}>
		<Icon name="back" size={28} />
	</a>
	<h1>{m.agent.title}</h1>
</header>

<section class="create" aria-busy={create.loading}>
	<p>{m.agent.intro}</p>
	<Button wide disabled={create.loading} onclick={createToken}>
		{create.loading ? m.auth.busy : m.agent.create}
	</Button>
	<p class="error" role="alert">{create.error ? m.errors[create.error] : ''}</p>

	{#if token}
		<div class="token">
			<label for="agent-token">{m.agent.tokenLabel}</label>
			<div class="copy-row">
				<input
					id="agent-token"
					readonly
					value={token}
					aria-describedby="agent-token-hint"
					onfocus={(event) => event.currentTarget.select()}
				/>
				<Button variant="secondary" onclick={copyToken}>{m.agent.copy}</Button>
			</div>
			<p id="agent-token-hint" class="hint">{m.agent.shownOnce}</p>
		</div>
	{/if}
	<p class="status" role="status">{copied ? m.agent.copied : ''}</p>
</section>

<section aria-labelledby="revoke-section" aria-busy={revoke.loading}>
	<h2 id="revoke-section">{m.agent.revokeSection}</h2>
	<p>{m.agent.revokeHint}</p>
	<Button variant="danger" wide disabled={revoke.loading} onclick={() => (confirmingRevoke = true)}>
		{revoke.loading ? m.auth.busy : m.agent.revoke}
	</Button>
	<p class="error" role="alert">{revoke.error ? m.errors[revoke.error] : ''}</p>
	<p class="status" role="status">{revoke.status === 'success' ? m.agent.revoked : ''}</p>
</section>

<ConfirmDialog
	bind:open={confirmingRevoke}
	title={m.agent.revokeTitle}
	message={m.agent.revokeMessage}
	confirmLabel={m.agent.revokeConfirm}
	danger
	onconfirm={revokeTokens}
/>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin: 0 0 1.5rem -0.75rem;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.back {
		display: grid;
		flex: none;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		color: var(--color-text-muted);
		border-radius: 50%;
	}

	.back:hover {
		background: var(--color-surface-muted);
	}

	/* One column no wider than the page: the long token must not widen it (AC-61). */
	section {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}

	p {
		margin: 0;
	}

	.token {
		display: grid;
		gap: 0.5rem;
		padding: 1.25rem;
		background: var(--color-accent-light);
		border: 2px solid var(--color-accent-border);
		border-radius: var(--radius-md);
	}

	label {
		font-weight: 800;
	}

	.copy-row {
		display: flex;
		gap: 0.75rem;
	}

	/* The token is long and has no spaces: the field scrolls inside instead of widening the page. */
	input {
		flex: 1;
		width: 100%;
		min-width: 0;
		min-height: 3.25rem;
		padding: 0.5rem 1rem;
		font-family: var(--font-mono);
		font-size: 1rem;
		color: var(--color-text);
		background: var(--color-surface);
		border: 2px solid var(--color-border-dark);
		border-radius: var(--radius-md);
	}

	input:focus {
		border-color: var(--color-accent);
	}

	.hint {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-accent-dark);
	}

	.error,
	.status {
		padding: 0.75rem 1rem;
		font-weight: 700;
		border-radius: var(--radius-sm);
	}

	.error {
		color: var(--color-error-dark);
		background: var(--color-error-light);
	}

	.status {
		color: var(--color-success-dark);
		background: var(--color-success-light);
	}

	.error:empty,
	.status:empty {
		display: none;
	}
</style>
