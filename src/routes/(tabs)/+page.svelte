<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { BULGARIAN_ALPHABET } from '#lib/core/alphabet.js';
	import { LESSONS } from '#lib/core/content/course.js';
	import { SECTION_IDS } from '#lib/core/content/types.js';
	import { isLetterLearned, lessonState, suggestedLesson } from '#lib/core/progress.js';
	import { content } from '#lib/i18n/content/index.js';
	import { m } from '#lib/i18n/index.js';
	import Button from '#lib/ui/Button.svelte';
	import Cyrillic from '#lib/ui/Cyrillic.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { app } from '#lib/ui/state/app.svelte.js';
	import Welcome from '#lib/ui/Welcome.svelte';

	// Home (spec §7.1): letters read so far, then the path, one banner per section. On very wide
	// screens, a second column shows the progress per section and the free review.
	const lessonHref = (id: string) => resolve('/(play)/lesson/[id]', { id });

	const suggested = $derived(suggestedLesson(app.progress));
	const hasCompleted = $derived(app.progress.completedLessons.length > 0);
	const examSuggested = $derived(!suggested && !app.progress.examPassed);

	const sections = SECTION_IDS.map((id) => {
		const lessons = LESSONS.map((lesson, index) => ({ lesson, number: index + 1 })).filter(
			({ lesson }) => lesson.section === id
		);
		return { id, lessons, letters: lessons.flatMap(({ lesson }) => lesson.letters) };
	});

	const learnedIn = (letters: readonly (typeof BULGARIAN_ALPHABET)[number][]) =>
		letters.filter((letter) => isLetterLearned(app.progress, letter)).length;
	const learnedCount = $derived(learnedIn(BULGARIAN_ALPHABET));

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
	<div class="home">
		<div class="path">
			<header class="top-bar">
				<h1>{m.app.name}</h1>
				<p class="count">
					<span class="visually-hidden"
						>{m.home.lettersRead(learnedCount, BULGARIAN_ALPHABET.length)}</span
					>
					<span aria-hidden="true"
						><Cyrillic class="count-icon">Аа</Cyrillic
						>{learnedCount}/{BULGARIAN_ALPHABET.length}</span
					>
				</p>
			</header>

			{#if !suggested}
				<p class="all-done">
					{app.progress.examPassed ? m.home.allDoneAndPassed : m.home.allDone}
				</p>
			{/if}

			<h2 class="visually-hidden">{m.home.title}</h2>
			{#each sections as section, index (section.id)}
				<section class="section {section.id}" aria-labelledby="section-{section.id}">
					<div class="banner">
						<p class="eyebrow">{m.home.section(index + 1, section.letters.length)}</p>
						<h3 id="section-{section.id}">{content.sections[section.id].title}</h3>
					</div>
					<p class="intro">{content.sections[section.id].intro}</p>
					<ol class="trail">
						{#each section.lessons as { lesson, number } (lesson.id)}
							{@const state = lessonState(app.progress, lesson.id)}
							<li style:--offset={offset(number)} class={{ 'has-tip': state === 'suggested' }}>
								<a href={lessonHref(lesson.id)} class="node {state}">
									<span class="ring" aria-hidden="true">
										<span class="disc">
											{#if state === 'completed'}
												<Icon name="check" size={36} />
											{:else}
												<Cyrillic>{lesson.letters[0]}</Cyrillic>
											{/if}
										</span>
									</span>
									<span class="visually-hidden">
										<span>{m.home.lesson(number)}</span>
										<Cyrillic class="letters">{lesson.letters.join(' ')}</Cyrillic>
										<span>{m.home.lessonStates[state]}</span>
									</span>
									{#if state === 'suggested'}
										<span class="tip">{m.home.start}</span>
									{/if}
								</a>
							</li>
						{/each}
					</ol>
				</section>
			{/each}

			<section class={['exam', { 'has-tip': examSuggested }]} aria-labelledby="exam-title">
				<a
					href={resolve('/(play)/exam')}
					class={[
						'node',
						'exam-node',
						{ suggested: examSuggested, passed: app.progress.examPassed }
					]}
				>
					<span class="ring" aria-hidden="true">
						<span class="disc"><Icon name="crown" size={40} /></span>
					</span>
					<span class="exam-label">
						<span class="exam-name" id="exam-title">{m.home.exam}</span>
						<span class="exam-state">
							{app.progress.examPassed ? m.home.examPassed : m.home.examHint}
						</span>
					</span>
					{#if examSuggested}
						<span class="tip">{m.home.start}</span>
					{/if}
				</a>
			</section>
		</div>

		<aside class="rail">
			<div class="card">
				<div class="card-title">
					<h2>{m.home.progressTitle}</h2>
					<a href={resolve('/(tabs)/alphabet')}>{m.nav.alphabet}</a>
				</div>
				<p class="rail-count">
					<span class="rail-count-number">{learnedCount}</span>
					{m.home.lettersReadShort(BULGARIAN_ALPHABET.length)}
				</p>
				<ul class="groups">
					{#each sections as section (section.id)}
						{@const learned = learnedIn(section.letters)}
						<li class="group {section.id}">
							<span class="group-icon" aria-hidden="true"
								><Cyrillic>{section.letters[0]}</Cyrillic></span
							>
							<span class="group-name">{content.sections[section.id].title}</span>
							<span class="group-bar" aria-hidden="true"
								><span style:width="{(learned / section.letters.length) * 100}%"></span></span
							>
							<span class="group-count">{learned}/{section.letters.length}</span>
						</li>
					{/each}
				</ul>
			</div>

			<div class="card">
				<h2>{m.home.freeReview}</h2>
				{#if hasCompleted}
					<p>{m.home.freeReviewText}</p>
					<Button href={resolve('/(play)/review')} variant="secondary" wide>{m.home.review}</Button>
				{:else}
					<p>{m.home.freeReviewHint}</p>
				{/if}
			</div>
		</aside>
	</div>
{/if}

<style>
	.home {
		display: flex;
		gap: 3rem;
		align-items: flex-start;
	}

	.path {
		flex: 1;
		min-width: 0;
	}

	/* Top bar */

	.top-bar {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: -1.5rem -1rem 1rem;
		padding: 0.75rem 1rem;
		background: var(--color-bg);
	}

	h1 {
		margin: 0;
		font-size: 1.75rem;
		letter-spacing: -0.02em;
		color: var(--color-primary);
	}

	.count {
		margin: 0;
		padding: 0.25rem 0.75rem;
		font-size: 1.0625rem;
		font-weight: 900;
		color: var(--color-accent-dark);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.count :global(.count-icon) {
		margin-right: 0.375rem;
		font-size: 1.25rem;
	}

	.all-done {
		margin: 0 0 1.5rem;
		padding: 1rem 1.25rem;
		font-weight: 800;
		text-align: center;
		color: var(--color-gold-dark);
		background: var(--color-gold-light);
		border-radius: var(--radius-md);
	}

	/* Sections */

	.section {
		margin-bottom: 2.5rem;
	}

	.allies {
		--section: var(--color-allies);
		--section-dark: var(--color-allies-dark);
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
		border-radius: var(--radius-md);
		box-shadow: 0 var(--press-depth) 0 var(--section-dark);
	}

	.eyebrow {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.banner h3 {
		margin: 0.125rem 0 0;
		font-size: 1.5rem;
	}

	.intro {
		margin: 0.875rem 0.25rem 0;
		font-size: 1rem;
		line-height: 1.4;
		color: var(--color-text-muted);
	}

	/* Path nodes */

	.trail {
		display: grid;
		gap: 1.75rem;
		margin: 2.25rem 0 0;
		padding: 0;
		list-style: none;
	}

	.trail li {
		display: flex;
		justify-content: center;
		transform: translateX(calc(var(--offset) * 2.75rem));
	}

	/* Room for the bubble above the suggested lesson. */
	.has-tip {
		margin-top: 3rem;
	}

	.node {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: inherit;
		text-decoration: none;
		border-radius: 50%;
	}

	/* Separate lines, so screen readers pause between the lesson, its letters and its state. */
	.node .visually-hidden > :global(*) {
		display: block;
	}

	/* Holds the disc and its bottom edge, so the suggested ring is centered on both. */
	.ring {
		--edge-depth: 7px;
		position: relative;
		display: block;
		padding-bottom: var(--edge-depth);
	}

	.disc {
		--edge: var(--section-dark);
		position: relative;
		display: grid;
		place-items: center;
		width: 4.75rem;
		height: 4.25rem;
		overflow: hidden;
		font-size: 2.125rem;
		font-weight: 900;
		color: #fff;
		background: var(--section);
		border-radius: 50%;
		/* A light rim on top and a darker one at the bottom give the disc some volume. */
		box-shadow:
			inset 0 0.25rem 0 rgb(255 255 255 / 0.22),
			inset 0 -0.3125rem 0 rgb(0 0 0 / 0.1),
			0 var(--edge-depth) 0 var(--edge);
		transition:
			transform 80ms ease-out,
			box-shadow 80ms ease-out;
	}

	/* Glossy highlight on the upper left. */
	.disc::before {
		content: '';
		position: absolute;
		top: 0.625rem;
		left: 0.875rem;
		width: 1.375rem;
		height: 0.625rem;
		background: rgb(255 255 255 / 0.35);
		border-radius: 50%;
		transform: rotate(-30deg);
	}

	.disc > :global(*) {
		position: relative;
	}

	/* On hover, the disc rises on a taller edge and its letter or icon gives a little wiggle. */
	@media (hover: hover) {
		.node:hover .disc {
			transform: translateY(-3px);
			box-shadow:
				inset 0 0.25rem 0 rgb(255 255 255 / 0.22),
				inset 0 -0.3125rem 0 rgb(0 0 0 / 0.1),
				0 calc(var(--edge-depth) + 3px) 0 var(--edge);
			transition-duration: 150ms;
		}

		.node:hover .disc > :global(*) {
			animation: wiggle 450ms ease-in-out;
		}
	}

	@keyframes wiggle {
		25% {
			rotate: -10deg;
		}

		75% {
			rotate: 10deg;
		}
	}

	.node:active .disc {
		transform: translateY(5px);
		box-shadow:
			inset 0 0.25rem 0 rgb(255 255 255 / 0.22),
			inset 0 -0.3125rem 0 rgb(0 0 0 / 0.1),
			0 2px 0 var(--edge);
	}

	.notDone .disc {
		--edge: var(--color-border-dark);
		color: var(--color-text-faint);
		background: var(--color-border);
	}

	/* The suggested lesson: a ring around the node and a bouncing bubble above it. */
	.suggested .ring::before {
		content: '';
		position: absolute;
		inset: -0.75rem;
		border: 0.4375rem solid color-mix(in srgb, var(--section) 30%, var(--color-bg));
		border-radius: 50%;
	}

	.tip {
		position: absolute;
		bottom: calc(100% + 1.5rem);
		left: 50%;
		padding: 0.5rem 0.875rem;
		font-size: 0.9375rem;
		font-weight: 900;
		letter-spacing: 0.06em;
		line-height: 1.2;
		text-transform: uppercase;
		white-space: nowrap;
		color: var(--section-dark);
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		transform: translateX(-50%);
		animation: bob 1.6s ease-in-out infinite;
	}

	.tip::after {
		content: '';
		position: absolute;
		bottom: -0.5rem;
		left: 50%;
		width: 0.75rem;
		height: 0.75rem;
		background: var(--color-surface);
		border-right: 2px solid var(--color-border);
		border-bottom: 2px solid var(--color-border);
		transform: translateX(-50%) rotate(45deg);
	}

	@keyframes bob {
		50% {
			transform: translateX(-50%) translateY(-0.3rem);
		}
	}

	/* Final exam */

	.exam {
		--section: var(--color-gold);
		--section-dark: var(--color-gold-dark);
		display: flex;
		justify-content: center;
		margin-top: 3rem;
	}

	.exam.has-tip {
		margin-top: 6rem;
	}

	.exam-node {
		gap: 1.25rem;
		max-width: 16rem;
		border-radius: var(--radius-md);
	}

	.exam-node .disc {
		width: 5.75rem;
		height: 5.25rem;
		color: var(--color-gold-dark);
		background: var(--color-gold-light);
		border: 3px solid var(--color-gold);
	}

	.exam-node.passed .disc {
		color: #fff;
		background: var(--color-gold);
	}

	.exam-node .tip {
		color: var(--color-gold-dark);
	}

	.exam-label {
		display: grid;
		text-align: center;
		line-height: 1.3;
	}

	.exam-name {
		font-size: 1.125rem;
		font-weight: 900;
	}

	.exam-state {
		font-size: 0.9375rem;
		color: var(--color-text-muted);
	}

	/* Right column, on very wide screens only */

	.rail {
		display: none;
	}

	.card {
		padding: 1.25rem;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.card h2 {
		margin: 0 0 0.75rem;
		font-size: 1.25rem;
	}

	.card p {
		margin: 0 0 1rem;
		font-size: 1rem;
		color: var(--color-text-muted);
	}

	.card-title {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.card-title a {
		font-size: 0.875rem;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-decoration: none;
		text-transform: uppercase;
		color: var(--color-accent-dark);
	}

	p.rail-count {
		font-weight: 900;
		color: var(--color-accent-dark);
	}

	.rail-count-number {
		font-size: 2rem;
	}

	.groups {
		display: grid;
		gap: 0.875rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.group {
		display: grid;
		grid-template-columns: 2.5rem 1fr auto;
		grid-template-areas:
			'icon name count'
			'icon bar bar';
		column-gap: 0.75rem;
		row-gap: 0.25rem;
		align-items: center;
		font-size: 0.9375rem;
	}

	.group-icon {
		display: grid;
		grid-area: icon;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1.25rem;
		font-weight: 900;
		color: #fff;
		background: var(--section);
		border-radius: var(--radius-sm);
		box-shadow: 0 3px 0 var(--section-dark);
	}

	.group-name {
		grid-area: name;
		font-weight: 800;
	}

	.group-count {
		grid-area: count;
		font-size: 0.875rem;
		font-weight: 800;
		color: var(--color-text-muted);
	}

	.group-bar {
		grid-area: bar;
		height: 0.75rem;
		overflow: hidden;
		background: var(--color-border);
		border-radius: 999px;
	}

	.group-bar span {
		display: block;
		height: 100%;
		background: var(--section);
		border-radius: inherit;
	}

	@media (min-width: 900px) {
		.top-bar {
			justify-content: flex-end;
			margin: -1.5rem 0 1rem;
			padding: 0.75rem 0;
		}

		/* The sidebar shows the name. */
		h1 {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}

	@media (min-width: 1200px) {
		/* The right column shows the letters read. */
		.count {
			display: none;
		}

		.top-bar {
			position: static;
			padding: 0;
		}

		.rail {
			position: sticky;
			top: 1.5rem;
			display: grid;
			gap: 1.25rem;
			width: var(--rail-width);
		}
	}
</style>
