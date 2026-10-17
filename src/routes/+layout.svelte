<script lang="ts">
	import '@fontsource-variable/sofia-sans';
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { m } from '#lib/i18n/index.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{m.app.name}</title>
	<meta name="description" content={m.app.tagline} />
</svelte:head>

{@render children()}
