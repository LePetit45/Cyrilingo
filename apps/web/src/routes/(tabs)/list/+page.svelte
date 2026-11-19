<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { isWord, type Reading } from '@cyrilingo/core/content/corpus.js';
	import { untrack } from 'svelte';
	import { api, type ApiErrorCode, type WordList } from '#lib/api/client.js';
	import { m } from '#lib/i18n/index.js';
	import Button from '#lib/ui/Button.svelte';
	import ConfirmDialog from '#lib/ui/ConfirmDialog.svelte';
	import Cyrillic from '#lib/ui/Cyrillic.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { translationOf } from '#lib/ui/letters.js';
	import NameDialog from '#lib/ui/lists/NameDialog.svelte';
	import SignInInvite from '#lib/ui/SignInInvite.svelte';
	import { account } from '#lib/ui/state/account.svelte.js';
	import { AsyncState } from '#lib/ui/state/async.svelte.js';

	// One word list (SPEC.md › Screens): its words, « Réviser ma liste », rename, delete, and a
	// button per word to remove it. The list id is in the query string, as the app is prerendered
	// and list ids are only known at run time.
	const id = $derived(page.url.searchParams.get('id') ?? '');
	const lists = resolve('/(tabs)/lists');

	const loading = new AsyncState();
	/** Rename, delete or a word removed: one change at a time. */
	const change = new AsyncState();
	let list = $state<WordList | undefined>();
	let renaming = $state(false);
	let confirmingDelete = $state(false);
	let done = $state('');

	async function load() {
		const result = await loading.run(() => api.getWordLists());
		if (result?.ok) list = result.value.find((candidate) => candidate.id === id);
	}

	$effect(() => {
		void id;
		if (account.signedIn) untrack(() => void load());
	});

	async function rename(name: string): Promise<ApiErrorCode | null> {
		if (!list) return null;
		const result = await api.renameWordList(list.id, name);
		if (!result.ok) return result.error;
		list = result.value;
		done = m.lists.renamed;
		return null;
	}

	async function remove() {
		if (!list) return;
		const result = await change.run(() => api.deleteWordList(list!.id));
		if (result?.ok) await goto(lists);
	}

	async function removeWord(word: string) {
		if (!list) return;
		done = '';
		const result = await change.run(() => api.removeWordFromList(list!.id, word));
		if (result?.ok) {
			list = result.value;
			done = m.lists.wordRemoved(word);
		}
	}

	const meaning = (word: string) => (isWord(word as Reading) ? translationOf(word as Reading) : '');
	const reviewHref = $derived(`${resolve('/(play)/list/review')}?id=${encodeURIComponent(id)}`);
</script>

<svelte:head>
	<title>{list?.name ?? m.lists.title} · {m.app.name}</title>
</svelte:head>

<a class="back" href={lists}><Icon name="back" size={20} />{m.lists.back}</a>

{#if !account.signedIn}
	<h1>{m.lists.title}</h1>
	<SignInInvite message={m.lists.guestInvite} />
{:else if loading.status === 'loading' || loading.status === 'idle'}
	<p class="loading" role="status">{m.lists.loading}</p>
{:else if loading.status === 'error'}
	<h1>{m.lists.title}</h1>
	<div class="problem">
		<p class="error" role="alert">{m.errors[loading.error ?? 'unknown']}</p>
		<Button variant="secondary" onclick={load}>{m.lists.retry}</Button>
	</div>
{:else if !list}
	<h1>{m.lists.title}</h1>
	<p class="error" role="alert">{m.lists.notFound}</p>
{:else}
	<h1 class="name">{list.name}</h1>
	<p class="count">{m.lists.wordCount(list.words.length)}</p>

	<div class="actions" aria-busy={change.loading}>
		{#if list.words.length > 0}
			<Button href={reviewHref} wide>{m.lists.review}</Button>
		{/if}
		<div class="pair">
			<Button variant="secondary" wide disabled={change.loading} onclick={() => (renaming = true)}>
				{m.lists.rename}
			</Button>
			<Button
				variant="secondary"
				class="delete"
				wide
				disabled={change.loading}
				onclick={() => (confirmingDelete = true)}
			>
				{m.lists.delete}
			</Button>
		</div>
	</div>
	<p class="error" role="alert">{change.error ? m.errors[change.error] : ''}</p>
	<p class="status" role="status">{done}</p>

	<section aria-labelledby="words-title">
		<h2 id="words-title">{m.lists.wordsTitle}</h2>
		{#if list.words.length === 0}
			<p class="empty">{m.lists.emptyList}</p>
		{:else}
			<ul class="group">
				{#each list.words as word (word.cyrillic)}
					<li class="row">
						<span class="word">
							<Cyrillic class="cyrillic">{word.cyrillic}</Cyrillic>
							<span class="latin">{word.latin}</span>
							{#if meaning(word.cyrillic)}
								<span class="meaning">{meaning(word.cyrillic)}</span>
							{/if}
						</span>
						<button
							type="button"
							class="remove"
							disabled={change.loading}
							onclick={() => removeWord(word.cyrillic)}
						>
							<Icon name="close" size={20} label={m.lists.removeWord(word.cyrillic)} />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<NameDialog
		bind:open={renaming}
		title={m.lists.renameTitle}
		submitLabel={m.lists.save}
		initial={list.name}
		onsubmit={rename}
	/>
	<ConfirmDialog
		bind:open={confirmingDelete}
		title={m.lists.deleteTitle}
		message={m.lists.deleteMessage(list.name)}
		confirmLabel={m.lists.deleteConfirm}
		danger
		onconfirm={remove}
	/>
{/if}

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 1rem;
		text-decoration: none;
	}

	h1 {
		margin: 0 0 0.25rem;
		font-size: 2rem;
	}

	.name {
		overflow-wrap: anywhere;
	}

	.count {
		margin: 0 0 1.25rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.loading {
		margin: 2rem 0;
		text-align: center;
		color: var(--color-text-muted);
	}

	.actions {
		display: grid;
		gap: 0.75rem;
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	/* Two buttons side by side: smaller text, so they keep to one or two lines. */
	.pair :global(.button) {
		padding-inline: 0.75rem;
		font-size: 0.9375rem;
	}

	.actions :global(.delete) {
		--fg: var(--color-error-dark);
	}

	section {
		margin-top: 1.5rem;
	}

	h2 {
		margin: 0 0 0.5rem 0.25rem;
		font-size: 0.875rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
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
		padding: 0.75rem 0.75rem 0.75rem 1.25rem;
	}

	.word {
		display: flex;
		flex: 1;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.75rem;
		min-width: 0;
	}

	.word :global(.cyrillic) {
		font-size: 1.5rem;
		font-weight: 800;
	}

	.latin {
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.meaning {
		flex-basis: 100%;
		font-size: 0.9375rem;
		color: var(--color-text-muted);
	}

	.remove {
		display: grid;
		flex: none;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		color: var(--color-text-muted);
		background: none;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.remove:hover:not(:disabled) {
		color: var(--color-error-dark);
		background: var(--color-error-light);
	}

	.remove:disabled {
		cursor: wait;
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
		margin: 0.75rem 0 0;
		padding: 0.75rem 1rem;
		font-weight: 700;
		color: var(--color-error-dark);
		background: var(--color-error-light);
		border-radius: var(--radius-sm);
	}

	.error:empty {
		display: none;
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
