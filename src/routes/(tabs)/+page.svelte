<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { LESSONS } from '#lib/core/content/course.js';
	import { SECTION_IDS } from '#lib/core/content/types.js';
	import { lessonState, suggestedLesson } from '#lib/core/progress.js';
	import { content } from '#lib/i18n/content/index.js';
	import { m } from '#lib/i18n/index.js';
	import Button from '#lib/ui/Button.svelte';
	import Cyrillic from '#lib/ui/Cyrillic.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { app } from '#lib/ui/state/app.svelte.js';
	import Welcome from '#lib/ui/Welcome.svelte';

	const lessonHref = (id: string) => resolve('/(play)/lesson/[id]', { id });

	const suggested = $derived(suggestedLesson(app.progress));
	const hasCompleted = $derived(app.progress.completedLessons.length > 0);
	const continueHref = $derived(suggested ? lessonHref(suggested.id) : resolve('/(play)/exam'));

	const sections = SECTION_IDS.map((id) => ({
		id,
		lessons: LESSONS.map((lesson, index) => ({ lesson, number: index + 1 })).filter(
			({ lesson }) => lesson.section === id
		)
	}));

	// Path nodes zigzag left and right, like a trail.
	const OFFSETS = [0, 1, 1.4, 1, 0, -1, -1.4, -1];
	const offset = (number: number) => OFFSETS[(number - 1) % OFFSETS.length];

	function startCourse() {
		app.updateSettings({ welcomed: true });
		goto(lessonHref(LESSONS[0].id));
	}
</script>

{#if !app.settings.welcomed}
	<Welcome onstart={startCourse} />
{:else}
	<header>
		<h1>{m.app.name}</h1>
		{#if !suggested}
			<p class="all-done">
				{app.progress.examPassed ? m.home.allDoneAndPassed : m.home.allDone}
			</p>
		{/if}
		<div class="actions">
			<Button href={continueHref} wide>
				{hasCompleted || !suggested ? m.home.continue : m.home.start}
			</Button>
			{#if hasCompleted}
				<Button href={resolve('/(play)/review')} variant="secondary" wide
					>{m.home.freeReview}</Button
				>
			{:else}
				<p class="hint">{m.home.freeReviewHint}</p>
			{/if}
		</div>
	</header>

	<h2 class="visually-hidden">{m.home.title}</h2>
	{#each sections as section (section.id)}
		<section class="section {section.id}" aria-labelledby="section-{section.id}">
			<div class="banner">
				<h3 id="section-{section.id}">{content.sections[section.id].title}</h3>
				<p>{content.sections[section.id].intro}</p>
			</div>
			<ol class="trail">
				{#each section.lessons as { lesson, number } (lesson.id)}
					{@const state = lessonState(app.progress, lesson.id)}
					<li style:--offset={offset(number)}>
						<a href={lessonHref(lesson.id)} class="node {state}">
							<span class="bubble" aria-hidden="true">
								{#if state === 'completed'}
									<Icon name="check" size={34} />
								{:else}
									<Cyrillic>{lesson.letters[0]}</Cyrillic>
								{/if}
							</span>
							<span class="label">
								<span class="name">{m.home.lesson(number)}</span>
								<Cyrillic class="letters">{lesson.letters.join(' ')}</Cyrillic>
								<span class="state">{m.home.lessonStates[state]}</span>
							</span>
						</a>
					</li>
				{/each}
			</ol>
		</section>
	{/each}

	<section class="exam" aria-labelledby="exam-title">
		<a href={resolve('/(play)/exam')} class="node exam-node" class:passed={app.progress.examPassed}>
			<span class="bubble" aria-hidden="true"><Icon name="crown" size={38} /></span>
			<span class="label">
				<span class="name" id="exam-title">{m.home.exam}</span>
				<span class="state">
					{app.progress.examPassed ? m.home.examPassed : m.home.examHint}
				</span>
			</span>
		</a>
	</section>
{/if}

<style>
	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0 0 1.25rem;
		font-size: 2.75rem;
		letter-spacing: -0.02em;
		color: var(--color-primary);
		text-shadow: 0 4px 0 var(--color-primary-dark);
	}

	.all-done {
		margin: 0 0 1rem;
		font-weight: 700;
	}

	.actions {
		display: grid;
		gap: 0.875rem;
	}

	.hint {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--color-text-muted);
	}

	.section {
		--section: var(--color-allies);
		--section-dark: var(--color-allies-dark);
		margin-bottom: 2rem;
	}

	.falseFriends {
		--section: var(--color-false-friends);
		--section-dark: var(--color-false-friends-dark);
	}

	.greekCousins {
		--section: var(--color-greek-cousins);
		--section-dark: var(--color-greek-cousins-dark);
	}

	.newcomers {
		--section: var(--color-newcomers);
		--section-dark: var(--color-newcomers-dark);
	}

	.banner {
		padding: 1rem 1.25rem;
		color: #fff;
		background: var(--section);
		border-radius: var(--radius-lg);
		box-shadow: 0 5px 0 var(--section-dark);
	}

	.banner h3 {
		margin: 0 0 0.25rem;
		font-size: 1.375rem;
	}

	.banner p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.4;
	}

	.trail {
		display: grid;
		gap: 1.25rem;
		margin: 1.75rem 0 0;
		padding: 0;
		list-style: none;
	}

	.trail li {
		display: flex;
		justify-content: center;
		transform: translateX(calc(var(--offset) * 1.75rem));
	}

	.node {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		min-width: 13rem;
		color: inherit;
		text-decoration: none;
	}

	.bubble {
		display: grid;
		flex: none;
		place-items: center;
		width: 4.75rem;
		height: 4.75rem;
		font-size: 2.25rem;
		font-weight: 900;
		color: #fff;
		background: var(--section);
		border-radius: 50%;
		box-shadow: 0 6px 0 var(--section-dark);
		transition: transform 80ms ease-out;
	}

	.node:active .bubble {
		transform: translateY(4px);
		box-shadow: 0 2px 0 var(--section-dark);
	}

	.notDone .bubble {
		color: var(--color-text-muted);
		background: var(--color-surface-muted);
		box-shadow: 0 6px 0 var(--color-border-dark);
	}

	.suggested .bubble {
		outline: 4px solid var(--section);
		outline-offset: 5px;
		animation: pulse 1.6s ease-in-out infinite;
	}

	.label {
		display: grid;
		line-height: 1.25;
	}

	.name {
		font-weight: 900;
	}

	.label :global(.letters) {
		font-size: 1.25rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		color: var(--section-dark);
	}

	.state {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.suggested .state {
		color: var(--section-dark);
	}

	.exam {
		display: flex;
		justify-content: center;
		margin-top: 2.5rem;
	}

	.exam-node .bubble {
		width: 5.75rem;
		height: 5.75rem;
		color: var(--color-gold-dark);
		background: #fff3cc;
		border: 3px solid var(--color-gold);
		box-shadow: 0 6px 0 var(--color-gold-dark);
	}

	.exam-node.passed .bubble {
		color: #fff;
		background: var(--color-gold);
	}

	@keyframes pulse {
		50% {
			outline-offset: 9px;
		}
	}
</style>
