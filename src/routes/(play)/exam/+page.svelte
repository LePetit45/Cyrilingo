<script lang="ts">
	import { resolve } from '$app/paths';
	import { composeExam } from '#lib/core/engine/compose.js';
	import { examPassMark, isExamPassed, type Summary } from '#lib/core/engine/session.js';
	import { m } from '#lib/i18n/index.js';
	import { playEffect } from '#lib/ui/audio/effects.js';
	import BottomBar from '#lib/ui/BottomBar.svelte';
	import Button from '#lib/ui/Button.svelte';
	import Diploma from '#lib/ui/Diploma.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import LetterChips from '#lib/ui/LetterChips.svelte';
	import SessionHeader from '#lib/ui/session/SessionHeader.svelte';
	import SessionPlayer from '#lib/ui/session/SessionPlayer.svelte';
	import StatBlock from '#lib/ui/StatBlock.svelte';
	import { app } from '#lib/ui/state/app.svelte.js';

	// The final exam, « L'Épreuve de Preslav » (spec §4.6): 30 questions, no hints, no repeats,
	// a real score. Passing (≥ 90 %) is saved and opens the diploma.
	type Phase =
		| { name: 'intro' }
		| { name: 'play' }
		| { name: 'result'; summary: Summary }
		| { name: 'diploma' };

	let phase = $state<Phase>({ name: 'intro' });
	let run = $state(0);

	const questions = $derived.by(() => {
		void run;
		return composeExam(Math.random);
	});
	const passMark = $derived(examPassMark(questions.length));

	// Announce the result by moving focus to its title.
	let heading: HTMLElement | undefined = $state();
	$effect(() => {
		heading?.focus();
	});

	function finish(summary: Summary) {
		const passed = isExamPassed(summary);
		if (passed) app.passExam();
		if (app.settings.soundEffects) playEffect(passed ? 'complete' : 'wrong');
		phase = { name: 'result', summary };
	}

	function start() {
		run++;
		phase = { name: 'play' };
	}
</script>

<svelte:head>
	<title>{m.exam.title} · {m.app.name}</title>
</svelte:head>

{#if phase.name === 'intro'}
	<SessionHeader quitTitle={m.exam.quitTitle} quitMessage={m.exam.quitMessage} />
	<section class="screen" aria-labelledby="exam-title">
		<div class="content">
			<div class="badge" aria-hidden="true"><Icon name="crown" size={56} /></div>
			<h1 id="exam-title">{m.exam.title}</h1>
			<p>{m.exam.intro}</p>
			<div class="stats">
				<StatBlock label={m.exam.questions} value={questions.length} />
				<StatBlock label={m.exam.toPass} value={passMark} tone="accent" />
			</div>
			<p class="rules">{m.exam.rules}</p>
		</div>
		<BottomBar actions>
			<Button class="grow" onclick={start}>{m.exam.start}</Button>
		</BottomBar>
	</section>
{:else if phase.name === 'play'}
	{#key run}
		<SessionPlayer
			{questions}
			repeatMisses={false}
			quitTitle={m.exam.quitTitle}
			quitMessage={m.exam.quitMessage}
			onfinish={finish}
		/>
	{/key}
{:else if phase.name === 'result'}
	{@const summary = phase.summary}
	{@const passed = isExamPassed(summary)}
	<!-- Already saved: the ✕ leaves without a confirmation. -->
	<header>
		<a class="leave" href={resolve('/(tabs)')} aria-label={m.exam.backHome}>
			<Icon name="close" size={28} />
		</a>
	</header>
	<section class="screen" aria-labelledby="result-title">
		<div class="content">
			<div class={['badge', { failed: !passed }]} aria-hidden="true">
				<Icon name={passed ? 'crown' : 'refresh'} size={56} />
			</div>
			<h1 id="result-title" class={{ passed }} tabindex="-1" bind:this={heading}>
				{passed ? m.exam.passedTitle : m.exam.failedTitle}
			</h1>
			<div class="stats">
				<StatBlock
					label={m.exam.correct}
					value={m.exam.score(summary.firstTry, summary.total)}
					tone={passed ? 'success' : 'error'}
				/>
				<StatBlock label={m.exam.toPass} value={passMark} tone="accent" />
			</div>
			{#if !passed}<p>{m.exam.failedHint}</p>{/if}
			{#if summary.missedLetters.length > 0}
				<div class="missed">
					<h2>{m.summary.missed}</h2>
					<LetterChips letters={summary.missedLetters} missed />
				</div>
			{/if}
		</div>
		<BottomBar actions>
			{#if passed}
				<Button class="grow" onclick={() => (phase = { name: 'diploma' })}>
					{m.exam.seeDiploma}
				</Button>
			{:else}
				<Button class="grow" onclick={start}>{m.exam.retry}</Button>
			{/if}
		</BottomBar>
	</section>
{:else}
	<section class="diploma">
		<Diploma />
		<BottomBar actions>
			<Button href={resolve('/(tabs)')} class="grow">{m.diploma.backHome}</Button>
		</BottomBar>
	</section>
{/if}

<style>
	.screen {
		display: flex;
		flex: 1;
		flex-direction: column;
	}

	/* Centered in the space above the bottom bar, like the end-of-lesson summary. */
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin: auto 0;
		padding: 1.5rem 0;
		text-align: center;
	}

	header {
		display: flex;
		align-items: center;
		min-height: 3rem;
	}

	.leave {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		color: var(--color-text-muted);
		border-radius: 50%;
	}

	.leave:hover {
		background: var(--color-surface-muted);
	}

	.badge {
		display: grid;
		flex: none;
		place-items: center;
		width: 7rem;
		height: 7rem;
		margin-bottom: 0.5rem;
		color: #fff;
		background: var(--color-gold);
		border-radius: 50%;
		box-shadow: 0 7px 0 var(--color-gold-dark);
		animation: pop 600ms cubic-bezier(0.2, 1.6, 0.4, 1);
	}

	.badge.failed {
		background: var(--color-accent);
		box-shadow: 0 7px 0 var(--color-accent-dark);
	}

	h1 {
		margin: 0;
		outline: none;
		font-size: 2rem;
	}

	h1.passed {
		color: var(--color-gold-ink);
	}

	p {
		margin: 0;
	}

	.stats {
		display: flex;
		gap: 0.875rem;
		width: 100%;
		max-width: 22rem;
		margin-top: 0.5rem;
	}

	.rules {
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.missed h2 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		color: var(--color-text-muted);
	}

	.diploma {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding-top: 1rem;
	}

	@keyframes pop {
		from {
			transform: scale(0);
		}
	}
</style>
