<script lang="ts">
	import { toLowercase, type BulgarianLetter } from '#lib/core/alphabet.js';
	import { CARD_EXAMPLES } from '#lib/core/content/corpus.js';
	import { LETTERS } from '#lib/core/content/letters.js';
	import { content } from '#lib/i18n/content/index.js';
	import { m } from '#lib/i18n/index.js';
	import AudioButton from './AudioButton.svelte';
	import Cyrillic from './Cyrillic.svelte';
	import { officialOf, phoneticOf, phoneticReading, translationOf } from './letters.js';
	import StressedWord from './StressedWord.svelte';

	// Letter discovery card (spec §5.1): glyphs, sound, both transliterations, mnemonic, examples
	// and notes. Used in lessons and on the alphabet screen.
	let { letter, eyebrow = m.card.letter }: { letter: BulgarianLetter; eyebrow?: string } = $props();

	const data = $derived(LETTERS[letter]);
	const text = $derived(content.letters[letter]);
	const lower = $derived(toLowercase(letter));
	const official = $derived(officialOf(letter));
</script>

<article class="card" aria-labelledby="card-{letter}">
	<p class="eyebrow">{eyebrow}</p>
	<h2 id="card-{letter}" class="glyphs">
		<Cyrillic>{letter}</Cyrillic>
		<Cyrillic>{lower}</Cyrillic>
	</h2>
	{#if data.taughtAs}
		<p class="taught-as"><Cyrillic>{data.taughtAs}</Cyrillic></p>
	{/if}

	<div class="sound">
		<span class="label">{m.card.readAs}</span>
		<span class="phonetic">« {phoneticOf(letter)} »</span>
		{#if official !== phoneticOf(letter)}
			<span class="official">{m.card.official} : {official}</span>
		{/if}
		<AudioButton name={letter} autoplay />
	</div>

	<section>
		<h3>{m.card.sound}</h3>
		<p>{text.sound}</p>
	</section>

	<section class="mnemonic">
		<h3>{m.card.mnemonic}</h3>
		<p>
			{#if text.emoji}<span class="emoji" aria-hidden="true">{text.emoji}</span>{/if}
			{text.mnemonic}
		</p>
	</section>

	<section>
		<h3>{m.card.examples}</h3>
		<ul class="examples">
			{#each CARD_EXAMPLES[letter] as word (word)}
				<li>
					<StressedWord reading={word} />
					<span class="translit">{phoneticReading(word)}</span>
					<span class="translation">{translationOf(word)}</span>
				</li>
			{/each}
		</ul>
	</section>

	{#if text.note || data.distinctBulgarianLowercase}
		<section class="note">
			<h3>{m.card.note}</h3>
			{#if text.note}<p>{text.note}</p>{/if}
			{#if data.distinctBulgarianLowercase}
				<p class="standard">
					{m.card.standardShape}
					<span class="standard-glyph" lang="ru">{lower}</span>
				</p>
			{/if}
		</section>
	{/if}
</article>

<style>
	.card {
		display: grid;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 5px 0 var(--color-border-dark);
	}

	.eyebrow {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-align: center;
		color: var(--color-primary-dark);
	}

	.glyphs {
		display: flex;
		justify-content: center;
		align-items: baseline;
		gap: 1.25rem;
		margin: 0;
		font-size: 5.5rem;
		line-height: 1;
	}

	.taught-as {
		margin: -0.5rem 0 0;
		font-size: 2.25rem;
		font-weight: 900;
		text-align: center;
		color: var(--color-accent-dark);
	}

	.sound {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.25rem 0.75rem;
		padding: 0.75rem;
		background: var(--color-surface-muted);
		border-radius: var(--radius-md);
	}

	.label {
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.phonetic {
		font-size: 1.75rem;
		font-weight: 900;
		color: var(--color-primary-dark);
	}

	.official {
		font-size: 0.9375rem;
		color: var(--color-text-muted);
	}

	section {
		display: grid;
		gap: 0.25rem;
	}

	h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	p {
		margin: 0;
	}

	.mnemonic p {
		font-weight: 700;
	}

	.emoji {
		margin-right: 0.25rem;
		font-size: 1.5rem;
		vertical-align: -0.15em;
	}

	.examples {
		display: grid;
		gap: 0.375rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.examples li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 0.625rem;
		font-size: 1.375rem;
		font-weight: 800;
	}

	.translit {
		font-size: 1rem;
		color: var(--color-primary-dark);
	}

	.translation {
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.translation::before {
		content: '· ';
	}

	.note {
		padding: 0.75rem;
		font-size: 0.9375rem;
		background: var(--color-accent-light);
		border-radius: var(--radius-md);
	}

	.standard-glyph {
		font-size: 1.75rem;
		font-weight: 800;
		vertical-align: -0.1em;
	}
</style>
