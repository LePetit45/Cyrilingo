import type { Page } from '@playwright/test';
import { expect, test } from './test.js';
import { skipWelcome } from './storage.js';

// A fresh account per test and per browser: the end-to-end API keeps its database for the run.
const newEmail = (browserName: string) =>
	`e2e-${browserName}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
const PASSWORD = 'e2e password';

async function signUp(page: Page, email: string, password = PASSWORD) {
	await page.goto('/signup');
	await page.getByLabel('Adresse e-mail').fill(email);
	await page.getByLabel('Mot de passe').fill(password);
	await page.getByRole('button', { name: 'Créer mon compte' }).click();
	await expect(page).toHaveURL(/\/$/);
}

async function signIn(page: Page, email: string, password: string) {
	await page.goto('/signin');
	await page.getByLabel('Adresse e-mail').fill(email);
	await page.getByLabel('Mot de passe').fill(password);
	await page.getByRole('button', { name: 'Se connecter' }).click();
}

const accountSection = (page: Page) => page.getByRole('region', { name: 'Compte' });

test.beforeEach(async ({ page }) => {
	await skipWelcome(page);
});

test('[AC-8] a guest playing sends no request to the API', async ({ page }) => {
	const apiRequests: string[] = [];
	page.on('request', (request) => {
		if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url());
	});

	await page.goto('/');
	await page.getByRole('link', { name: 'Commencer' }).click();
	await expect(page.getByText('Lettre 1 sur 3')).toBeVisible();
	await page.goto('/settings');
	await expect(accountSection(page).getByRole('link', { name: 'Se connecter' })).toBeVisible();
	await page.goto('/alphabet');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	expect(apiRequests).toEqual([]);
});

test('[AC-10] signs up, then shows the account in the settings across reloads', async ({
	page,
	browserName
}) => {
	const email = newEmail(browserName);
	await signUp(page, email);

	await page.goto('/settings');
	await expect(accountSection(page)).toContainText(email);
	await page.reload();
	await expect(accountSection(page)).toContainText(email);
	await expect(accountSection(page).getByRole('button', { name: 'Se déconnecter' })).toBeVisible();
});

test('[AC-12] tells that an e-mail already has an account', async ({ page, browserName }) => {
	const email = newEmail(browserName);
	await signUp(page, email);
	await page.goto('/settings');
	await accountSection(page).getByRole('button', { name: 'Se déconnecter' }).click();

	await page.goto('/signup');
	await page.getByLabel('Adresse e-mail').fill(email);
	await page.getByLabel('Mot de passe').fill('another password');
	await page.getByRole('button', { name: 'Créer mon compte' }).click();
	await expect(page.getByRole('alert')).toHaveText(
		'Un compte existe déjà avec cette adresse. Connecte-toi plutôt.'
	);
});

test('[AC-11] signs out, refuses a wrong password with a sentence, then signs in', async ({
	page,
	browserName
}) => {
	const email = newEmail(browserName);
	await signUp(page, email);
	await page.goto('/settings');
	await accountSection(page).getByRole('button', { name: 'Se déconnecter' }).click();
	await expect(page.getByRole('status').first()).toHaveText(
		'Déconnexion réussie sur cet appareil.'
	);
	await expect(accountSection(page).getByRole('link', { name: 'Se connecter' })).toBeVisible();

	await signIn(page, email, 'wrong password');
	await expect(page.getByRole('alert')).toHaveText('E-mail ou mot de passe incorrect.');

	await page.getByLabel('Mot de passe').fill(PASSWORD);
	await page.getByRole('button', { name: 'Se connecter' }).click();
	await expect(page).toHaveURL(/\/$/);
	await page.goto('/settings');
	await expect(accountSection(page)).toContainText(email);
});

test('[AC-18] changes the password, which then signs in', async ({ page, browserName }) => {
	const email = newEmail(browserName);
	await signUp(page, email);
	await page.goto('/settings');
	await accountSection(page).getByRole('link', { name: 'Changer mon mot de passe' }).click();

	await page.getByLabel('Mot de passe actuel').fill('wrong password');
	await page.getByLabel('Nouveau mot de passe').fill('new e2e password');
	await page.getByRole('button', { name: 'Enregistrer' }).click();
	await expect(page.getByRole('alert')).toHaveText('Ton mot de passe actuel est incorrect.');

	await page.getByLabel('Mot de passe actuel').fill(PASSWORD);
	await page.getByRole('button', { name: 'Enregistrer' }).click();
	await expect(page.getByRole('status')).toHaveText(
		'Ton mot de passe est changé. Tes autres appareils ont été déconnectés.'
	);

	await page.goto('/settings');
	await accountSection(page).getByRole('button', { name: 'Se déconnecter' }).click();
	await signIn(page, email, 'new e2e password');
	await expect(page).toHaveURL(/\/$/);
});

test('[AC-19] deletes the account after a confirmation', async ({ page, browserName }) => {
	const email = newEmail(browserName);
	await signUp(page, email);
	await page.goto('/settings');
	await accountSection(page).getByRole('button', { name: 'Supprimer mon compte' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Supprimer définitivement' }).click();
	await expect(accountSection(page)).toContainText('Ton compte a été supprimé.');
	await expect(accountSection(page).getByRole('link', { name: 'Se connecter' })).toBeVisible();

	await signIn(page, email, PASSWORD);
	await expect(page.getByRole('alert')).toHaveText('E-mail ou mot de passe incorrect.');
});
