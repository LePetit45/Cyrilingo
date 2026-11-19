<script lang="ts">
	import { untrack } from 'svelte';
	import { api, type ApiErrorCode, type WordList } from '#lib/api/client.js';
	import { m } from '#lib/i18n/index.js';
	import { AsyncState } from '../state/async.svelte.js';
	import Button from '../Button.svelte';
	import TextField from '../TextField.svelte';

	// « Ajouter à une liste » (AC-35): the learner's lists, to add the word of a reading question
	// to one of them, or a new list to create with the word in it. Opened from the answer feedback,
	// for signed-in learners only.
	let { open = $bindable(false), word }: { open?: boolean; word: string } = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	const loading = new AsyncState();
	let lists = $state<WordList[]>([]);
	let busy = $state(false);
	let error = $state<ApiErrorCode | null>(null);
	let done = $state('');
	let newName = $state('');

	async function load() {
		const result = await loading.run(() => api.getWordLists());
		if (result?.ok) lists = result.value;
	}

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			error = null;
			done = '';
			newName = '';
			dialog.showModal();
			untrack(() => void load());
		}
		if (!open && dialog.open) dialog.close();
	});

	const holds = (list: WordList) => list.words.some(({ cyrillic }) => cyrillic === word);

	function replace(list: WordList) {
		lists = lists.map((candidate) => (candidate.id === list.id ? list : candidate));
	}

	async function addTo(list: WordList) {
		if (busy) return;
		busy = true;
		error = null;
		done = '';
		const result = await api.addWordToList(list.id, word);
		busy = false;
		if (result.ok) {
			replace(result.value);
			done = m.lists.added(result.value.name);
		} else {
			error = result.error;
		}
	}

	async function createAndAdd(event: SubmitEvent) {
		event.preventDefault();
		if (busy || newName.trim() === '') return;
		busy = true;
		error = null;
		done = '';
		const created = await api.createWordList(newName);
		if (!created.ok) {
			busy = false;
			error = created.error;
			return;
		}
		lists = [...lists, created.value];
		newName = '';
		busy = false;
		await addTo(created.value);
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="add-to-list-title"
	onclose={() => (open = false)}
	onclick={(event) => {
		if (event.target === dialog) open = false;
	}}
>
	<h2 id="add-to-list-title">{m.lists.addToList}</h2>
	<p class="word" lang="bg">{word}</p>

	<div aria-busy={loading.loading || busy}>
		{#if loading.status === 'loading' || loading.status === 'idle'}
			<p class="muted" role="status">{m.lists.loading}</p>
		{:else if loading.status === 'error'}
			<p class="error" role="alert">{m.errors[loading.error ?? 'unknown']}</p>
			<Button variant="secondary" wide onclick={load}>{m.lists.retry}</Button>
		{:else}
			{#if lists.length === 0}
				<p class="muted">{m.lists.none}</p>
			{:else}
				<p class="muted">{m.lists.addTo}</p>
				<ul>
					{#each lists as list (list.id)}
						<li>
							<button
								type="button"
								class="choice"
								disabled={busy || holds(list)}
								onclick={() => addTo(list)}
							>
								<span class="name">{list.name}</span>
								<span class="count">
									{holds(list) ? m.lists.alreadyIn : m.lists.wordCount(list.words.length)}
								</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			<form class="create" onsubmit={createAndAdd}>
				<TextField
					id="new-list-name"
					label={m.lists.newName}
					bind:value={newName}
					maxlength={40}
					autocomplete="off"
				/>
				<Button type="submit" variant="secondary" wide disabled={busy || newName.trim() === ''}>
					{m.lists.createAndAdd}
				</Button>
			</form>
		{/if}
	</div>

	<p class="error" role="alert">{error ? m.errors[error] : ''}</p>
	<p class="status" role="status">{done}</p>

	<Button wide onclick={() => (open = false)}>{m.common.close}</Button>
</dialog>

<style>
	dialog {
		width: min(calc(100% - 2rem), 420px);
		max-height: calc(100dvh - 2rem);
		padding: 1.5rem;
		color: var(--color-text);
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 6px 0 var(--color-border-dark);
	}

	dialog[open] {
		display: grid;
		gap: 1rem;
	}

	dialog::backdrop {
		background: rgb(31 27 46 / 0.45);
	}

	h2,
	p {
		margin: 0;
	}

	h2 {
		font-size: 1.5rem;
	}

	.word {
		font-size: 2rem;
		font-weight: 900;
		text-align: center;
	}

	.muted {
		margin-bottom: 0.5rem;
		color: var(--color-text-muted);
	}

	ul {
		display: grid;
		gap: 0.5rem;
		margin: 0 0 1rem;
		padding: 0;
		list-style: none;
	}

	.choice {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		min-height: 3.25rem;
		padding: 0.5rem 1rem;
		font-weight: 800;
		text-align: left;
		color: var(--color-text);
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-bottom-width: 4px;
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.choice:hover:not(:disabled) {
		background: var(--color-accent-light);
		border-color: var(--color-accent-border);
	}

	.choice:disabled {
		cursor: default;
		background: var(--color-surface-muted);
	}

	.name {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.count {
		flex: none;
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.create {
		display: grid;
		gap: 0.75rem;
	}

	.error {
		padding: 0.75rem 1rem;
		font-weight: 700;
		color: var(--color-error-dark);
		background: var(--color-error-light);
		border-radius: var(--radius-sm);
	}

	.error:empty,
	.status:empty {
		display: none;
	}

	.status {
		text-align: center;
		font-weight: 700;
		color: var(--color-success-dark);
	}
</style>
