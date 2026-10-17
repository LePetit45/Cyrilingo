<script lang="ts">
	import { m } from '#lib/i18n/index.js';
	import Confetti from './Confetti.svelte';
	import Cyrillic from './Cyrillic.svelte';
	import Icon from './Icon.svelte';

	// Diploma shown after passing the final exam (spec §4.6). The first name is only displayed,
	// never saved.
	let name = $state('');
	const today = new Date();
</script>

<Confetti />

<article class="diploma" aria-labelledby="diploma-heading">
	<p class="school">{m.diploma.school}</p>
	<h1 id="diploma-heading">{m.diploma.heading}</h1>
	<p class="small">{m.diploma.awardedTo}</p>
	<p class="name">{name.trim() || m.diploma.defaultName}</p>
	<p class="small">{m.diploma.theTitle}</p>
	<p class="title">{m.diploma.title}</p>
	<div class="footer">
		<span class="date">{m.diploma.date(today)}</span>
		<span class="seal" aria-hidden="true"><Icon name="crown" size={34} /></span>
		<Cyrillic class="signature">{m.diploma.signature}</Cyrillic>
	</div>
</article>

<label class="field">
	<span>{m.diploma.nameLabel}</span>
	<input
		type="text"
		bind:value={name}
		maxlength="30"
		placeholder={m.diploma.namePlaceholder}
		autocomplete="given-name"
		spellcheck="false"
	/>
</label>

<style>
	.diploma {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 0.375rem;
		padding: 2rem 1.25rem 1.5rem;
		text-align: center;
		background: radial-gradient(circle at 50% 0%, #fffdf5, #fff1c9);
		border: 3px solid var(--color-gold);
		outline: 2px solid var(--color-gold);
		outline-offset: -10px;
		border-radius: var(--radius-lg);
		box-shadow: 0 6px 0 var(--color-gold-dark);
		animation: unroll 700ms cubic-bezier(0.2, 1.3, 0.4, 1);
	}

	p {
		margin: 0;
	}

	.school {
		font-size: 0.875rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-gold-dark);
	}

	h1 {
		margin: 0.25rem 0 0.5rem;
		font-size: 2.5rem;
		letter-spacing: 0.04em;
		color: var(--color-primary);
		text-shadow: 0 3px 0 var(--color-primary-dark);
	}

	.small {
		font-style: italic;
		color: var(--color-text-muted);
	}

	.name {
		max-width: 100%;
		font-size: 2.25rem;
		font-weight: 900;
		overflow-wrap: anywhere;
		border-bottom: 2px dashed var(--color-gold);
	}

	.title {
		font-size: 1.5rem;
		font-weight: 900;
		line-height: 1.2;
		color: var(--color-newcomers-dark);
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.seal {
		display: grid;
		place-items: center;
		width: 4rem;
		height: 4rem;
		color: #fff;
		background: var(--color-error);
		border-radius: 50%;
		box-shadow:
			0 0 0 4px #ffb4ae,
			0 4px 0 4px var(--color-error-dark);
		transform: rotate(-12deg);
	}

	.footer :global(.signature) {
		font-size: 1.25rem;
		font-style: italic;
		font-weight: 800;
	}

	.field {
		display: grid;
		gap: 0.375rem;
		margin-top: 1.5rem;
		font-weight: 700;
	}

	input {
		min-height: 3.25rem;
		padding: 0.5rem 1rem;
		font: inherit;
		font-size: 1.25rem;
		background: var(--color-surface);
		border: 2px solid var(--color-border-dark);
		border-radius: var(--radius-md);
	}

	input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	@keyframes unroll {
		from {
			transform: scale(0.6) rotate(-4deg);
			opacity: 0;
		}
	}
</style>
