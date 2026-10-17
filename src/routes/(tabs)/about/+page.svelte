<script lang="ts">
	import { resolve } from '$app/paths';
	import logo from '#lib/assets/favicon.svg';
	import { m } from '#lib/i18n/index.js';
	import Icon from '#lib/ui/Icon.svelte';
	import { version } from '../../../../package.json';
</script>

<svelte:head>
	<title>{m.about.title} · {m.app.name}</title>
</svelte:head>

<header>
	<a class="back" href={resolve('/(tabs)/settings')} aria-label={m.about.back}>
		<Icon name="back" size={28} />
	</a>
	<h1>{m.about.title}</h1>
</header>

<div class="brand">
	<img src={logo} alt="" width="64" height="64" />
	<div>
		<p class="name">{m.app.name}</p>
		<p class="version">{m.about.version(version)}</p>
	</div>
</div>

{#each m.about.paragraphs as paragraph, index (index)}
	<p>{paragraph}</p>
{/each}

<style>
	header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin: 0 0 1.5rem -0.75rem;
	}

	.back {
		display: grid;
		flex: none;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		color: var(--color-text-muted);
		border-radius: 50%;
	}

	.back:hover {
		background: var(--color-surface-muted);
	}

	h1 {
		margin: 0;
		font-size: 2rem;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1rem 1.25rem;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--color-border-dark);
	}

	.brand img {
		flex: none;
		border-radius: var(--radius-md);
		box-shadow: 0 4px 0 var(--color-primary-dark);
	}

	.brand p {
		margin: 0;
	}

	.name {
		font-size: 1.5rem;
		font-weight: 900;
		color: var(--color-primary-dark);
	}

	.version {
		font-weight: 700;
		color: var(--color-text-muted);
	}

	p {
		line-height: 1.5;
	}
</style>
