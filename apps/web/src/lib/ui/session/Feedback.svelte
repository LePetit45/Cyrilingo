<script lang="ts">
	import type { Question } from '@cyrilingo/core/engine/questions.js';
	import { answerRuns, type ReadingCheck } from '@cyrilingo/core/reading.js';
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
	import AddToListDialog from '../lists/AddToListDialog.svelte';
	import { account } from '../state/account.svelte.js';
	import { isWord } from '@cyrilingo/core/content/corpus.js';
	import type { ReadAloudResult } from './read-aloud.js';

	// Colored panel at the bottom of the screen after each answer (spec §5.3): the right answer, the
	// wrong letters and, after a reading, the word with the letter being learned underlined, and its
	// translation. The recording of the letter or reading plays as the panel opens.
	let {
		question,
		correct,
		dontKnow,
		check,
		speech,
		onretry,
		oncontinue
	}: {
		question: Question;
		correct: boolean;
		dontKnow: boolean;
		/** Result of a typed reading answer. */
		check?: ReadingCheck;
		/** Verdict of a read-aloud try (SPEC.md › The model feature). */
		speech?: ReadAloudResult;
		/** Set when a failed read-aloud try leaves a second one: « Réessayer » replaces Continue. */
		onretry?: () => void;
		oncontinue: () => void;
	} = $props();

	const praise = m.feedback.correct[Math.floor(Math.random() * m.feedback.correct.length)];
	const tone = $derived(speech?.outcome === 'unavailable' ? 'info' : correct ? 'correct' : 'wrong');
	const title = $derived(
		correct
			? praise
			: speech?.outcome === 'unavailable'
				? m.feedback.unavailableTitle
				: speech?.outcome === 'not_understood'
					? m.feedback.notHeard
					: dontKnow
						? m.feedback.dontKnow
						: m.feedback.wrong
	);
	/** The word of a reading or read-aloud question. */
	const word = $derived(
		question.kind === 'reading'
			? question.reading
			: question.kind === 'readAloud'
				? question.word
				: undefined
	);

	// Focus Continue, so Enter (or Space) moves on with the button's own behavior and keyboard
	// users land on the next action. Without scrolling: the panel is still sliding in from below
	// the screen, and the browser would scroll the page down to the button, then snap it back.
	let continueArea: HTMLElement | undefined = $state();
	let addingToList = $state(false);
	/** Words of a reading can go to a personal list, for signed-in learners (AC-35). */
	const listWord = $derived(account.signedIn && word && isWord(word) ? word : undefined);
	$effect(() => {
		continueArea?.querySelector('button')?.focus({ preventScroll: true });
	});
</script>

<section class={['feedback', tone]} aria-labelledby="feedback-title">
	<div class="details">
		<p class="title" id="feedback-title">
			<span class="verdict-icon" aria-hidden="true"
				><Icon name={correct ? 'check' : tone === 'info' ? 'mic' : 'close'} size={20} /></span
			>{title}
		</p>

		{#if word}
			<div class="reading">
				<HighlightedReading reading={word} letter={question.letter} />
				<AudioButton name={word} autoplay />
			</div>
			{#if speech?.outcome === 'mismatch'}
				<p class="heard">
					{m.feedback.heard}
					<Cyrillic class="heard-text">{speech.heard}</Cyrillic>
				</p>
			{:else if speech?.outcome === 'not_understood'}
				<p class="hint">{m.feedback.notHeardHint}</p>
			{:else if speech?.outcome === 'unavailable'}
				<p class="hint">{m.feedback.unavailable[speech.reason]}</p>
			{/if}
			{#if !correct && speech?.outcome !== 'unavailable'}
				<p class="answer">
					{m.feedback.answer}
					<strong>{phoneticReading(word)}</strong>
					{#if officialTransliteration(word) !== phoneticReading(word)}
						<span class="official">({officialTransliteration(word)})</span>
					{/if}
				</p>
				{#if speech && !onretry}
					<p class="hint">{m.feedback.passed}</p>
				{/if}
				{#if check?.letters}
					<p class="typed">
						{m.feedback.yourAnswer}
						<span class="runs"
							>{#each answerRuns(check.letters) as run, index (index)}<span
									class={['run', { wrong: !run.correct, missing: !run.text }]}>{run.text}</span
								>{/each}</span
						>
					</p>
				{/if}
			{/if}
			{#if translationOf(word)}
				<p class="meaning">{m.feedback.meaning} {translationOf(word)}</p>
			{/if}
			{#if listWord}
				<button type="button" class="add" onclick={() => (addingToList = true)}>
					<Icon name="plus" size={18} />{m.lists.addToList}
				</button>
				<AddToListDialog bind:open={addingToList} word={listWord} />
			{/if}
		{:else if question.kind === 'letterToSound' || question.kind === 'soundToLetter'}
			<!-- The letter's sound, right or wrong: the question could not play it without giving the
			     answer away. -->
			<div class="letter">
				<p class="answer">
					<Cyrillic class="glyph">{letterGlyph(question.letter)}</Cyrillic>
					→ <strong>« {phoneticOf(question.letter)} »</strong>
					{#if officialOf(question.letter) !== phoneticOf(question.letter)}
						<span class="official">({officialOf(question.letter)})</span>
					{/if}
				</p>
				<AudioButton name={question.letter} autoplay />
			</div>
		{/if}
	</div>

	<div class="continue" bind:this={continueArea}>
		<!-- The second click of a double click on « Vérifier », which sat here, must not skip the
		     feedback. -->
		<Button
			variant={correct ? 'success' : tone === 'info' ? 'accent' : 'danger'}
			wide
			onclick={(event) => {
				if (event.detail > 1) return;
				if (onretry) onretry();
				else oncontinue();
			}}
		>
			{onretry ? m.feedback.retry : m.common.continue}
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

	.info {
		--tone: var(--color-accent-dark);
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

	.letter {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.answer,
	.typed,
	.meaning,
	.heard,
	.hint {
		color: var(--color-text);
	}

	.feedback :global(.heard-text) {
		font-size: 1.25rem;
		font-weight: 900;
		color: var(--tone);
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

	.runs {
		font-weight: 800;
		letter-spacing: 0.02em;
	}

	.run.wrong {
		padding: 0 0.15em;
		margin: 0 0.05em;
		color: #fff;
		background: var(--color-error);
		border-radius: 4px;
	}

	/* Letters left out: a narrow empty mark where they belong. */
	.run.missing {
		display: inline-block;
		width: 0.5em;
		height: 1em;
		padding: 0;
		vertical-align: -0.15em;
	}

	.add {
		display: inline-flex;
		align-items: center;
		justify-self: start;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.9375rem;
		font-weight: 800;
		color: var(--tone);
		background: var(--color-surface);
		border: 2px solid currentColor;
		border-radius: var(--radius-sm);
		cursor: pointer;
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
