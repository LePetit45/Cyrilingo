<script lang="ts">
	import type { LayoutProps } from './$types';

	// Lessons, free review and the exam take the whole screen, without the tab bar (spec §7.2).
	let { children }: LayoutProps = $props();
</script>

<main>
	{@render children()}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		max-width: var(--column-width);
		min-height: 100dvh;
		margin: 0 auto;
		padding: 0.75rem 1rem calc(1rem + env(safe-area-inset-bottom));
		/* The answer feedback slides in from below: it must not stretch the page while it does. */
		overflow: clip;
	}
</style>
