<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/i18n/index.js';
	import Icon, { type IconName } from './Icon.svelte';

	// Bottom tab bar (spec §7.2), hidden during lessons, free review and the exam.
	const tabs: { href: string; label: string; icon: IconName; matches: string[] }[] = [
		{ href: resolve('/(tabs)'), label: m.nav.path, icon: 'path', matches: [resolve('/(tabs)')] },
		{
			href: resolve('/(tabs)/alphabet'),
			label: m.nav.alphabet,
			icon: 'alphabet',
			matches: [resolve('/(tabs)/alphabet')]
		},
		{
			href: resolve('/(tabs)/settings'),
			label: m.nav.settings,
			icon: 'settings',
			matches: [resolve('/(tabs)/settings'), resolve('/(tabs)/about')]
		}
	];

	const isActive = (matches: string[]) =>
		matches.some((path) => page.url.pathname.replace(/\/$/, '') === path.replace(/\/$/, ''));
</script>

<nav aria-label={m.nav.label}>
	<ul>
		{#each tabs as tab (tab.href)}
			<li>
				<!-- eslint-disable svelte/no-navigation-without-resolve -- hrefs are resolved above -->
				<a
					href={tab.href}
					class={{ active: isActive(tab.matches) }}
					aria-current={isActive(tab.matches) ? 'page' : undefined}
				>
					<Icon name={tab.icon} size={26} />
					<span>{tab.label}</span>
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</li>
		{/each}
	</ul>
</nav>

<style>
	nav {
		position: fixed;
		inset: auto 0 0;
		z-index: 10;
		background: var(--color-surface);
		border-top: 2px solid var(--color-border);
		padding-bottom: env(safe-area-inset-bottom);
	}

	ul {
		display: flex;
		max-width: var(--column-width);
		height: var(--tab-bar-height);
		margin: 0 auto;
		padding: 0 0.5rem;
		list-style: none;
	}

	li {
		flex: 1;
	}

	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.125rem;
		height: 100%;
		margin: 0 0.25rem;
		font-size: 0.8125rem;
		font-weight: 800;
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-muted);
		border-radius: var(--radius-md);
	}

	a.active {
		color: var(--color-primary);
	}

	a.active :global(svg) {
		transform: scale(1.1);
	}
</style>
