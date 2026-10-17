import type { Page } from '@playwright/test';

interface SavedProgress {
	completedLessons: string[];
	examPassed: boolean;
}

/**
 * Starts the app as a returning learner: the welcome screen was already shown, with the given
 * progress. Runs before any page script, on every navigation of the page.
 */
export async function skipWelcome(
	page: Page,
	progress: SavedProgress = { completedLessons: [], examPassed: false }
) {
	await page.addInitScript((saved) => {
		// Only seed storage once, so changes made by the test survive reloads.
		if (sessionStorage.getItem('e2e-seeded')) return;
		sessionStorage.setItem('e2e-seeded', '1');
		localStorage.setItem(
			'cyrilingo.settings.v1',
			JSON.stringify({ sound: true, soundEffects: true, welcomed: true })
		);
		localStorage.setItem('cyrilingo.progress.v1', JSON.stringify(saved));
	}, progress);
}
