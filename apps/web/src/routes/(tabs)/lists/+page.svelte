<script lang="ts">
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import { api, type WordList } from '#lib/api/client.js';
	import { m } from '#lib/i18n/index.js';
	import Button from '#lib/ui/Button.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import NameDialog from '#lib/ui/lists/NameDialog.svelte';
	import SignInInvite from '#lib/ui/SignInInvite.svelte';
	import { account } from '#lib/ui/state/account.svelte.js';
	import { AsyncState } from '#lib/ui/state/async.svelte.js';

	// Word lists (SPEC.md › Screens): the signed-in learner's lists, each with its number of words,
	// and a way to create one. A guest sees an invitation to sign in, and nothing is asked of the API.
	const loading = new AsyncState();
	let lists = $state<WordList[]>([]);
	let creating = $state(false);
	let done = $state('');

	async function load() {
		const result = await loading.run(() => api.getWordLists());
		if (result?.ok) lists = result.value;
	}

	// Loads once signed in; `untrack` keeps the loading state from triggering another load.
	$effect(() => {
		if (account.signedIn) untrack(() => void load());
	});

	async function create(name: string) {
		const result = await api.createWordList(name);
		if (!result.ok) return result.error;
		lists = [...lists, result.value];
		done = m.lists.created(result.value.name);
		return null;
	}

	const listHref = (id: string) => `${resolve('/(tabs)/list')}?id=${encodeURIComponent(id)}`;
</script>

<svelte:head>
	<title>{m.lists.title} · {m.app.name}</title>
</svelte:head>

<h1>{m.lists.title}</h1>

{#if !account.signedIn}
	<SignInInvite message={m.lists.guestInvite} />
{:else}
	<p class="intro">{m.lists.intro}</p>

	<section aria-labelledby="lists-title" aria-busy={loading.loading}>
		<h2 id="lists-title" class="visually-hidden">{m.lists.title}</h2>
		{#if loading.status === 'loading' || loading.status === 'idle'}
			<ul class="group skeleton" aria-label={m.lists.loading}>
				{#each [1, 2, 3] as row (row)}
					<li class="row"><span class="bar"></span></li>
				{/each}
			</ul>
		{:else if loading.status === 'error'}
			<div class="problem">
				<p class="error" role="alert">{m.errors[loading.error ?? 'unknown']}</p>
				<Button variant="secondary" onclick={load}>{m.lists.retry}</Button>
			</div>
		{:else if lists.length === 0}
			<p class="empty">{m.lists.none}</p>
		{:else}
			<ul class="group">
				{#each lists as list (list.id)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved in listHref -->
						<a class="row" href={listHref(list.id)}>
							<span class="name">{list.name}</span>
							<span class="count">{m.lists.wordCount(list.words.length)}</span>
							<Icon name="forward" size={22} />
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if loading.status === 'success'}
		<Button wide onclick={() => (creating = true)}>{m.lists.create}</Button>
	{/if}
	<p class="status" role="status">{done}</p>

	<NameDialog
		bind:open={creating}
		title={m.lists.create}
		submitLabel={m.lists.createSubmit}
		onsubmit={create}
	/>
{/if}

<style>
	h1 {
		margin: 0 0 1rem;
		font-size: 2rem;
	}

	.intro {
		margin: 0 0 1.5rem;
		color: var(--color-text-muted);
	}

	section {
		margin-bottom: 1.5rem;
	}

	.group {
		display: grid;
		margin: 0;
		padding: 0;
		overflow: hidden;
		list-style: none;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.group > li + li {
		border-top: 2px solid var(--color-border);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-height: 4rem;
		padding: 0.75rem 1.25rem;
		font-weight: 800;
		text-decoration: none;
		color: var(--color-text);
	}

	a.row:hover {
		background: var(--color-surface-muted);
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.count {
		flex: none;
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.row :global(svg) {
		flex: none;
		color: var(--color-text-faint);
	}

	.bar {
		width: 60%;
		height: 1.25rem;
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
		animation: pulse 1.2s ease-in-out infinite alternate;
	}

	@media (prefers-reduced-motion: reduce) {
		.bar {
			animation: none;
		}
	}

	@keyframes pulse {
		to {
			opacity: 0.4;
		}
	}

	.empty {
		margin: 0;
		padding: 1.5rem 1.25rem;
		font-weight: 700;
		text-align: center;
		background: var(--color-surface-muted);
		border-radius: var(--radius-md);
	}

	.problem {
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

	.status {
		min-height: 1.5em;
		margin: 0.75rem 0 0;
		text-align: center;
		font-weight: 700;
		color: var(--color-success-dark);
	}

	.status:empty {
		display: none;
	}
</style>
