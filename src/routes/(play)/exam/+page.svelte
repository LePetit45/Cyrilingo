<script lang="ts">
	import { resolve } from '$app/paths';
	import { composeExam } from '#lib/core/engine/compose.js';
	import { isExamPassed, type Summary } from '#lib/core/engine/session.js';
	import { m } from '#lib/i18n/index.js';
	import { playEffect } from '#lib/ui/audio/effects.js';
	import Button from '#lib/ui/Button.svelte';
	import Diploma from '#lib/ui/Diploma.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import SessionHeader from '#lib/ui/session/SessionHeader.svelte';
	import SessionPlayer from '#lib/ui/session/SessionPlayer.svelte';
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
	<section class="screen">
		<div class="badge" aria-hidden="true"><Icon name="crown" size={56} /></div>
		<h1>{m.exam.title}</h1>
		{#each m.exam.intro as line, index (index)}
			<p>{line}</p>
		{/each}
		<div class="actions">
			<Button variant="accent" wide onclick={start}>{m.exam.start}</Button>
		</div>
	</section>
{:else if phase.name === 'play'}
	{#key run}
		<SessionPlayer
			{questions}
			repeatMisses={false}
			showMnemonics={false}
			quitTitle={m.exam.quitTitle}
			quitMessage={m.exam.quitMessage}
			onfinish={finish}
		/>
	{/key}
{:else if phase.name === 'result'}
	{@const passed = isExamPassed(phase.summary)}
	<section class="screen">
		<div class={['badge', { failed: !passed }]} aria-hidden="true">
			<Icon name={passed ? 'crown' : 'refresh'} size={56} />
		</div>
		<h1>{passed ? m.exam.passedTitle : m.exam.failedTitle}</h1>
		<p class="score">{m.exam.score(phase.summary.firstTry, phase.summary.total)}</p>
		{#if !passed}<p>{m.exam.failedHint}</p>{/if}
		<div class="actions">
			{#if passed}
				<Button variant="accent" wide onclick={() => (phase = { name: 'diploma' })}>
					{m.exam.seeDiploma}
				</Button>
			{:else}
				<Button wide onclick={start}>{m.exam.retry}</Button>
			{/if}
			<Button href={resolve('/(tabs)')} variant="secondary" wide>{m.exam.backHome}</Button>
		</div>
	</section>
{:else}
	<section class="diploma">
		<Diploma />
		<div class="actions">
			<Button href={resolve('/(tabs)')} wide>{m.diploma.backHome}</Button>
		</div>
	</section>
{/if}

<style>
	.screen {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding-top: 1.5rem;
		text-align: center;
	}

	.badge {
		display: grid;
		place-items: center;
		width: 7rem;
		height: 7rem;
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
		font-size: 2rem;
	}

	p {
		margin: 0;
	}

	.score {
		font-size: 3rem;
		font-weight: 900;
		color: var(--color-accent-dark);
	}

	.actions {
		display: grid;
		gap: 0.875rem;
		width: 100%;
		margin-top: auto;
		padding-top: 1rem;
	}

	.diploma {
		padding-top: 1rem;
	}

	@keyframes pop {
		from {
			transform: scale(0);
		}
	}
</style>
