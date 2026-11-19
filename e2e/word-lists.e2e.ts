import type { Browser, Page } from '@playwright/test';
import { newEmail, signUp } from './accounts.js';
import { answerCorrectly, typeAnswer } from './answers.js';
import { e2eQuery } from './database.js';
import { skipWelcome } from './storage.js';
import { expect, mute, ownClientHeaders, test } from './test.js';

// Personal word lists (SPEC.md › Word lists and authorization).

/** The API refuses changes from another origin (AC-21): the app's own, as Playwright serves it. */
const ORIGIN = 'http://localhost:4173';

interface ApiList {
	id: string;
	name: string;
	words: { cyrillic: string }[];
}

/** Creates a list with these words through the API, as the signed-in learner of the page. */
async function createList(page: Page, name: string, words: string[] = []): Promise<string> {
	const created = await page.request.post('/api/word-lists', {
		data: { name },
		headers: { Origin: ORIGIN }
	});
	expect(created.status()).toBe(201);
	const { id } = (await created.json()) as ApiList;
	for (const word of words) {
		const added = await page.request.post(`/api/word-lists/${id}/words`, {
			data: { word },
			headers: { Origin: ORIGIN }
		});
		expect(added.status()).toBe(201);
	}
	return id;
}

async function apiLists(page: Page): Promise<ApiList[]> {
	return (await page.request
		.get('/api/word-lists')
		.then((response) => response.json())) as ApiList[];
}

async function signedUp(page: Page, browserName: string) {
	await skipWelcome(page);
	await signUp(page, newEmail(browserName));
}

/** Another learner, on their own device, with a list of their own. */
async function otherLearner(browser: Browser, browserName: string) {
	const page = await (await browser.newContext({ extraHTTPHeaders: ownClientHeaders() })).newPage();
	await mute(page);
	await signedUp(page, browserName);
	await createList(page, 'Liste de Ben', ['мама']);
	return page;
}

const listLink = (page: Page, name: string) =>
	page.getByRole('link', { name: new RegExp(`^${name}`) });

test('[AC-75] a guest opening Listes sees the sign-in invitation and no list', async ({
	page,
	browser,
	browserName
}) => {
	const other = await otherLearner(browser, browserName);
	await skipWelcome(page);
	await page.goto('/lists');
	await expect(page.getByText('Connecte-toi pour créer tes listes de mots')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();
	await expect(page.getByText('Liste de Ben')).toHaveCount(0);

	const response = await page.request.get('/api/word-lists');
	expect(response.status()).toBe(401);
	const body = await response.text();
	expect(body).not.toContain('Liste de Ben');
	expect(JSON.parse(body)).toMatchObject({ error: { code: 'unauthenticated' } });
	await other.context().close();
});

test("[AC-76] Listes shows the account's lists with their number of words, and nobody else's", async ({
	page,
	browser,
	browserName
}) => {
	const other = await otherLearner(browser, browserName);
	await signedUp(page, browserName);
	await page.goto('/lists');
	await expect(page.getByText('Tu n’as pas encore de liste.')).toBeVisible();

	await page.getByRole('button', { name: 'Créer une liste' }).click();
	await page.getByLabel('Nom de la liste').fill('Villes');
	await page.getByRole('button', { name: 'Créer', exact: true }).click();
	await expect(listLink(page, 'Villes')).toContainText('0 mot');

	await createList(page, 'Animaux', ['котка', 'куче']);
	await page.reload();
	await expect(listLink(page, 'Villes')).toContainText('0 mot');
	await expect(listLink(page, 'Animaux')).toContainText('2 mots');
	await expect(page.getByText('Liste de Ben')).toHaveCount(0);
	await other.context().close();
});

test('[AC-77] a list deleted in the database is gone from Listes after a reload', async ({
	page,
	browserName
}) => {
	await signedUp(page, browserName);
	const gone = await createList(page, 'Éphémère');
	await createList(page, 'Durable');
	await page.goto('/lists');
	await expect(listLink(page, 'Éphémère')).toBeVisible();

	await e2eQuery('DELETE FROM word_lists WHERE id = $1', [gone]);
	await page.reload();
	await expect(listLink(page, 'Durable')).toBeVisible();
	await expect(listLink(page, 'Éphémère')).toHaveCount(0);
});

test('[AC-30] renames a list, removes a word and deletes the list from its page', async ({
	page,
	browserName
}) => {
	await signedUp(page, browserName);
	await createList(page, 'Brouillon', ['котка', 'мама']);
	await page.goto('/lists');
	await listLink(page, 'Brouillon').click();
	await expect(page.getByRole('heading', { level: 1, name: 'Brouillon' })).toBeVisible();

	await page.getByRole('button', { name: 'Renommer' }).click();
	await page.getByLabel('Nom de la liste').fill('Animaux');
	await page.getByRole('button', { name: 'Enregistrer' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Animaux' })).toBeVisible();

	await page.getByRole('button', { name: 'Retirer « мама » de la liste' }).click();
	await expect(page.getByRole('status')).toContainText('« мама » retiré de la liste.');
	await expect(page.getByText('1 mot', { exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Supprimer la liste' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
	await expect(page).toHaveURL(/\/lists$/);
	await expect(page.getByText('Tu n’as pas encore de liste.')).toBeVisible();
	expect(await apiLists(page)).toEqual([]);
});

test('[AC-34] « Réviser ma liste » asks a reading question per word and saves nothing', async ({
	page,
	browserName
}) => {
	await signedUp(page, browserName);
	await createList(page, 'Vide');
	await createList(page, 'Animaux', ['котка', 'мама']);

	await page.goto('/lists');
	await listLink(page, 'Vide').click();
	await expect(
		page.getByText('Cette liste est vide. Ajoute des mots depuis une leçon.')
	).toBeVisible();
	await expect(page.getByRole('link', { name: 'Réviser ma liste' })).toHaveCount(0);

	await page.goto('/lists');
	await listLink(page, 'Animaux').click();
	await page.getByRole('link', { name: 'Réviser ma liste' }).click();
	const done = page.getByRole('heading', { level: 1, name: /^Révision terminée/ });
	let questions = 0;
	while (!(await done.isVisible())) {
		await expect(page.locator('.prompt')).toHaveText('Lis ce mot');
		await answerCorrectly(page);
		questions++;
	}
	expect(questions).toBe(2);

	const progress = await page.request.get('/api/progress').then((response) => response.json());
	expect(progress).toEqual({ completedLessons: [], examPassed: false });
	expect(await page.evaluate(() => localStorage.getItem('cyrilingo.progress.v1'))).toBe(
		JSON.stringify({ completedLessons: [], examPassed: false })
	);
});

test('[AC-35] adds the word of a reading question to a new list from the feedback panel', async ({
	page,
	browserName
}) => {
	await signedUp(page, browserName);
	const source = await createList(page, 'Source', ['котка']);
	await page.goto(`/list/review?id=${source}`);
	await typeAnswer(page, 'kotka');

	await page.locator('.feedback').getByRole('button', { name: 'Ajouter à une liste' }).click();
	const dialog = page.getByRole('dialog', { name: 'Ajouter à une liste' });
	await expect(dialog.getByRole('button', { name: /Source/ })).toBeDisabled();
	await expect(dialog.getByRole('button', { name: /Source/ })).toContainText('Déjà dans la liste');
	await dialog.getByLabel('Nom de la nouvelle liste').fill('À revoir');
	await dialog.getByRole('button', { name: 'Créer et ajouter' }).click();
	await expect(dialog.getByRole('status')).toHaveText('Ajouté à « À revoir ».');
	await dialog.getByRole('button', { name: 'Fermer' }).click();
	await expect(dialog).toBeHidden();

	const lists = await apiLists(page);
	expect(lists.find(({ name }) => name === 'À revoir')?.words).toEqual([
		{ cyrillic: 'котка', latin: 'kotka' }
	]);
});

test('[AC-35] a guest gets no « Ajouter à une liste » button', async ({ page }) => {
	// The exam is mostly word readings: their feedback is where a signed-in learner gets the button.
	const all = Array.from({ length: 10 }, (_, index) => `l${index + 1}`);
	await skipWelcome(page, { completedLessons: all, examPassed: false });
	await page.goto('/exam');
	await page.getByRole('button', { name: 'Commencer l’épreuve' }).click();
	while ((await page.locator('.prompt').innerText()) !== 'Lis ce mot') await answerCorrectly(page);
	await typeAnswer(page, 'x');
	await expect(page.locator('.feedback')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Ajouter à une liste' })).toHaveCount(0);
});
