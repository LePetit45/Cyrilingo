<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { composeListReview } from '@cyrilingo/core/engine/compose.js';
	import type { Question } from '@cyrilingo/core/engine/questions.js';
	import type { Summary } from '@cyrilingo/core/engine/session.js';
	import { untrack } from 'svelte';
	import { api, type WordList } from '#lib/api/client.js';
	import { m } from '#lib/i18n/index.js';
	import { playEffect } from '#lib/ui/audio/effects.js';
	import Button from '#lib/ui/Button.svelte';
	import SessionPlayer from '#lib/ui/session/SessionPlayer.svelte';
	import SessionSummary from '#lib/ui/session/SessionSummary.svelte';
	import SignInInvite from '#lib/ui/SignInInvite.svelte';
	import { account } from '#lib/ui/state/account.svelte.js';
	import { app } from '#lib/ui/state/app.svelte.js';
	import { AsyncState } from '#lib/ui/state/async.svelte.js';

	// « Réviser ma liste » (SPEC.md › Review): reading questions on up to 12 words of one of the
	// learner's lists. Nothing is saved, as for the free review.
	const id = $derived(page.url.searchParams.get('id') ?? '');
	const backHref = $derived(`${resolve('/(tabs)/list')}?id=${encodeURIComponent(id)}`);

	const loading = new AsyncState();
	let list = $state<WordList | undefined>();
	let summary = $state<Summary | undefined>();
	/** Bumped to start another review with other words. */
	let run = $state(0);

	async function load() {
		const result = await loading.run(() => api.getWordLists());
		if (result?.ok) list = result.value.find((candidate) => candidate.id === id);
	}

	$effect(() => {
		void id;
		if (account.signedIn) untrack(() => void load());
	});

	const questions = $derived.by((): Question[] => {
		void run;
		return list
			? composeListReview(
					list.words.map(({ cyrillic }) => cyrillic),
					Math.random
				)
			: [];
	});

	function finish(result: Summary) {
		if (app.settings.soundEffects) playEffect('complete');
		summary = result;
	}
</script>

<svelte:head>
	<title>{m.lists.reviewTitle} · {m.app.name}</title>
</svelte:head>

{#if !account.signedIn}
	<section class="message">
		<h1>{m.lists.reviewTitle}</h1>
		<SignInInvite message={m.lists.guestInvite} />
	</section>
{:else if loading.status === 'loading' || loading.status === 'idle'}
	<p class="loading" role="status">{m.lists.loading}</p>
{:else if loading.status === 'error' || !list || questions.length === 0}
	<section class="message">
		<h1>{m.lists.reviewTitle}</h1>
		<p class={{ error: loading.status === 'error' || !list }} role="alert">
			{loading.status === 'error'
				? m.errors[loading.error ?? 'unknown']
				: !list
					? m.lists.notFound
					: m.lists.reviewEmpty}
		</p>
		{#if loading.status === 'error'}
			<Button wide onclick={load}>{m.lists.retry}</Button>
		{/if}
		<Button href={list ? backHref : resolve('/(tabs)/lists')} variant="secondary" wide>
			{m.lists.back}
		</Button>
	</section>
{:else if summary}
	<SessionSummary
		title={m.summary.reviewTitle}
		{summary}
		nextHref={backHref}
		onreplay={() => {
			summary = undefined;
			run++;
		}}
	/>
{:else}
	{#key run}
		<SessionPlayer
			{questions}
			repeatMisses
			quitTitle={m.lists.reviewQuitTitle}
			quitMessage={m.lists.reviewQuitMessage}
			quitHref={backHref}
			onfinish={finish}
		/>
	{/key}
{/if}

<style>
	.message {
		display: grid;
		gap: 1rem;
		padding-top: 3rem;
		text-align: center;
	}

	h1,
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

	.loading {
		margin: 3rem 0;
		text-align: center;
		color: var(--color-text-muted);
	}
</style>
