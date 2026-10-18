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
	import BottomBar from '../BottomBar.svelte';
	import Button from '../Button.svelte';
	import Cyrillic from '../Cyrillic.svelte';
	import { letterGlyph, phoneticOf, soundChoiceText } from '../letters.js';
	import { app } from '../state/app.svelte.js';
	import ChoiceButtons, { type Choice } from './ChoiceButtons.svelte';
	import Feedback from './Feedback.svelte';
	import ReadingInput from './ReadingInput.svelte';
	import SessionHeader from './SessionHeader.svelte';

	// Plays a list of questions (spec §4.5): lessons and free review repeat missed questions until
	// each one is answered correctly; the exam counts every answer once.
	let {
		questions,
		repeatMisses,
		quitTitle,
		quitMessage,
		onfinish
	}: {
		questions: readonly Question[];
		repeatMisses: boolean;
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
		revealAnswer();
		if (!next.correct) {
			vibrateWrong();
			shaking = true;
		}
	}

	// The feedback panel covers the bottom of the screen: on short screens, scroll so the answers
	// end just above it. Two frames let the space kept for the taller panel settle first.
	function revealAnswer() {
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
				window.scrollTo({
					top: document.documentElement.scrollHeight,
					behavior: reduce ? 'auto' : 'smooth'
				});
			})
		);
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
		window.scrollTo({ top: 0 });
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

	<!-- The actions, replaced by the feedback once answered. -->
	{#if result}
		<BottomBar tone={result.correct ? 'correct' : 'wrong'}>
			<Feedback
				{question}
				correct={result.correct}
				dontKnow={result.dontKnow}
				check={result.check}
				oncontinue={next}
			/>
		</BottomBar>
	{:else}
		<BottomBar actions>
			<Button variant="secondary" class="side" onclick={dontKnow}>{m.question.dontKnow}</Button>
			{#if question.kind === 'reading'}
				<Button class="grow" disabled={!canCheck} onclick={submitReading}>{m.question.check}</Button
				>
			{/if}
		</BottomBar>
	{/if}
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

	/* Short phone screens: more room for the feedback panel. */
	@media (max-height: 700px) {
		.shown {
			min-height: 6rem;
		}

		.letter {
			font-size: 4.75rem;
		}
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
