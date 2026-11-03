import type { Page } from '@playwright/test';
import { expect } from './test.js';

// Accounts for the end-to-end tests. A fresh one per test and per browser: the end-to-end API
// keeps its database for the run.

export const newEmail = (browserName: string) =>
	`e2e-${browserName}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

export const PASSWORD = 'e2e password';

export async function signUp(page: Page, email: string, password = PASSWORD) {
	await page.goto('/signup');
	await page.getByLabel('Adresse e-mail').fill(email);
	await page.getByLabel('Mot de passe').fill(password);
	await page.getByRole('button', { name: 'Créer mon compte' }).click();
	await expect(page).toHaveURL(/\/$/);
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
	await page.goto('/signin');
	await page.getByLabel('Adresse e-mail').fill(email);
	await page.getByLabel('Mot de passe').fill(password);
	await page.getByRole('button', { name: 'Se connecter' }).click();
}

export const accountSection = (page: Page) => page.getByRole('region', { name: 'Compte' });

export async function signOut(page: Page) {
	await page.goto('/settings');
	await accountSection(page).getByRole('button', { name: 'Se déconnecter' }).click();
	await expect(accountSection(page).getByRole('link', { name: 'Se connecter' })).toBeVisible();
}
