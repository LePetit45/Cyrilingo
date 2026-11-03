<script lang="ts">
	import { m } from '#lib/i18n/index.js';
	import Button from './Button.svelte';
	import Cyrillic from './Cyrillic.svelte';

	// First launch only (spec §7.2): 3 lines of explanation and a button opening lesson 1.
	let { onstart }: { onstart: () => void } = $props();
</script>

<section class="welcome" aria-labelledby="welcome-title">
	<div class="logo" aria-hidden="true">
		<Cyrillic>Бг</Cyrillic>
	</div>
	<h1 id="welcome-title">{m.welcome.title}</h1>
	<ol>
		{#each m.welcome.lines as line, index (index)}
			<li>{line}</li>
		{/each}
	</ol>
	<Button wide onclick={onstart}>{m.welcome.start}</Button>
</section>

<style>
	.welcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		padding-top: 1.5rem;
		text-align: center;
	}

	.logo {
		display: grid;
		place-items: center;
		width: 7rem;
		height: 7rem;
		font-size: 3.5rem;
		font-weight: 900;
		color: #fff;
		background: var(--color-primary);
		border-radius: 2rem;
		box-shadow: 0 7px 0 var(--color-primary-dark);
		transform: rotate(-6deg);
		animation: wobble 2.4s ease-in-out infinite;
	}

	h1 {
		margin: 0.5rem 0 0;
		font-size: 2rem;
	}

	ol {
		display: grid;
		gap: 0.75rem;
		margin: 0 0 0.5rem;
		padding: 0;
		list-style: none;
		counter-reset: line;
	}

	li {
		padding: 0.875rem 1rem;
		font-weight: 600;
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	@keyframes wobble {
		50% {
			transform: rotate(6deg);
		}
	}
</style>
