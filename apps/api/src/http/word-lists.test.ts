import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { createDb } from '../db/database.js';
import { createServices } from '../services/index.js';
import { createApp } from './app.js';

const publicUrl = 'https://cyrilingo.example';
const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

// Behind a trusted proxy, so each learner signs up from an address of their own (AC-26).
const app = createApp({
	config: { publicUrl, trustProxy: true },
	services: createServices(db),
	log: () => {}
});

/** Signs a new learner up and answers their session cookie. */
async function signedIn(): Promise<string> {
	const response = await app.request('/api/auth/signup', {
		method: 'POST',
		headers: {
			Origin: publicUrl,
			'Content-Type': 'application/json',
			'X-Forwarded-For': randomUUID()
		},
		body: JSON.stringify({ email: `learner-${randomUUID()}@example.com`, password: 'a password' })
	});
	return response.headers.get('Set-Cookie')?.split(';')[0] ?? '';
}

function send(method: string, path: string, cookie: string, body?: unknown) {
	return app.request(`/api/word-lists${path}`, {
		method,
		headers: {
			Origin: publicUrl,
			Cookie: cookie,
			...(body === undefined ? {} : { 'Content-Type': 'application/json' })
		},
		body: body === undefined ? undefined : JSON.stringify(body)
	});
}

async function createList(cookie: string, name: string): Promise<{ id: string }> {
	return (await send('POST', '', cookie, { name })).json() as Promise<{ id: string }>;
}

describe('/api/word-lists', () => {
	it('[AC-36] answers 401 to every route without a session', async () => {
		const id = randomUUID();
		const calls = [
			send('GET', '', ''),
			send('POST', '', '', { name: 'Mots' }),
			send('PATCH', `/${id}`, '', { name: 'Mots' }),
			send('DELETE', `/${id}`, ''),
			send('POST', `/${id}/words`, '', { word: 'котка' }),
			send('DELETE', `/${id}/words/${encodeURIComponent('котка')}`, '')
		];
		for (const response of await Promise.all(calls)) {
			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({
				error: { code: 'unauthenticated', message: expect.any(String) }
			});
		}
	});

	it('[AC-75] answers 401 with no list in the body without a session', async () => {
		const cookie = await signedIn();
		await createList(cookie, 'Secrète');
		const response = await send('GET', '', '');
		expect(response.status).toBe(401);
		expect(JSON.stringify(await response.json())).not.toContain('Secrète');
	});

	it('[AC-30] creates, renames and deletes a list', async () => {
		const cookie = await signedIn();
		const created = await send('POST', '', cookie, { name: 'Villes' });
		expect(created.status).toBe(201);
		const list = (await created.json()) as { id: string };
		expect(list).toMatchObject({ name: 'Villes', words: [] });

		const renamed = await send('PATCH', `/${list.id}`, cookie, { name: 'Capitales' });
		expect(renamed.status).toBe(200);
		expect(await renamed.json()).toMatchObject({ id: list.id, name: 'Capitales' });

		expect((await send('DELETE', `/${list.id}`, cookie)).status).toBe(204);
		expect(await (await send('GET', '', cookie)).json()).toEqual([]);
	});

	it('[AC-30] answers 400 for a bad name and 409 for a 21st list', async () => {
		const cookie = await signedIn();
		const empty = await send('POST', '', cookie, { name: ' ' });
		expect(empty.status).toBe(400);
		expect(await empty.json()).toMatchObject({ error: { code: 'invalid_list_name' } });
		expect((await send('POST', '', cookie, {})).status).toBe(400);
		for (let i = 1; i <= 20; i++) await createList(cookie, `Liste ${i}`);
		const extra = await send('POST', '', cookie, { name: 'Une de trop' });
		expect(extra.status).toBe(409);
		expect(await extra.json()).toMatchObject({ error: { code: 'list_limit_reached' } });
	});

	it('[AC-31] adds a corpus word once, and removes it', async () => {
		const cookie = await signedIn();
		const { id } = await createList(cookie, 'Mots');
		const added = await send('POST', `/${id}/words`, cookie, { word: 'котка' });
		expect(added.status).toBe(201);
		expect(await added.json()).toMatchObject({ words: [{ cyrillic: 'котка', latin: 'kotka' }] });

		const again = await send('POST', `/${id}/words`, cookie, { word: 'котка' });
		expect(again.status).toBe(409);
		expect(await again.json()).toMatchObject({ error: { code: 'word_already_in_list' } });

		const unknown = await send('POST', `/${id}/words`, cookie, { word: 'кот' });
		expect(unknown.status).toBe(400);
		expect(await unknown.json()).toMatchObject({ error: { code: 'unknown_word' } });

		const removed = await send('DELETE', `/${id}/words/${encodeURIComponent('котка')}`, cookie);
		expect(removed.status).toBe(200);
		expect(await removed.json()).toMatchObject({ words: [] });
	});

	it("[AC-32] answers 404 for another user's list, as for a missing one", async () => {
		const [owner, intruder] = [await signedIn(), await signedIn()];
		const { id } = await createList(owner, 'À moi');
		await send('POST', `/${id}/words`, owner, { word: 'котка' });
		for (const listId of [id, randomUUID(), 'not-a-uuid']) {
			const responses = await Promise.all([
				send('PATCH', `/${listId}`, intruder, { name: 'Volée' }),
				send('DELETE', `/${listId}`, intruder),
				send('POST', `/${listId}/words`, intruder, { word: 'мама' }),
				send('DELETE', `/${listId}/words/${encodeURIComponent('котка')}`, intruder)
			]);
			for (const response of responses) {
				expect(response.status).toBe(404);
				expect(await response.json()).toEqual({
					error: { code: 'not_found', message: 'Not found' }
				});
			}
		}
		expect(await (await send('GET', '', owner)).json()).toMatchObject([
			{ id, name: 'À moi', words: [{ cyrillic: 'котка' }] }
		]);
	});

	it("[AC-33] lists only the signed-in user's lists", async () => {
		const [ana, ben] = [await signedIn(), await signedIn()];
		await createList(ana, 'Ana');
		await createList(ben, 'Ben');
		const response = await send('GET', '', ana);
		expect(response.status).toBe(200);
		expect(((await response.json()) as { name: string }[]).map(({ name }) => name)).toEqual([
			'Ana'
		]);
	});

	it('[AC-21] refuses a change from a foreign origin', async () => {
		const cookie = await signedIn();
		const { id } = await createList(cookie, 'Mots');
		const response = await app.request(`/api/word-lists/${id}`, {
			method: 'DELETE',
			headers: { Origin: 'https://evil.example', Cookie: cookie }
		});
		expect(response.status).toBe(403);
		expect(await (await send('GET', '', cookie)).json()).toHaveLength(1);
	});
});
