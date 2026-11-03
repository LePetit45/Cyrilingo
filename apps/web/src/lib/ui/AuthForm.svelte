<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.js';
	import Button from '#lib/ui/Button.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { account } from '#lib/ui/state/account.svelte.js';
	import { AsyncState } from '#lib/ui/state/async.svelte.js';
	import TextField from '#lib/ui/TextField.svelte';

	// Sign-in and sign-up screens (SPEC.md › Screens): e-mail and password, one sentence per error,
	// the path once signed in.
	let { mode }: { mode: 'signIn' | 'signUp' } = $props();

	const signUp = $derived(mode === 'signUp');
	let email = $state('');
	let password = $state('');
	const submit = new AsyncState();

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		const result = await submit.run(() =>
			signUp ? account.signUp(email, password) : account.signIn(email, password)
		);
		if (result?.ok) await goto(resolve('/(tabs)'));
	}
</script>

<svelte:head>
	<title>{signUp ? m.auth.signUpTitle : m.auth.signInTitle} · {m.app.name}</title>
</svelte:head>

<header>
	<a class="back" href={resolve('/(tabs)/settings')} aria-label={m.auth.back}>
		<Icon name="back" size={28} />
	</a>
	<h1>{signUp ? m.auth.signUpTitle : m.auth.signInTitle}</h1>
</header>

<p class="intro">{signUp ? m.auth.signUpIntro : m.auth.signInIntro}</p>

<form {onsubmit} aria-busy={submit.loading}>
	<TextField
		id="email"
		label={m.auth.email}
		type="email"
		autocomplete="email"
		required
		maxlength={254}
		bind:value={email}
	/>
	<TextField
		id="password"
		label={m.auth.password}
		type="password"
		autocomplete={signUp ? 'new-password' : 'current-password'}
		required
		minlength={signUp ? 8 : undefined}
		maxlength={128}
		hint={signUp ? m.auth.passwordHint : undefined}
		bind:value={password}
	/>

	<p class="error" role="alert">{submit.error ? m.errors[submit.error] : ''}</p>

	<Button type="submit" wide disabled={submit.loading}>
		{#if submit.loading}
			{m.auth.busy}
		{:else}
			{signUp ? m.auth.signUp : m.auth.signIn}
		{/if}
	</Button>
</form>

<p class="switch">
	{#if signUp}
		{m.auth.haveAccount} <a href={resolve('/(tabs)/signin')}>{m.auth.toSignIn}</a>
	{:else}
		{m.auth.noAccount} <a href={resolve('/(tabs)/signup')}>{m.auth.toSignUp}</a>
	{/if}
</p>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin: 0 0 0.75rem -0.75rem;
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

	.intro {
		margin: 0 0 1.5rem;
		color: var(--color-text-muted);
	}

	form {
		display: grid;
		gap: 1.25rem;
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

	.switch {
		margin: 1.5rem 0 0;
		text-align: center;
		color: var(--color-text-muted);
	}

	.switch a {
		font-weight: 800;
		color: var(--color-accent-dark);
	}
</style>
