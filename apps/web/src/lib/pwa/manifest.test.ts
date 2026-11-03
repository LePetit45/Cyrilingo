import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BACKGROUND_COLOR, THEME_COLOR, webManifest } from './manifest.js';

const appCss = readFileSync(new URL('../../app.css', import.meta.url), 'utf8');
const cssToken = (name: string) => appCss.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1];

describe('web app manifest', () => {
	it('uses the design tokens from app.css', () => {
		expect(THEME_COLOR).toBe(cssToken('color-primary'));
		expect(BACKGROUND_COLOR).toBe(cssToken('color-bg'));
	});

	it('has the icons required to be installable', () => {
		const icons = webManifest.icons.map(({ sizes, purpose }) => `${sizes} ${purpose}`);
		expect(icons).toEqual(['192x192 any', '512x512 any', '512x512 maskable']);
		for (const icon of webManifest.icons) expect(icon.src).toMatch(/\.png$/);
	});
});
