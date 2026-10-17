<script lang="ts">
	import type { BulgarianLetter } from '#lib/core/alphabet.js';
	import { isWord } from '#lib/core/content/corpus.js';
	import { lettersMissed, type Question } from '#lib/core/engine/questions.js';
	import {
		answer,
		createSession,
		currentQuestion,
		isFinished,
		progress,
		summarize,
		type Summary
	} from '#lib/core/engine/session.js';
	import { shuffle } from '#lib/core/random.js';
	import { tick } from 'svelte';
	import { checkReading, type ReadingCheck } from '#lib/core/reading.js';
	import { m } from '#lib/i18n/index.js';
	import { playEffect, vibrateWrong } from '../audio/effects.js';
	import AudioButton from '../AudioButton.svelte';
	import Button from '../Button.svelte';
	import Cyrillic from '../Cyrillic.svelte';
	import { letterGlyph, phoneticOf, soundChoiceText } from '../letters.js';
	import { app } from '../state/app.svelte.js';
	import ChoiceButtons, { type Choice } from './ChoiceButtons.svelte';
	import Feedback from './Feedback.svelte';
	import ReadingInput from './ReadingInput.svelte';
	import SessionHeader from './SessionHeader.svelte';

	// Plays a list of questions (spec §4.5): lessons and free review repeat missed questions until
	// each one is answered correctly; the exam counts every answer once and gives no hints.
	let {
		questions,
		repeatMisses,
		showMnemonics = true,
		quitTitle,
		quitMessage,
		onfinish
	}: {
		questions: readonly Question[];
		repeatMisses: boolean;
		showMnemonics?: boolean;
		quitTitle?: string;
		quitMessage?: string;
		onfinish: (summary: Summary) => void;
	} = $props();

	interface Result {
		correct: boolean;
		dontKnow: boolean;
		selectedKey?: string;
		check?: ReadingCheck;
		missedLetters: BulgarianLetter[];
	}

	// The questions of a session never change: the page remounts the player to start over.
	// svelte-ignore state_referenced_locally
	let session = $state(createSession(questions, { repeatMisses }));
	/** Counts questions shown, so a repeated question is a fresh screen with reshuffled choices. */
	let shown = $state(0);
	let result = $state<Result | undefined>();
	let typed = $state('');
	/** Height of the bottom bar, kept free below the question so nothing hides behind it. */
	let footerHeight = $state(0);
	let shaking = $state(false);
	let prompt: HTMLElement | undefined = $state();

	const question = $derived(currentQuestion(session));
	const canCheck = $derived(typed.trim() !== '');

	const choices = $derived.by((): Choice[] => {
		void shown;
		if (!question || question.kind === 'reading') return [];
		const choices: Choice[] =
			question.kind === 'letterToSound'
				? question.choices.map((choice) => ({
						key: 'letter' in choice ? choice.letter : `latin:${choice.latin}`,
						label: soundChoiceText(choice),
						cyrillic: false
					}))
				: question.choices.map((letter) => ({
						key: letter,
						label: letterGlyph(letter),
						cyrillic: true
					}));
		// The engine shuffles choices once; a repeated question must not be answerable by position.
		return shuffle(choices, Math.random);
	});

	function record(next: Omit<Result, 'missedLetters'>) {
		if (!question || result) return;
		result = {
			...next,
			missedLetters: next.correct ? [] : lettersMissed(question, next.check)
		};
		if (app.settings.soundEffects) playEffect(next.correct ? 'correct' : 'wrong');
		if (!next.correct) {
			vibrateWrong();
			shaking = true;
		}
	}

	function choose(key: string) {
		if (!question || question.kind === 'reading') return;
		record({ correct: key === question.letter, dontKnow: false, selectedKey: key });
	}

	function submitReading() {
		if (!question || question.kind !== 'reading' || !canCheck) return;
		const check = checkReading(question.reading, typed);
		record({ correct: check.correct, dontKnow: false, check });
	}

	function dontKnow(event: MouseEvent) {
		// "Je ne sais pas" sits where Continue was: the second click of a double click or double
		// tap on Continue must not answer the next question.
		if (event.detail > 1) return;
		record({ correct: false, dontKnow: true });
	}

	async function next() {
		if (!result) return;
		session = answer(session, result);
		result = undefined;
		typed = '';
		shaking = false;
		shown++;
		if (isFinished(session)) {
			onfinish(summarize(session));
			return;
		}
		// Move focus to the new question, as the Continue button that had it is gone. A reading
		// on a desktop focuses its text field instead.
		await tick();
		if (
			currentQuestion(session)?.kind !== 'reading' ||
			!document.querySelector('#reading-answer')
		) {
			prompt?.focus({ preventScroll: true });
		}
	}
</script>

<SessionHeader progress={progress(session)} {quitTitle} {quitMessage} />

<p class="visually-hidden" role="status">
	{result ? (result.correct ? m.feedback.announceCorrect : m.feedback.announceWrong) : ''}
</p>

{#if question}
	{#key shown}
		<section class={['question', { shaking }]} onanimationend={() => (shaking = false)}>
			{#if question.kind === 'letterToSound'}
				<h1 class="prompt" tabindex="-1" bind:this={prompt}>{m.question.letterToSound}</h1>
				<p class="shown letter"><Cyrillic>{letterGlyph(question.letter)}</Cyrillic></p>
				<ChoiceButtons
					{choices}
					correctKey={question.letter}
					selectedKey={result?.selectedKey}
					revealed={result !== undefined}
					onchoose={choose}
				/>
			{:else if question.kind === 'soundToLetter'}
				<h1 class="prompt" tabindex="-1" bind:this={prompt}>{m.question.soundToLetter}</h1>
				<div class="shown sound">
					<span>« {phoneticOf(question.letter)} »</span>
					<AudioButton name={question.letter} />
				</div>
				<ChoiceButtons
					{choices}
					correctKey={question.letter}
					selectedKey={result?.selectedKey}
					revealed={result !== undefined}
					onchoose={choose}
				/>
			{:else}
				<h1 class="prompt" tabindex="-1" bind:this={prompt}>
					{isWord(question.reading) ? m.question.readWord : m.question.readSyllable}
				</h1>
				<p class="shown word"><Cyrillic>{question.reading}</Cyrillic></p>
				<div class="input">
					<ReadingInput
						bind:value={typed}
						disabled={result !== undefined}
						onsubmit={submitReading}
					/>
				</div>
			{/if}
		</section>
	{/key}

	<div class="footer-space" style:height="{footerHeight}px"></div>

	<!-- Bottom bar across the whole width: the actions, replaced by the feedback once answered. -->
	<div
		class={['footer', result && (result.correct ? 'correct' : 'wrong')]}
		bind:offsetHeight={footerHeight}
	>
		{#if result}
			<Feedback
				{question}
				correct={result.correct}
				dontKnow={result.dontKnow}
				check={result.check}
				missedLetters={result.missedLetters}
				{showMnemonics}
				oncontinue={next}
			/>
		{:else}
			<div class="actions">
				<Button variant="secondary" class="dont-know" onclick={dontKnow}
					>{m.question.dontKnow}</Button
				>
				{#if question.kind === 'reading'}
					<Button class="check" disabled={!canCheck} onclick={submitReading}
						>{m.question.check}</Button
					>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.question {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1rem;
	}

	.shaking {
		animation: shake 400ms ease-in-out;
	}

	.prompt {
		margin: 0;
		outline: none;
		font-size: 1.375rem;
	}

	.shown {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 8rem;
		margin: 0;
		font-weight: 900;
		line-height: 1.1;
		text-align: center;
	}

	.letter {
		font-size: 6rem;
	}

	.sound {
		font-size: 3.25rem;
		color: var(--color-primary-dark);
	}

	.word {
		font-size: clamp(2.5rem, 13vw, 4rem);
		overflow-wrap: anywhere;
	}

	.input {
		margin-top: auto;
	}

	@media (min-width: 900px) {
		/* No in-app keyboard here: the text field stays next to the word. */
		.input {
			margin-top: 1rem;
		}
	}

	.footer-space {
		flex: none;
	}

	.footer {
		--footer-width: var(--column-width);
		position: fixed;
		inset: auto 0 0;
		z-index: 5;
		padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
		background: var(--color-bg);
		border-top: 2px solid var(--color-border);
	}

	.footer.correct,
	.footer.wrong {
		background: var(--color-success-light);
		border-top-color: transparent;
		animation: slide-up 220ms cubic-bezier(0.2, 1.2, 0.5, 1);
	}

	.footer.wrong {
		background: var(--color-error-light);
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		max-width: var(--footer-width);
		margin: 0 auto;
	}

	.actions :global(.check) {
		flex: 1;
	}

	/* Dark text on white reads fine smaller, which keeps « Je ne sais pas » on one line. Alone
	   (multiple-choice questions answer on tap), it takes the whole width on phones. */
	.actions :global(.dont-know) {
		flex: 1;
		padding-inline: 1rem;
		font-size: 1rem;
		white-space: nowrap;
	}

	.actions :global(.dont-know:not(:only-child)) {
		flex: none;
	}

	@media (min-width: 900px) {
		.footer {
			--footer-width: 60rem;
			padding-top: 1.5rem;
			padding-bottom: 1.5rem;
		}

		.actions {
			justify-content: space-between;
		}

		.actions :global(.check) {
			flex: 0 0 12rem;
		}

		.actions :global(.dont-know) {
			flex: none;
		}
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
	}

	@keyframes shake {
		20%,
		60% {
			transform: translateX(-8px);
		}
		40%,
		80% {
			transform: translateX(8px);
		}
	}
</style>
