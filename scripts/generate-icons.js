// Renders the PWA icons in src/lib/assets/icons/ from src/lib/assets/favicon.svg, using the
// Chromium installed for Playwright. Run `npm run icons` after changing the favicon and commit
// the PNGs.
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const root = new URL('../', import.meta.url);
const svg = await readFile(new URL('src/lib/assets/favicon.svg', root), 'utf8');

const tileColor = svg.match(/<rect[^>]*\bfill="([^"]+)"/)?.[1];
if (!tileColor) throw new Error('Could not find the tile color (<rect fill>) in favicon.svg');

// "any" icons keep the rounded tile on a transparent background. Maskable and Apple icons get
// cropped to the platform's own shape, so they are drawn on a full-bleed tile. Maskable icons
// also shrink the glyph into the safe zone (the centered circle with an 80% diameter).
const icons = [
	{ file: 'icon-192.png', size: 192, scale: 1, background: 'transparent' },
	{ file: 'icon-512.png', size: 512, scale: 1, background: 'transparent' },
	{ file: 'icon-maskable-512.png', size: 512, scale: 0.8, background: tileColor },
	{ file: 'apple-touch-icon.png', size: 180, scale: 1, background: tileColor }
];

const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const browser = await chromium.launch();
const page = await browser.newPage();

for (const { file, size, scale, background } of icons) {
	await page.setViewportSize({ width: size, height: size });
	await page.setContent(
		`<body style="margin:0;height:100vh;display:grid;place-items:center;background:${background}">` +
			`<img src="${src}" style="width:${scale * 100}%;height:${scale * 100}%"></body>`
	);
	await page.locator('img').evaluate((img) => img.decode());
	await page.screenshot({
		path: new URL(`src/lib/assets/icons/${file}`, root).pathname,
		omitBackground: true
	});
	console.log(`Wrote ${file} (${size}×${size})`);
}

await browser.close();
