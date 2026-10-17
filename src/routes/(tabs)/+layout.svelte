<script lang="ts">
	import TabBar from '#lib/ui/TabBar.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<main>
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
</style>
