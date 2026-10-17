import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

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
	// Tests run against the production build, as deployed on Cloudflare Pages.
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !isCI
	},
	// Supported browsers (spec §10): Chrome/Edge, Firefox, Safari, plus mobile-first viewports.
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
		{ name: 'mobile-safari', use: { ...devices['iPhone 14'] } }
	]
});
