<script lang="ts" module>
	// Small inline icon set (24×24, stroked), so no icon font or extra request is needed.
	const PATHS = {
		path: 'M6 20c0-4 4-4 4-8s-4-4-4-8M18 20c0-4-4-4-4-8s4-4 4-8M9 7h6M8 12h8M9 17h6',
		alphabet: 'M4 19 8.5 5h1L14 19M5.5 14h7M16 9h4l-4 10h4',
		settings:
			'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
		close: 'M6 6l12 12M18 6 6 18',
		check: 'm5 12.5 4.5 4.5L19 7.5',
		star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z',
		crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z',
		speaker: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5ZM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
		backspace: 'M21 5H9l-6 7 6 7h12V5ZM12 9l6 6M18 9l-6 6',
		back: 'M15 5l-7 7 7 7',
		play: 'M7 4.5v15l12-7.5-12-7.5Z',
		refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7'
	} as const;

	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let { name, size = 24, label }: { name: IconName; size?: number; label?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	<path d={PATHS[name]} />
</svg>
