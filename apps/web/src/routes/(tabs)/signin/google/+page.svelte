<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { GOOGLE_SIGN_IN_URL, type GoogleErrorCode } from '#lib/api/client.js';
	import { m } from '#lib/i18n/index.js';
	import Button from '#lib/ui/Button.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { account } from '#lib/ui/state/account.svelte.js';
	import { app } from '#lib/ui/state/app.svelte.js';
	import { AsyncState } from '#lib/ui/state/async.svelte.js';

	// Where the API sends the learner back after Google (SPEC.md › Google sign-in): with
	// `?error=…` when it did not work, `?notice=password_removed` when linking removed the password
	// of a local account, or `?signed_in=1`. Signed in, the device loads the account and merges its
	// progress, as after a sign-in with a password.
	const params = page.url.searchParams;
	const errorParam = params.get('error');
	const googleError: GoogleErrorCode | null =
		errorParam && errorParam in m.google.errors
			? (errorParam as GoogleErrorCode)
			: errorParam
				? 'google_failed'
				: null;
	const passwordRemoved = params.get('notice') === 'password_removed';
	const signedIn = passwordRemoved || params.has('signed_in');

	const finishing = new AsyncState();

	async function finish() {
		const result = await finishing.run(() => account.finishGoogleSignIn());
		if (!result?.ok) return;
		app.updateSettings({ welcomed: true });
		if (!passwordRemoved) await goto(resolve('/(tabs)'), { replaceState: true });
	}

	onMount(() => {
		if (signedIn && !googleError) void finish();
		else if (!googleError) void goto(resolve('/(tabs)/signin'), { replaceState: true });
	});
</script>

<svelte:head>
	<title>{m.google.title} · {m.app.name}</title>
</svelte:head>

<header>
	<a class="back" href={resolve('/(tabs)/signin')} aria-label={m.google.backToSignIn}>
		<Icon name="back" size={28} />
	</a>
	<h1>
		{passwordRemoved && finishing.status === 'success'
			? m.google.passwordRemovedTitle
			: m.google.title}
	</h1>
</header>

<div class="content" aria-busy={finishing.loading}>
	{#if googleError || finishing.error}
		<p class="error" role="alert">
			{googleError ? m.google.errors[googleError] : m.errors[finishing.error!]}
		</p>
		<div class="actions">
			{#if googleError}
				<Button href={GOOGLE_SIGN_IN_URL} reload wide>{m.google.retry}</Button>
			{:else}
				<Button wide onclick={finish}>{m.google.retry}</Button>
			{/if}
			<Button href={resolve('/(tabs)/signin')} variant="secondary" wide>
				{m.google.backToSignIn}
			</Button>
		</div>
	{:else if passwordRemoved && finishing.status === 'success'}
		<p class="notice" role="status">{m.google.passwordRemoved}</p>
		<div class="actions">
			<Button href={resolve('/(tabs)')} wide>{m.common.continue}</Button>
			<Button href={resolve('/(tabs)/settings/password')} variant="secondary" wide>
				{m.google.choosePassword}
			</Button>
		</div>
	{:else}
		<p class="status" role="status">{m.google.finishing}</p>
	{/if}
</div>

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

	.content {
		display: grid;
		gap: 1.5rem;
	}

	p {
		margin: 0;
	}

	.error {
		padding: 0.75rem 1rem;
		font-weight: 700;
		color: var(--color-error-dark);
		background: var(--color-error-light);
		border-radius: var(--radius-sm);
	}

	.notice {
		padding: 1rem 1.25rem;
		font-weight: 700;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.status {
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.actions {
		display: grid;
		gap: 0.75rem;
	}
</style>
