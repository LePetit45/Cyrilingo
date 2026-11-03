import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { createDb } from '../db/database.js';
import { createServices } from '../services/index.js';
import { createApp } from './app.js';

const publicUrl = 'https://cyrilingo.example';
const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

const app = createApp({
	config: { publicUrl, trustProxy: false },
	services: createServices(db),
	log: () => {}
});

/** Signs a new learner up and answers their session cookie. */
async function signedIn(): Promise<string> {
	const response = await app.request('/api/auth/signup', {
		method: 'POST',
		headers: { Origin: publicUrl, 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: `learner-${randomUUID()}@example.com`, password: 'a password' })
	});
	return response.headers.get('Set-Cookie')?.split(';')[0] ?? '';
}

const patch = (cookie: string, body: unknown) =>
	app.request('/api/progress', {
		method: 'PATCH',
		headers: { Origin: publicUrl, 'Content-Type': 'application/json', Cookie: cookie },
		body: JSON.stringify(body)
	});

describe('/api/progress', () => {
	it('answers 401 without a session', async () => {
		expect((await app.request('/api/progress')).status).toBe(401);
		expect((await patch('', { completedLessons: [], examPassed: false })).status).toBe(401);
		expect((await app.request('/api/lessons')).status).toBe(401);
	});

	it('[AC-22] merges a device progress into the account and answers the result', async () => {
		const cookie = await signedIn();
		await patch(cookie, { completedLessons: ['l2'], examPassed: false });
		const merged = await patch(cookie, { completedLessons: ['l1'], examPassed: true });
		expect(merged.status).toBe(200);
		const expected = { completedLessons: ['l1', 'l2'], examPassed: true };
		expect(await merged.json()).toEqual(expected);
		const progress = await app.request('/api/progress', { headers: { Cookie: cookie } });
		expect(await progress.json()).toEqual(expected);
	});

	it('answers 400 for an unknown lesson or a malformed body', async () => {
		const cookie = await signedIn();
		const unknown = await patch(cookie, { completedLessons: ['l99'], examPassed: false });
		expect(unknown.status).toBe(400);
		expect(await unknown.json()).toMatchObject({ error: { code: 'unknown_lesson' } });
		for (const body of [
			{},
			{ completedLessons: 'l1', examPassed: false },
			{ completedLessons: [] }
		]) {
			const response = await patch(cookie, body);
			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({ error: { code: 'invalid_input' } });
		}
	});

	it('[AC-25] resets the account progress', async () => {
		const cookie = await signedIn();
		await patch(cookie, { completedLessons: ['l1'], examPassed: true });
		const reset = await app.request('/api/progress', {
			method: 'DELETE',
			headers: { Origin: publicUrl, Cookie: cookie }
		});
		expect(reset.status).toBe(204);
		const progress = await app.request('/api/progress', { headers: { Cookie: cookie } });
		expect(await progress.json()).toEqual({ completedLessons: [], examPassed: false });
	});

	it('[AC-21] refuses a reset from a foreign origin', async () => {
		const cookie = await signedIn();
		const response = await app.request('/api/progress', {
			method: 'DELETE',
			headers: { Origin: 'https://evil.example', Cookie: cookie }
		});
		expect(response.status).toBe(403);
	});
});

describe('GET /api/lessons', () => {
	it('lists the lessons with what the learner completed', async () => {
		const cookie = await signedIn();
		await patch(cookie, { completedLessons: ['l1'], examPassed: false });
		const response = await app.request('/api/lessons', { headers: { Cookie: cookie } });
		const lessons = (await response.json()) as { id: string; completed: boolean }[];
		expect(lessons).toHaveLength(10);
		expect(lessons[0]).toEqual({
			id: 'l1',
			section: 'allies',
			letters: ['А', 'Т', 'М'],
			completed: true
		});
		expect(lessons[1]).toMatchObject({ id: 'l2', completed: false });
	});
});
