<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.js';
	import Button from '#lib/ui/Button.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { account } from '#lib/ui/state/account.svelte.js';
	import { AsyncState } from '#lib/ui/state/async.svelte.js';
	import TextField from '#lib/ui/TextField.svelte';

	// Set or change the account's password (SPEC.md › Account management): the current one is
	// asked when the account has one. The other devices are signed out.
	let currentPassword = $state('');
	let newPassword = $state('');
	const save = new AsyncState();
	const hasPassword = $derived(account.details?.hasPassword ?? true);

	$effect(() => {
		if (!account.signedIn) void goto(resolve('/(tabs)/settings'));
	});

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		const result = await save.run(() =>
			account.setPassword({
				currentPassword: hasPassword ? currentPassword : undefined,
				newPassword
			})
		);
		if (result?.ok) {
			currentPassword = '';
			newPassword = '';
		}
	}
</script>

<svelte:head>
	<title>{m.password.title} · {m.app.name}</title>
</svelte:head>

<header>
	<a class="back" href={resolve('/(tabs)/settings')} aria-label={m.password.back}>
		<Icon name="back" size={28} />
	</a>
	<h1>{m.password.title}</h1>
</header>

<form {onsubmit} aria-busy={save.loading}>
	{#if hasPassword}
		<TextField
			id="current-password"
			label={m.password.current}
			type="password"
			autocomplete="current-password"
			required
			maxlength={128}
			bind:value={currentPassword}
		/>
	{/if}
	<TextField
		id="new-password"
		label={m.password.next}
		type="password"
		autocomplete="new-password"
		required
		minlength={8}
		maxlength={128}
		hint={m.auth.passwordHint}
		bind:value={newPassword}
	/>

	<p class="error" role="alert">{save.error ? m.errors[save.error] : ''}</p>
	<p class="saved" role="status">{save.status === 'success' ? m.password.saved : ''}</p>

	<Button type="submit" wide disabled={save.loading}>
		{save.loading ? m.auth.busy : m.password.save}
	</Button>
</form>

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

	form {
		display: grid;
		gap: 1.25rem;
	}

	.error,
	.saved {
		margin: 0;
		padding: 0.75rem 1rem;
		font-weight: 700;
		border-radius: var(--radius-sm);
	}

	.error {
		color: var(--color-error-dark);
		background: var(--color-error-light);
	}

	.saved {
		color: var(--color-success-dark);
		background: var(--color-success-light);
	}

	.error:empty,
	.saved:empty {
		display: none;
	}
</style>
