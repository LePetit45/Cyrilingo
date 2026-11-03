<script lang="ts">
	import type { Snippet } from 'svelte';

	// Every piece of Bulgarian text goes through this component so it is tagged lang="bg",
	// which keeps the Bulgarian lowercase shapes (spec D2) in fonts that localize Cyrillic.
	let { children, class: className }: { children: Snippet; class?: string } = $props();
</script>

<span lang="bg" class={className}>{@render children()}</span>
