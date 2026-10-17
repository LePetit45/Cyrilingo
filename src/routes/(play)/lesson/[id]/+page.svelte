<script lang="ts">
	import { resolve } from '$app/paths';
	import { composeLesson } from '#lib/core/engine/compose.js';
	import type { Summary } from '#lib/core/engine/session.js';
	import { suggestedLesson } from '#lib/core/progress.js';
	import { m } from '#lib/i18n/index.js';
	import { playEffect } from '#lib/ui/audio/effects.js';
	import BottomBar from '#lib/ui/BottomBar.svelte';
	import Button from '#lib/ui/Button.svelte';
	import LetterCard from '#lib/ui/LetterCard.svelte';
	import SessionHeader from '#lib/ui/session/SessionHeader.svelte';
	import SessionPlayer from '#lib/ui/session/SessionPlayer.svelte';
	import SessionSummary from '#lib/ui/session/SessionSummary.svelte';
	import { app } from '#lib/ui/state/app.svelte.js';
	import type { PageProps } from './$types';

	// A lesson (spec §4.3): discovery cards for the 3 new letters, the questions, then the summary.
	// Nothing is saved until it is completed (spec §4.5).
	let { data }: PageProps = $props();

	type Phase =
		{ name: 'cards'; index: number } | { name: 'play' } | { name: 'done'; summary: Summary };

	let phase = $state<Phase>({ name: 'cards', index: 0 });
	/** Bumped to replay the lesson from scratch, with freshly shuffled questions. */
	let run = $state(0);

	const questions = $derived.by(() => {
		void run;
		return composeLesson(data.lesson.id, Math.random);
	});

	// Opening another lesson reuses this page component: start over.
	$effect.pre(() => {
		void data.lesson.id;
		phase = { name: 'cards', index: 0 };
	});

	const nextHref = $derived.by(() => {
		const next = suggestedLesson(app.progress);
		return next ? resolve('/(play)/lesson/[id]', { id: next.id }) : resolve('/(tabs)');
	});

	function finish(summary: Summary) {
		app.completeLesson(data.lesson.id);
		if (app.settings.soundEffects) playEffect('complete');
		phase = { name: 'done', summary };
	}

	function replay() {
		run++;
		phase = { name: 'cards', index: 0 };
	}
</script>

<svelte:head>
	<title>{m.home.lesson(data.number)} · {m.app.name}</title>
</svelte:head>

{#if phase.name === 'cards'}
	{@const index = phase.index}
	{@const last = index === data.lesson.letters.length - 1}
	<SessionHeader label={m.card.position(index + 1, data.lesson.letters.length)} />
	<div class="cards">
		{#key index}
			<div class="card">
				<LetterCard letter={data.lesson.letters[index]} eyebrow={null} />
			</div>
		{/key}
		<BottomBar actions>
			<Button
				class="grow"
				variant={last ? 'success' : 'primary'}
				onclick={() => (phase = last ? { name: 'play' } : { name: 'cards', index: index + 1 })}
			>
				{last ? m.card.start : m.card.next}
			</Button>
		</BottomBar>
	</div>
{:else if phase.name === 'play'}
	{#key run}
		<SessionPlayer {questions} repeatMisses onfinish={finish} />
	{/key}
{:else}
	<SessionSummary
		title={m.summary.lessonTitle}
		summary={phase.summary}
		newLetters={data.lesson.letters}
		{nextHref}
		onreplay={replay}
	/>
{/if}

<style>
	.cards {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 1rem;
	}

	/* Centered in the space between the header and the bottom bar. */
	.card {
		width: calc(100% - 1rem);
		max-width: 28rem;
		margin: auto;
		animation: enter 260ms ease-out;
	}

	@keyframes enter {
		from {
			opacity: 0;
			transform: translateX(2rem);
		}
	}
</style>
