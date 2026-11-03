import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
// Not 3000, so a running `npm run dev` does not get in the way.
const API_PORT = '3100';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	// Tests run against the production build, with the API on its own fresh database
	// (apps/api/src/e2e-server.ts); Vite's preview server forwards /api to it.
	webServer: [
		{
			command: 'npm run build && npm run preview',
			port: 4173,
			env: { API_PORT },
			reuseExistingServer: !isCI
		},
		{
			command: 'npm run e2e -w @cyrilingo/api',
			url: `http://localhost:${API_PORT}/api/health`,
			env: { API_PORT, PUBLIC_URL: 'http://localhost:4173' },
			// Never a development API: it would answer for another origin and database.
			reuseExistingServer: false
		}
	],
	// Supported browsers (spec §10): Chrome/Edge, Firefox, Safari, plus mobile-first viewports.
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
		{ name: 'mobile-safari', use: { ...devices['iPhone 14'] } }
	]
});
