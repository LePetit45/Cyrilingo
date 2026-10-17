<script lang="ts">
	import { resolve } from '$app/paths';
	import { composeFreeReview } from '#lib/core/engine/compose.js';
	import type { Summary } from '#lib/core/engine/session.js';
	import { m } from '#lib/i18n/index.js';
	import { playEffect } from '#lib/ui/audio/effects.js';
	import Button from '#lib/ui/Button.svelte';
	import SessionPlayer from '#lib/ui/session/SessionPlayer.svelte';
	import SessionSummary from '#lib/ui/session/SessionSummary.svelte';
	import { app } from '#lib/ui/state/app.svelte.js';

	// Free review (spec §4.7): 12 questions on letters of completed lessons. Nothing is saved.
	let summary = $state<Summary | undefined>();
	/** Bumped to start another review with new questions. */
	let run = $state(0);

	const questions = $derived.by(() => {
		void run;
		return composeFreeReview(app.progress.completedLessons, Math.random);
	});

	function finish(result: Summary) {
		if (app.settings.soundEffects) playEffect('complete');
		summary = result;
	}
</script>

<svelte:head>
	<title>{m.review.title} · {m.app.name}</title>
</svelte:head>

{#if questions.length === 0}
	<section class="empty">
		<h1>{m.review.title}</h1>
		<p>{m.review.empty}</p>
		<Button href={resolve('/(tabs)')} wide>{m.review.backHome}</Button>
	</section>
{:else if summary}
	<SessionSummary
		title={m.summary.reviewTitle}
		{summary}
		nextHref={resolve('/(tabs)')}
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
			quitTitle={m.review.quitTitle}
			quitMessage={m.review.quitMessage}
			onfinish={finish}
		/>
	{/key}
{/if}

<style>
	.empty {
		display: grid;
		gap: 1rem;
		padding-top: 3rem;
		text-align: center;
	}

	h1,
	p {
		margin: 0;
	}
</style>
