import { Hono } from 'hono';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { createDb } from '../db/database.js';
import { createServices } from '../services/index.js';
import { createApp } from './app.js';
import { requestLogger } from './logger.js';
import { requireSameOrigin } from './security.js';

const publicUrl = 'https://cyrilingo.example';
const db = createDb(inject('databaseUrl'));
// Nothing listens on port 1: the connection is refused at once.
const unreachableDb = createDb('postgres://cyrilingo:none@127.0.0.1:1/cyrilingo');
afterAll(() => Promise.all([db.destroy(), unreachableDb.destroy()]));

const silent = () => {};

describe('GET /api/health', () => {
	it('[AC-72] returns 200 when the database answers', async () => {
		const app = createApp({ config: { publicUrl }, services: createServices(db), log: silent });
		const response = await app.request('/api/health');
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: 'ok' });
	});

	it('[AC-72] returns 503 when the database does not answer', async () => {
		const app = createApp({
			config: { publicUrl },
			services: createServices(unreachableDb),
			log: silent
		});
		const response = await app.request('/api/health');
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({
			error: { code: 'database_unavailable', message: 'The database does not answer' }
		});
	});
});

describe('errors', () => {
	it('answers an unknown route with a 404 error body', async () => {
		const app = createApp({ config: { publicUrl }, services: createServices(db), log: silent });
		const response = await app.request('/api/nothing-here');
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			error: { code: 'not_found', message: 'No such route' }
		});
	});

	it('answers an unexpected error with a 500 error body that tells nothing about it', async () => {
		const lines: string[] = [];
		const services = createServices(db);
		services.health.isDatabaseUp = () => Promise.reject(new TypeError('secret detail'));
		const app = createApp({ config: { publicUrl }, services, log: (line) => lines.push(line) });

		const response = await app.request('/api/health');
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: { code: 'internal', message: 'Internal error' }
		});
		expect(lines.join('\n')).not.toContain('secret detail');
	});
});

describe('requireSameOrigin', () => {
	const app = new Hono()
		.use(requireSameOrigin(publicUrl))
		.all('/api/things', (c) => c.text('done'))
		.all('/api/speech/recognitions', (c) => c.text('done'));

	const send = (path: string, init: RequestInit) => app.request(path, init);
	const json = { 'Content-Type': 'application/json', Origin: publicUrl };

	it('[AC-21] refuses a mutating request with a foreign or missing Origin with 403', async () => {
		for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
			const foreign = await send('/api/things', {
				method,
				headers: { ...json, Origin: 'https://evil.example' },
				body: '{}'
			});
			expect(foreign.status).toBe(403);
			const missing = await send('/api/things', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: '{}'
			});
			expect(missing.status).toBe(403);
		}
	});

	it('[AC-21] refuses a mutating request with an unexpected content type with 403', async () => {
		const form = await send('/api/things', {
			method: 'POST',
			headers: { Origin: publicUrl, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: 'a=1'
		});
		expect(form.status).toBe(403);
		expect(await form.json()).toEqual({
			error: { code: 'forbidden', message: 'Content-Type must be application/json' }
		});

		const untyped = await send('/api/things', {
			method: 'POST',
			headers: { Origin: publicUrl, 'Content-Length': '2' },
			body: '{}'
		});
		expect(untyped.status).toBe(403);

		const jsonForSpeech = await send('/api/speech/recognitions', {
			method: 'POST',
			headers: json,
			body: '{}'
		});
		expect(jsonForSpeech.status).toBe(403);
	});

	it('lets through same-origin JSON, WAV for speech, bodiless requests and reads', async () => {
		const accepted = [
			await send('/api/things', {
				method: 'POST',
				headers: { ...json, 'Content-Type': 'application/json; charset=utf-8' },
				body: '{}'
			}),
			await send('/api/speech/recognitions', {
				method: 'POST',
				headers: { Origin: publicUrl, 'Content-Type': 'audio/wav' },
				body: new Uint8Array(4)
			}),
			await send('/api/things', { method: 'DELETE', headers: { Origin: publicUrl } }),
			await send('/api/things', { method: 'GET', headers: { Origin: 'https://evil.example' } })
		];
		expect(accepted.map((response) => response.status)).toEqual([200, 200, 200, 200]);
	});
});

describe('requestLogger', () => {
	it('logs the method, path, status and duration, never the query string', async () => {
		const lines: string[] = [];
		const app = new Hono()
			.use(requestLogger((line) => lines.push(line)))
			.get('/api/things', (c) => c.text('done'));
		await app.request('/api/things?word=котка&token=abc');
		expect(lines).toHaveLength(1);
		expect(lines[0]).toMatch(/^GET \/api\/things 200 \d+ms$/);
	});
});
