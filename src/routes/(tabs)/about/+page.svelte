<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.js';
	import Icon from '#lib/ui/Icon.svelte';
	import { version } from '../../../../package.json';
</script>

<a class="back" href={resolve('/(tabs)/settings')}><Icon name="back" size={20} />{m.about.back}</a>

<h1>{m.about.title}</h1>
{#each m.about.paragraphs as paragraph, index (index)}
	<p>{paragraph}</p>
{/each}
<p class="version">{m.about.version(version)}</p>

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		text-decoration: none;
	}

	h1 {
		margin: 1rem 0;
		font-size: 2rem;
	}

	.version {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
