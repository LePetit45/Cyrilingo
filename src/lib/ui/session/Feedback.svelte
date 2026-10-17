<script lang="ts">
	import type { BulgarianLetter } from '#lib/core/alphabet.js';
	import type { Question } from '#lib/core/engine/questions.js';
	import type { ReadingCheck } from '#lib/core/reading.js';
	import { content } from '#lib/i18n/content/index.js';
	import { m } from '#lib/i18n/index.js';
	import AudioButton from '../AudioButton.svelte';
	import Button from '../Button.svelte';
	import Cyrillic from '../Cyrillic.svelte';
	import {
		letterGlyph,
		officialOf,
		officialTransliteration,
		phoneticOf,
		phoneticReading,
		translationOf
	} from '../letters.js';
	import StressedWord from '../StressedWord.svelte';

	// Shown after each answer (spec §5.3): the right answer, the wrong letters, a mnemonic reminder
	// (not during the exam) and, after a reading, the translation with the stressed vowel.
	let {
		question,
		correct,
		dontKnow,
		check,
		missedLetters,
		showMnemonics,
		oncontinue
	}: {
		question: Question;
		correct: boolean;
		dontKnow: boolean;
		/** Result of a typed reading answer. */
		check?: ReadingCheck;
		missedLetters: readonly BulgarianLetter[];
		showMnemonics: boolean;
		oncontinue: () => void;
	} = $props();

	const praise = m.feedback.correct[Math.floor(Math.random() * m.feedback.correct.length)];
	const title = $derived(correct ? praise : dontKnow ? m.feedback.dontKnow : m.feedback.wrong);
	const reminders = $derived(correct || !showMnemonics ? [] : missedLetters.slice(0, 2));

	let continueButton: HTMLElement | undefined = $state();
	$effect(() => {
		continueButton?.focus();
	});

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || event.defaultPrevented || event.repeat) return;
		event.preventDefault();
		oncontinue();
	}
</script>

<svelte:window {onkeydown} />

<div class={['feedback', correct ? 'correct' : 'wrong']} role="status">
	<p class="title">{title}</p>

	{#if question.kind === 'reading'}
		<div class="reading">
			<StressedWord reading={question.reading} />
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

	{#each reminders as letter (letter)}
		<p class="reminder">
			<span class="reminder-label">{m.feedback.reminder}</span>
			<Cyrillic class="glyph">{letterGlyph(letter)}</Cyrillic>
			{content.letters[letter].emoji ?? ''}
			{content.letters[letter].mnemonic}
		</p>
	{/each}

	<div class="continue" bind:this={continueButton} tabindex="-1">
		<Button variant={correct ? 'success' : 'danger'} wide onclick={oncontinue}>
			{m.common.continue}
		</Button>
	</div>
</div>

<style>
	.feedback {
		--tone: var(--color-success-dark);
		--tone-bg: var(--color-success-light);

		display: grid;
		gap: 0.5rem;
		position: sticky;
		bottom: 0;
		z-index: 1;
		margin: 1rem -1rem calc(-1rem - env(safe-area-inset-bottom));
		padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
		color: var(--tone);
		background: var(--tone-bg);
		border-top: 3px solid currentColor;
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		animation: slide-up 220ms cubic-bezier(0.2, 1.2, 0.5, 1);
	}

	.wrong {
		--tone: var(--color-error-dark);
		--tone-bg: var(--color-error-light);
	}

	p {
		margin: 0;
	}

	.title {
		font-size: 1.5rem;
		font-weight: 900;
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

	.reminder {
		padding: 0.5rem 0.75rem;
		font-size: 0.9375rem;
		color: var(--color-text);
		background: rgb(255 255 255 / 0.7);
		border-radius: var(--radius-sm);
	}

	.reminder-label {
		margin-right: 0.25rem;
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.continue {
		margin-top: 0.5rem;
		outline: none;
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
	}
</style>
