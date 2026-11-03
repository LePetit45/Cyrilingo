<script lang="ts">
	import '@fontsource-variable/nunito';
	import '@fontsource-variable/sofia-sans';
	import '../app.css';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import favicon from '#lib/assets/favicon.svg';
	import { m } from '#lib/i18n/index.js';
	import { appleTouchIcon, THEME_COLOR } from '#lib/pwa/manifest.js';
	import { account } from '#lib/ui/state/account.svelte.js';
	import { progressSync } from '#lib/ui/state/progress-sync.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// A device that signed in checks its session and syncs its progress at start, and syncs again
	// whenever it gets back online; a guest's sends nothing (AC-8).
	onMount(() => {
		void account.refresh();
		void progressSync.sync();
	});
</script>

<svelte:window ononline={() => void progressSync.sync()} />

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href={appleTouchIcon} />
	<link rel="manifest" href={resolve('/manifest.webmanifest')} />
	<meta name="theme-color" content={THEME_COLOR} />
	<title>{m.app.name}</title>
	<meta name="description" content={m.app.tagline} />
</svelte:head>

{@render children()}
