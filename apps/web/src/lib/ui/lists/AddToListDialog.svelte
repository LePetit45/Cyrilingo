<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { api, type ApiErrorCode, type WordList } from '#lib/api/client.js';
	import { m } from '#lib/i18n/index.js';
	import { AsyncState } from '../state/async.svelte.js';
	import Button from '../Button.svelte';
	import Icon from '../Icon.svelte';

	// « Ajouter à une liste » (AC-35): the learner's lists, each a toggle that adds the word of a
	// reading question to it or, to undo a mistake, removes it again (AC-37). The + button creates
	// « Nouvelle liste » with the word in it, its name selected to be typed over (AC-38); taking
	// the word back out of such a list deletes it (AC-39). Opened from the answer feedback, for
	// signed-in learners only.
	let { open = $bindable(false), word }: { open?: boolean; word: string } = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	const loading = new AsyncState();
	let lists = $state<WordList[]>([]);
	let busy = $state(false);
	let error = $state<ApiErrorCode | null>(null);
	/** The list whose name is being typed, after the + button created it. */
	let editing = $state<string | null>(null);
	let draft = $state('');
	let nameInput: HTMLInputElement | undefined = $state();
	/** Lists the + button made since the dialog opened: emptied, they are deleted. */
	// Not reactive on purpose: nothing on screen depends on it.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	let createdHere = new Set<string>();

	async function load() {
		const result = await loading.run(() => api.getWordLists());
		if (result?.ok) lists = result.value;
	}

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			error = null;
			editing = null;
			createdHere = new Set();
			dialog.showModal();
			untrack(() => void load());
		}
		if (!open && dialog.open) dialog.close();
	});

	const holds = (list: WordList) => list.words.some(({ cyrillic }) => cyrillic === word);

	function replace(list: WordList) {
		lists = lists.map((candidate) => (candidate.id === list.id ? list : candidate));
	}

	/** Runs one change at a time; a refusal shows its sentence. */
	async function change(
		action: () => Promise<{ ok: true; value: WordList } | { ok: false; error: ApiErrorCode }>
	) {
		if (busy) return undefined;
		busy = true;
		error = null;
		const result = await action();
		busy = false;
		if (!result.ok) {
			error = result.error;
			return undefined;
		}
		return result.value;
	}

	async function toggle(list: WordList) {
		const onlyWord = holds(list) && list.words.length === 1;
		if (onlyWord && createdHere.has(list.id)) return discard(list);
		const changed = await change(() =>
			holds(list) ? api.removeWordFromList(list.id, word) : api.addWordToList(list.id, word)
		);
		if (changed) replace(changed);
	}

	/** Deletes a list the + button just made, once the learner took its only word back out. */
	async function discard(list: WordList) {
		if (busy) return;
		busy = true;
		error = null;
		const result = await api.deleteWordList(list.id);
		busy = false;
		if (!result.ok) {
			error = result.error;
			return;
		}
		createdHere.delete(list.id);
		lists = lists.filter(({ id }) => id !== list.id);
		// Its button is gone: the + button, just below, takes the focus.
		await tick();
		dialog?.querySelector<HTMLElement>('.new')?.focus();
	}

	/** « Nouvelle liste », or « Nouvelle liste 2 »… when the learner already has one so named. */
	function freeName(): string {
		const taken = new Set(lists.map(({ name }) => name));
		let number = 1;
		while (taken.has(m.lists.newListName(number))) number++;
		return m.lists.newListName(number);
	}

	async function createList() {
		const created = await change(() => api.createWordList(freeName()));
		if (!created) return;
		createdHere.add(created.id);
		lists = [...lists, created];
		const filled = await change(() => api.addWordToList(created.id, word));
		if (filled) replace(filled);
		editing = created.id;
		draft = created.name;
		await tick();
		nameInput?.focus();
		nameInput?.select();
	}

	/** Saves the name typed over the new list's; an empty or unchanged name keeps the old one. */
	async function finishEditing() {
		const list = lists.find(({ id }) => id === editing);
		stopEditing();
		const name = draft.trim();
		if (!list || name === '' || name === list.name) return;
		const renamed = await change(() => api.renameWordList(list.id, name));
		if (renamed) replace(renamed);
	}

	function onNameKey(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			void finishEditing();
		} else if (event.key === 'Escape') {
			// Leaves the name as it was, without closing the dialog.
			event.preventDefault();
			stopEditing();
		}
	}

	/** Back to the list's toggle, which takes the focus the name field had. */
	function stopEditing() {
		const id = editing;
		editing = null;
		if (id)
			void tick().then(() => dialog?.querySelector<HTMLElement>(`[data-list="${id}"]`)?.focus());
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="add-to-list-title"
	onclose={() => {
		void finishEditing();
		open = false;
	}}
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
			<p class="muted">{lists.length === 0 ? m.lists.none : m.lists.addTo}</p>
			<ul>
				{#each lists as list (list.id)}
					<li>
						{#if editing === list.id}
							<div class="choice" data-pressed={holds(list)}>
								<span class="mark" aria-hidden="true">
									{#if holds(list)}<Icon name="check" size={18} />{/if}
								</span>
								<input
									class="rename"
									aria-label={m.lists.name}
									maxlength={40}
									autocomplete="off"
									bind:value={draft}
									bind:this={nameInput}
									onkeydown={onNameKey}
									onblur={finishEditing}
								/>
							</div>
						{:else}
							<button
								type="button"
								class="choice"
								aria-pressed={holds(list)}
								data-pressed={holds(list)}
								data-list={list.id}
								onclick={() => toggle(list)}
							>
								<span class="mark" aria-hidden="true">
									{#if holds(list)}<Icon name="check" size={18} />{/if}
								</span>
								<span class="name">
									{list.name}
									<span class="count">
										{holds(list) ? m.lists.inList : m.lists.wordCount(list.words.length)}
									</span>
								</span>
								<span class={['action', { remove: holds(list) }]}>
									{holds(list) ? m.lists.remove : m.lists.add}
								</span>
							</button>
						{/if}
					</li>
				{/each}
				<li>
					<button type="button" class="new" aria-label={m.lists.create} onclick={createList}>
						<Icon name="plus" size={24} />
					</button>
				</li>
			</ul>
		{/if}
	</div>

	<p class="error" role="alert">{error ? m.errors[error] : ''}</p>

	<Button wide onclick={() => (open = false)}>{m.common.close}</Button>
</dialog>

<style>
	dialog {
		width: min(calc(100% - 2rem), 420px);
		max-height: calc(100dvh - 2rem);
		/* Held near the top rather than centered: a list created here makes it taller, and a
		   centered dialog would jump up. */
		margin-top: max(1rem, 6dvh);
		margin-bottom: auto;
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
		gap: 0.75rem;
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

	/* The lists holding the word: ticked, in green. */
	.choice[data-pressed='true'] {
		background: var(--color-success-light);
		border-color: var(--color-success);
	}

	/* Hover only for real pointers: after a tap, it would stick. */
	@media (hover: hover) {
		button.choice[data-pressed='false']:hover {
			background: var(--color-accent-light);
			border-color: var(--color-accent-border);
		}
	}

	.mark {
		display: grid;
		flex: none;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		color: var(--color-surface);
		background: var(--color-surface);
		border: 2px solid var(--color-border-dark);
		border-radius: var(--radius-sm);
	}

	[data-pressed='true'] .mark {
		background: var(--color-success-dark);
		border-color: var(--color-success-dark);
	}

	.name {
		display: grid;
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.count {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	[data-pressed='true'] .count {
		color: var(--color-success-dark);
	}

	.action {
		flex: none;
		font-size: 0.875rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-accent-dark);
	}

	.action.remove {
		color: var(--color-error-dark);
	}

	.error {
		padding: 0.75rem 1rem;
		font-weight: 700;
		color: var(--color-error-dark);
		background: var(--color-error-light);
		border-radius: var(--radius-sm);
	}

	.error:empty {
		display: none;
	}

	.rename {
		flex: 1;
		min-width: 0;
		padding: 0.25rem 0.5rem;
		font: inherit;
		font-weight: 800;
		color: var(--color-text);
		background: var(--color-surface);
		border: 2px solid var(--color-accent);
		border-radius: var(--radius-sm);
	}

	/* Creates a list: a dashed row under the lists. */
	.new {
		display: grid;
		place-items: center;
		width: 100%;
		min-height: 3.25rem;
		color: var(--color-accent-dark);
		background: var(--color-surface);
		border: 2px dashed var(--color-border-dark);
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	@media (hover: hover) {
		.new:hover {
			background: var(--color-accent-light);
			border-color: var(--color-accent-border);
		}
	}
</style>
