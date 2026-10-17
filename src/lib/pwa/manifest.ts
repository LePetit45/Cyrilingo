// Web app manifest, served as /manifest.webmanifest (spec §10: installable PWA).
// Icons are rendered from favicon.svg by `npm run icons`.
import appleTouchIcon from '#lib/assets/icons/apple-touch-icon.png';
import icon192 from '#lib/assets/icons/icon-192.png';
import icon512 from '#lib/assets/icons/icon-512.png';
import iconMaskable512 from '#lib/assets/icons/icon-maskable-512.png';
import { m } from '#lib/i18n/index.js';

// Must match --color-primary and --color-bg in src/app.css (checked by a unit test).
export const THEME_COLOR = '#f54e28';
export const BACKGROUND_COLOR = '#fff8ec';

export { appleTouchIcon };

export const webManifest = {
	// Relative URLs resolve against the manifest's own URL, so they follow the base path.
	id: './',
	start_url: './',
	scope: './',
	name: m.app.name,
	short_name: m.app.name,
	description: m.app.tagline,
	lang: 'fr',
	dir: 'ltr',
	display: 'standalone',
	theme_color: THEME_COLOR,
	background_color: BACKGROUND_COLOR,
	icons: [
		{ src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
		{ src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
		{ src: iconMaskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
	]
};
