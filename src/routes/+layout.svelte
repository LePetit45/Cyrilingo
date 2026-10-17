<script lang="ts">
	import '@fontsource-variable/sofia-sans';
	import '../app.css';
	import { resolve } from '$app/paths';
	import favicon from '#lib/assets/favicon.svg';
	import { m } from '#lib/i18n/index.js';
	import { appleTouchIcon, THEME_COLOR } from '#lib/pwa/manifest.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href={appleTouchIcon} />
	<link rel="manifest" href={resolve('/manifest.webmanifest')} />
	<meta name="theme-color" content={THEME_COLOR} />
	<title>{m.app.name}</title>
	<meta name="description" content={m.app.tagline} />
</svelte:head>

{@render children()}
