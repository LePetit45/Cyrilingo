import type { Browser, Page } from '@playwright/test';
import { accountSection, newEmail, signIn, signOut, signUp } from './accounts.js';
import { answerCorrectly } from './answers.js';
import { skipWelcome } from './storage.js';
import { expect, mute, ownClientHeaders, test } from './test.js';

// Progress sync (SPEC.md › Guests and progress sync), with a second browser context as the
// learner's other device.

type Saved = Parameters<typeof skipWelcome>[1];

async function otherDevice(browser: Browser, progress?: Saved): Promise<Page> {
	const page = await (await browser.newContext({ extraHTTPHeaders: ownClientHeaders() })).newPage();
	await mute(page);
	await skipWelcome(page, progress);
	return page;
}

const lessonNode = (page: Page, number: number, state: 'Terminée' | 'À faire maintenant') =>
	page.getByRole('link', { name: new RegExp(`Leçon ${number} .*${state}`) });

/** Plays a lesson to its end; `beforeAnswers` runs once the questions start. */
async function playLesson(page: Page, id: string, beforeAnswers?: () => Promise<void>) {
	await page.goto(`/lesson/${id}`);
	for (let card = 0; card < 3; card++) {
		await page.getByRole('button', { name: /Suivant|Aux questions/ }).click();
	}
	await beforeAnswers?.();
	const done = page.getByRole('heading', { level: 1, name: /^Leçon terminée/ });
	while (!(await done.isVisible())) await answerCorrectly(page);
}

test('[AC-22] merges the device progress into the account at sign-in', async ({
	page,
	browser,
	browserName
}) => {
	const email = newEmail(browserName);
	const other = await otherDevice(browser, { completedLessons: ['l2'], examPassed: false });
	await signUp(other, email);

	await skipWelcome(page, { completedLessons: ['l1'], examPassed: false });
	await signIn(page, email);
	await expect(lessonNode(page, 1, 'Terminée')).toBeVisible();
	await expect(lessonNode(page, 2, 'Terminée')).toBeVisible();

	await other.reload();
	await expect(lessonNode(other, 1, 'Terminée')).toBeVisible();
	await other.context().close();
});

test('[AC-22] opens a new device on the account path, not on the welcome screen', async ({
	page,
	browser,
	browserName
}) => {
	const email = newEmail(browserName);
	const other = await otherDevice(browser, { completedLessons: ['l1'], examPassed: false });
	await signUp(other, email);
	await other.context().close();

	// A first visit: nothing in storage, so the welcome screen shows.
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'C’est parti !' })).toBeVisible();
	await signIn(page, email);
	await expect(page).toHaveURL(/\/$/);
	await expect(lessonNode(page, 1, 'Terminée')).toBeVisible();
	await page.reload();
	await expect(lessonNode(page, 1, 'Terminée')).toBeVisible();
});

test('[AC-23] saves a lesson completed offline to the account at the next sync', async ({
	page,
	context,
	browser,
	browserName
}) => {
	const email = newEmail(browserName);
	await skipWelcome(page);
	await signUp(page, email);
	await playLesson(page, 'l1', () => context.setOffline(true));
	await context.setOffline(false);
	await page.goto('/');
	await expect(lessonNode(page, 1, 'Terminée')).toBeVisible();
	await expect(page.getByRole('status').filter({ hasText: 'Synchronisation' })).toHaveCount(0);

	const other = await otherDevice(browser);
	await signIn(other, email);
	await expect(lessonNode(other, 1, 'Terminée')).toBeVisible();
	await other.context().close();
});

test('[AC-24] signing out removes the account progress and keeps the settings', async ({
	page,
	browserName
}) => {
	await skipWelcome(page, { completedLessons: ['l1'], examPassed: false });
	await signUp(page, newEmail(browserName));
	await page.goto('/settings');
	await page.getByRole('switch', { name: /Effets sonores/ }).uncheck();

	await signOut(page);
	await expect(page.getByRole('switch', { name: /Effets sonores/ })).not.toBeChecked();
	await page.goto('/');
	await expect(lessonNode(page, 1, 'À faire maintenant')).toBeVisible();
});

test('[AC-25] a reset empties the account, and the other device shows it at its next sync', async ({
	page,
	browser,
	browserName
}) => {
	const email = newEmail(browserName);
	await skipWelcome(page, { completedLessons: ['l1', 'l2'], examPassed: true });
	await signUp(page, email);
	const other = await otherDevice(browser);
	await signIn(other, email);
	await expect(lessonNode(other, 2, 'Terminée')).toBeVisible();

	await page.goto('/settings');
	await page.getByRole('button', { name: 'Réinitialiser ma progression' }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toContainText('sur tous tes appareils');
	await dialog.getByRole('button', { name: 'Tout effacer' }).click();
	await expect(page.getByRole('status').filter({ hasText: 'réinitialisée' })).toBeVisible();
	await expect(accountSection(page)).toContainText(email);
	await page.goto('/');
	await expect(lessonNode(page, 1, 'À faire maintenant')).toBeVisible();

	await other.reload();
	await expect(lessonNode(other, 1, 'À faire maintenant')).toBeVisible();
	await other.context().close();
});
