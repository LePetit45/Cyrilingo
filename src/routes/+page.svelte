<script lang="ts">
	import { BULGARIAN_ALPHABET, toLowercase } from '#lib/core/alphabet.js';
	import { m } from '#lib/i18n/index.js';
	import Cyrillic from '#lib/ui/Cyrillic.svelte';
</script>

<main>
	<header>
		<h1>{m.app.name}</h1>
		<p class="tagline">{m.app.tagline}</p>
	</header>

	<section aria-labelledby="alphabet-heading">
		<h2 id="alphabet-heading">{m.home.alphabetHeading}</h2>
		<ul class="alphabet">
			{#each BULGARIAN_ALPHABET as letter (letter)}
				<li><Cyrillic>{letter}{toLowercase(letter)}</Cyrillic></li>
			{/each}
		</ul>
	</section>

	<p class="coming-soon">{m.home.comingSoon}</p>
</main>

<style>
	main {
		max-width: var(--column-width);
		margin: 0 auto;
		padding: 2rem 1rem 3rem;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0;
		font-size: 3rem;
		font-weight: 900;
		letter-spacing: -0.02em;
		color: var(--color-primary);
		text-shadow: 0 4px 0 var(--color-primary-dark);
	}

	.tagline {
		margin: 0.75rem 0 0;
		font-size: 1.25rem;
		color: var(--color-text-muted);
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 800;
		text-align: center;
	}

	.alphabet {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.alphabet li {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		font-size: 1.75rem;
		font-weight: 700;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-bottom-width: 5px;
		border-radius: var(--radius-md);
	}

	.coming-soon {
		margin-top: 2rem;
		text-align: center;
		color: var(--color-text-muted);
	}
</style>
