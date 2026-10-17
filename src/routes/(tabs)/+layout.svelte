<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import TabBar from '#lib/ui/TabBar.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// The path gets a second column (progress, free review, exam) on very wide screens.
	const wide = $derived(
		page.url.pathname.replace(/\/$/, '') === resolve('/(tabs)').replace(/\/$/, '')
	);
</script>

<main class={{ wide }}>
	{@render children()}
</main>
<TabBar />

<style>
	main {
		max-width: var(--column-width);
		margin: 0 auto;
		overflow-x: clip;
		padding: 1.5rem 1rem calc(var(--tab-bar-height) + env(safe-area-inset-bottom) + 2rem);
	}

	/* Centered in the space right of the sidebar. */
	@media (min-width: 900px) {
		main {
			--content-width: var(--column-width);
			max-width: var(--content-width);
			margin-left: calc(
				var(--sidebar-width) + max(0px, (100% - var(--sidebar-width) - var(--content-width)) / 2)
			);
			padding: 1.5rem 0 3rem;
		}
	}

	@media (min-width: 1200px) {
		main.wide {
			--content-width: calc(var(--column-width) + 3rem + var(--rail-width));
		}
	}
</style>
