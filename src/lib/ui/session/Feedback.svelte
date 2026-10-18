<script lang="ts">
	import type { Question } from '#lib/core/engine/questions.js';
	import type { ReadingCheck } from '#lib/core/reading.js';
	import { m } from '#lib/i18n/index.js';
	import AudioButton from '../AudioButton.svelte';
	import Button from '../Button.svelte';
	import Cyrillic from '../Cyrillic.svelte';
	import Icon from '../Icon.svelte';
	import {
		letterGlyph,
		officialOf,
		officialTransliteration,
		phoneticOf,
		phoneticReading,
		translationOf
	} from '../letters.js';
	import HighlightedReading from '../HighlightedReading.svelte';

	// Colored panel at the bottom of the screen after each answer (spec §5.3): the right answer, the
	// wrong letters and, after a reading, the word with the letter being learned underlined, and its
	// translation.
	let {
		question,
		correct,
		dontKnow,
		check,
		oncontinue
	}: {
		question: Question;
		correct: boolean;
		dontKnow: boolean;
		/** Result of a typed reading answer. */
		check?: ReadingCheck;
		oncontinue: () => void;
	} = $props();

	const praise = m.feedback.correct[Math.floor(Math.random() * m.feedback.correct.length)];
	const title = $derived(correct ? praise : dontKnow ? m.feedback.dontKnow : m.feedback.wrong);

	// Focus Continue, so Enter (or Space) moves on with the button's own behavior and keyboard
	// users land on the next action. Without scrolling: the panel is still sliding in from below
	// the screen, and the browser would scroll the page down to the button, then snap it back.
	let continueArea: HTMLElement | undefined = $state();
	$effect(() => {
		continueArea?.querySelector('button')?.focus({ preventScroll: true });
	});
</script>

<section class={['feedback', correct ? 'correct' : 'wrong']} aria-labelledby="feedback-title">
	<div class="details">
		<p class="title" id="feedback-title">
			<span class="verdict-icon" aria-hidden="true"
				><Icon name={correct ? 'check' : 'close'} size={20} /></span
			>{title}
		</p>

		{#if question.kind === 'reading'}
			<div class="reading">
				<HighlightedReading reading={question.reading} letter={question.letter} />
				<AudioButton name={question.reading} autoplay />
			</div>
			{#if !correct}
				<p class="answer">
					{m.feedback.answer}
					<strong>{phoneticReading(question.reading)}</strong>
					{#if officialTransliteration(question.reading) !== phoneticReading(question.reading)}
						<span class="official">({officialTransliteration(question.reading)})</span>
					{/if}
				</p>
				{#if check?.letters}
					<p class="typed">
						{m.feedback.yourAnswer}
						<span class="segments"
							>{#each check.letters as letter, index (index)}<span
									class={['segment', { wrong: !letter.correct }]}>{letter.typed || '_'}</span
								>{/each}</span
						>
					</p>
				{/if}
			{/if}
			{#if translationOf(question.reading)}
				<p class="meaning">{m.feedback.meaning} {translationOf(question.reading)}</p>
			{/if}
		{:else if !correct}
			<p class="answer">
				<Cyrillic class="glyph">{letterGlyph(question.letter)}</Cyrillic>
				→ <strong>« {phoneticOf(question.letter)} »</strong>
				{#if officialOf(question.letter) !== phoneticOf(question.letter)}
					<span class="official">({officialOf(question.letter)})</span>
				{/if}
			</p>
		{/if}
	</div>

	<div class="continue" bind:this={continueArea}>
		<!-- The second click of a double click on « Vérifier », which sat here, must not skip the
		     feedback. -->
		<Button
			variant={correct ? 'success' : 'danger'}
			wide
			onclick={(event) => {
				if (event.detail <= 1) oncontinue();
			}}
		>
			{m.common.continue}
		</Button>
	</div>
</section>

<style>
	.feedback {
		--tone: var(--color-success-dark);

		display: grid;
		gap: 0.875rem;
		max-width: var(--footer-width);
		margin: 0 auto;
		color: var(--tone);
	}

	.wrong {
		--tone: var(--color-error-dark);
	}

	.details {
		display: grid;
		gap: 0.5rem;
	}

	p {
		margin: 0;
	}

	.title {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 1.5rem;
		font-weight: 900;
	}

	.verdict-icon {
		display: grid;
		flex: none;
		place-items: center;
		width: 2rem;
		height: 2rem;
		background: var(--color-surface);
		border-radius: 50%;
	}

	.reading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.75rem;
		font-weight: 900;
		color: var(--color-text);
	}

	.answer,
	.typed,
	.meaning {
		color: var(--color-text);
	}

	.answer strong {
		font-size: 1.25rem;
		color: var(--tone);
	}

	.official {
		font-size: 0.9375rem;
		color: var(--color-text-muted);
	}

	.feedback :global(.glyph) {
		font-size: 1.5rem;
		font-weight: 900;
	}

	.segments {
		font-weight: 800;
		letter-spacing: 0.02em;
	}

	.segment.wrong {
		padding: 0 0.1em;
		color: #fff;
		background: var(--color-error);
		border-radius: 4px;
	}

	@media (min-width: 900px) {
		.feedback {
			grid-template-columns: 1fr auto;
			align-items: center;
			gap: 2rem;
		}

		.continue {
			min-width: 12rem;
		}
	}
</style>
