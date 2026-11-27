import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// The app no longer works offline (SPEC.md › D37): src/service-worker only retires the
			// worker earlier versions installed, so new visitors must not register it.
			serviceWorker: { register: false }
		})
	],
	// In development the API runs beside Vite (`npm run dev`); in production Nginx forwards /api
	// and /mcp.
	server: {
		proxy: {
			'/api': `http://localhost:${process.env.API_PORT || 3000}`,
			'/mcp': `http://localhost:${process.env.API_PORT || 3000}`
		}
	},
	build: {
		// Keep icons and audio as separate files (never data URIs): they get content-hashed names
		// under _app/immutable/, cached by the browser for a year, and a recording is downloaded
		// only when it is first played instead of weighing on the JS bundle.
		assetsInlineLimit: (file) => (/\.(png|opus|mp3)$/.test(file) ? false : undefined)
	},
	test: {
		name: 'web',
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
		expect: { requireAssertions: true }
	}
});
