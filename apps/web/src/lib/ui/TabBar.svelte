<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/i18n/index.js';

	// Main navigation (spec §7.2): a bottom tab bar on phones, a left sidebar on wide screens.
	// Hidden during lessons, free review and the exam.
	type Tab = 'path' | 'alphabet' | 'review' | 'more';

	const tabs: { id: Tab; href: string; label: string; matches: string[] }[] = [
		{ id: 'path', href: resolve('/(tabs)'), label: m.nav.path, matches: [resolve('/(tabs)')] },
		{
			id: 'alphabet',
			href: resolve('/(tabs)/alphabet'),
			label: m.nav.alphabet,
			matches: [resolve('/(tabs)/alphabet')]
		},
		{ id: 'review', href: resolve('/(play)/review'), label: m.nav.review, matches: [] },
		{
			id: 'more',
			href: resolve('/(tabs)/settings'),
			label: m.nav.more,
			matches: [resolve('/(tabs)/settings'), resolve('/(tabs)/about')]
		}
	];

	const isActive = (matches: string[]) =>
		matches.some((path) => page.url.pathname.replace(/\/$/, '') === path.replace(/\/$/, ''));
</script>

<nav aria-label={m.nav.label}>
	<p class="logo" aria-hidden="true">{m.app.name}</p>
	<ul>
		{#each tabs as tab (tab.id)}
			<li>
				<!-- eslint-disable svelte/no-navigation-without-resolve -- hrefs are resolved above -->
				<a
					href={tab.href}
					class={{ active: isActive(tab.matches) }}
					aria-current={isActive(tab.matches) ? 'page' : undefined}
				>
					<!-- Colored icons, drawn on a 32×32 grid. -->
					<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
						{#if tab.id === 'path'}
							<path d="M6 15 16 6l10 9v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1Z" fill="#ff9d3d" />
							<path
								d="M4 16 16 5l12 11"
								fill="none"
								stroke="#f25454"
								stroke-width="4"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<rect x="13" y="18" width="6" height="9" rx="1.5" fill="#ffc21a" />
						{:else if tab.id === 'alphabet'}
							<rect x="3" y="5" width="26" height="22" rx="6" fill="#22a7ec" />
							<path
								d="M8 22 11.5 10h1L16 22M9.2 18h5.6M19 12h5M19 12v10h2.5a2.5 2.5 0 0 0 0-5H19"
								fill="none"
								stroke="#fff"
								stroke-width="2.6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{:else if tab.id === 'review'}
							<circle cx="16" cy="16" r="13" fill="#4fc31a" />
							<path
								d="M22 14a6.5 6.5 0 0 0-11.8-2.5M10 18a6.5 6.5 0 0 0 11.8 2.5M10 7.5v4.5h4.5M22 24.5V20h-4.5"
								fill="none"
								stroke="#fff"
								stroke-width="2.6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{:else}
							<circle cx="16" cy="16" r="13" fill="#b874f2" />
							<circle cx="10" cy="16" r="2.2" fill="#fff" />
							<circle cx="16" cy="16" r="2.2" fill="#fff" />
							<circle cx="22" cy="16" r="2.2" fill="#fff" />
						{/if}
					</svg>
					<span class="label">{tab.label}</span>
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

	.logo {
		display: none;
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
		display: grid;
		place-items: center;
		height: calc(100% - 0.75rem);
		margin: 0.375rem 0.375rem;
		text-decoration: none;
		color: var(--color-text-muted);
		border: 2px solid transparent;
		border-radius: var(--radius-md);
	}

	a.active {
		color: var(--color-accent-dark);
		background: var(--color-accent-light);
		border-color: var(--color-accent-border);
	}

	/* Phones show icons only; the label stays for screen readers. */
	.label {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@media (hover: hover) {
		a:not(.active):hover {
			background: var(--color-surface-muted);
		}
	}

	@media (min-width: 900px) {
		nav {
			inset: 0 auto 0 0;
			width: var(--sidebar-width);
			padding: 1.5rem 1rem;
			border-top: none;
			border-right: 2px solid var(--color-border);
		}

		.logo {
			display: block;
			margin: 0 0 1.5rem;
			padding: 0 1rem;
			font-size: 2rem;
			font-weight: 900;
			letter-spacing: -0.02em;
			color: var(--color-primary);
		}

		ul {
			flex-direction: column;
			gap: 0.5rem;
			height: auto;
			padding: 0;
		}

		a {
			display: flex;
			gap: 1.25rem;
			height: auto;
			margin: 0;
			padding: 0.625rem 1rem;
			font-size: 0.9375rem;
			font-weight: 800;
			letter-spacing: 0.06em;
			text-transform: uppercase;
		}

		.label {
			position: static;
			width: auto;
			height: auto;
			overflow: visible;
			clip-path: none;
		}
	}
</style>
