import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { createDb } from '../db/database.js';
import { createServices } from '../services/index.js';
import { createApp } from './app.js';

const publicUrl = 'https://cyrilingo.example';
const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

const newApp = (trustProxy = false) =>
	createApp({
		config: { publicUrl, trustProxy },
		services: createServices(db, { google: null, azureSpeech: { key: 'k', region: 'r' } }),
		log: () => {}
	});

const newEmail = () => `learner-${randomUUID()}@example.com`;
const PASSWORD = 'correct horse battery';

function post(app: ReturnType<typeof newApp>, path: string, body: unknown, headers = {}) {
	return app.request(path, {
		method: 'POST',
		headers: { Origin: publicUrl, 'Content-Type': 'application/json', ...headers },
		body: typeof body === 'string' ? body : JSON.stringify(body)
	});
}

/** The `session=…` pair of a response's Set-Cookie, to send back as a Cookie header. */
const sessionCookie = (response: Response) =>
	response.headers.get('Set-Cookie')?.split(';')[0] ?? '';

describe('POST /api/auth/signup', () => {
	it('[AC-10] creates the account and sets the session cookie', async () => {
		const app = newApp();
		const email = newEmail();
		const response = await post(app, '/api/auth/signup', { email, password: PASSWORD });
		expect(response.status).toBe(201);

		const me = await app.request('/api/me', { headers: { Cookie: sessionCookie(response) } });
		expect(await me.json()).toEqual({
			email,
			hasPassword: true,
			providers: [],
			features: { readAloud: true, google: false }
		});
	});

	it('[AC-13] sets an HttpOnly, Secure, SameSite=Lax cookie for 30 days', async () => {
		const response = await post(newApp(), '/api/auth/signup', {
			email: newEmail(),
			password: PASSWORD
		});
		const cookie = response.headers.get('Set-Cookie') ?? '';
		expect(cookie).toMatch(/^session=[A-Za-z0-9_-]{43}; /);
		expect(cookie).toContain('HttpOnly');
		expect(cookie).toContain('Secure');
		expect(cookie).toContain('SameSite=Lax');
		expect(cookie).toContain('Path=/');
		const expires = new Date(/Expires=([^;]+)/.exec(cookie)![1]!).getTime();
		expect(expires - Date.now()).toBeGreaterThan(29.9 * 24 * 60 * 60 * 1000);
	});

	it('[AC-12] answers 409 for an e-mail that already has an account', async () => {
		const app = newApp();
		const email = newEmail();
		await post(app, '/api/auth/signup', { email, password: PASSWORD });
		const response = await post(app, '/api/auth/signup', { email, password: 'other password' });
		expect(response.status).toBe(409);
		expect(await response.json()).toMatchObject({ error: { code: 'email_taken' } });
	});

	it('answers 400 for a short password or a malformed body', async () => {
		const app = newApp();
		const short = await post(app, '/api/auth/signup', { email: newEmail(), password: 'short' });
		expect(short.status).toBe(400);
		expect(await short.json()).toMatchObject({ error: { code: 'invalid_password' } });

		for (const body of ['not json', { email: 'not an e-mail', password: PASSWORD }, {}]) {
			const response = await post(app, '/api/auth/signup', body);
			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({ error: { code: 'invalid_input' } });
		}
	});

	it('answers 413 for a body over 16 KB', async () => {
		const response = await post(newApp(), '/api/auth/signup', {
			email: newEmail(),
			password: 'a'.repeat(20_000)
		});
		expect(response.status).toBe(413);
	});
});

describe('POST /api/auth/login', () => {
	it('[AC-11] answers 401 with the same body for an unknown e-mail and a wrong password', async () => {
		const app = newApp();
		const email = newEmail();
		await post(app, '/api/auth/signup', { email, password: PASSWORD });
		const unknown = await post(app, '/api/auth/login', { email: newEmail(), password: PASSWORD });
		const wrong = await post(app, '/api/auth/login', { email, password: 'wrong password' });
		expect(unknown.status).toBe(401);
		expect(wrong.status).toBe(401);
		expect(await unknown.json()).toEqual(await wrong.json());
		expect(unknown.headers.get('Set-Cookie')).toBeNull();
	});

	it('signs in and sets the session cookie', async () => {
		const app = newApp();
		const email = newEmail();
		await post(app, '/api/auth/signup', { email, password: PASSWORD });
		const response = await post(app, '/api/auth/login', { email, password: PASSWORD });
		expect(response.status).toBe(204);
		const me = await app.request('/api/me', { headers: { Cookie: sessionCookie(response) } });
		expect(me.status).toBe(200);
	});

	it('[AC-20] answers 429 after 10 failures from one IP, read from X-Forwarded-For behind a trusted proxy', async () => {
		const app = newApp(true);
		const email = newEmail();
		await post(app, '/api/auth/signup', { email, password: PASSWORD });
		const from = (ip: string) => ({ 'X-Forwarded-For': `${ip}, 10.0.0.1` });
		for (let attempt = 0; attempt < 10; attempt++) {
			await post(app, '/api/auth/login', { email, password: 'wrong' }, from('198.51.100.9'));
		}
		const blocked = await post(
			app,
			'/api/auth/login',
			{ email, password: PASSWORD },
			from('198.51.100.9')
		);
		expect(blocked.status).toBe(429);
		expect(await blocked.json()).toMatchObject({ error: { code: 'too_many_attempts' } });
		const other = await post(
			app,
			'/api/auth/login',
			{ email, password: PASSWORD },
			from('198.51.100.10')
		);
		expect(other.status).toBe(204);
	});
});

describe('POST /api/auth/logout', () => {
	it('[AC-13] ends the session and deletes the cookie', async () => {
		const app = newApp();
		const signup = await post(app, '/api/auth/signup', { email: newEmail(), password: PASSWORD });
		const cookie = sessionCookie(signup);

		const logout = await post(app, '/api/auth/logout', '', { Cookie: cookie });
		expect(logout.status).toBe(204);
		expect(logout.headers.get('Set-Cookie')).toMatch(/^session=; .*Max-Age=0/);
		const me = await app.request('/api/me', { headers: { Cookie: cookie } });
		expect(me.status).toBe(401);
	});
});

describe('/api/me', () => {
	it('answers 401 without a session or with an unknown one', async () => {
		const app = newApp();
		for (const headers of [{}, { Cookie: 'session=unknown' }]) {
			const response = await app.request('/api/me', { headers });
			expect(response.status).toBe(401);
			expect(await response.json()).toMatchObject({ error: { code: 'unauthenticated' } });
		}
	});

	it('[AC-18] changes the password and keeps the current session', async () => {
		const app = newApp();
		const email = newEmail();
		const cookie = sessionCookie(
			await post(app, '/api/auth/signup', { email, password: PASSWORD })
		);
		const change = (body: unknown) =>
			app.request('/api/me/password', {
				method: 'PUT',
				headers: { Origin: publicUrl, 'Content-Type': 'application/json', Cookie: cookie },
				body: JSON.stringify(body)
			});

		const wrong = await change({ currentPassword: 'wrong', newPassword: 'new password' });
		expect(wrong.status).toBe(400);
		expect(await wrong.json()).toMatchObject({ error: { code: 'wrong_password' } });

		expect((await change({ currentPassword: PASSWORD, newPassword: 'new password' })).status).toBe(
			204
		);
		expect((await app.request('/api/me', { headers: { Cookie: cookie } })).status).toBe(200);
		const login = await post(app, '/api/auth/login', { email, password: 'new password' });
		expect(login.status).toBe(204);
	});

	it('[AC-19] deletes the account, after which its session no longer works', async () => {
		const app = newApp();
		const email = newEmail();
		const cookie = sessionCookie(
			await post(app, '/api/auth/signup', { email, password: PASSWORD })
		);
		const response = await app.request('/api/me', {
			method: 'DELETE',
			headers: { Origin: publicUrl, Cookie: cookie }
		});
		expect(response.status).toBe(204);
		expect((await app.request('/api/me', { headers: { Cookie: cookie } })).status).toBe(401);
		const login = await post(app, '/api/auth/login', { email, password: PASSWORD });
		expect(login.status).toBe(401);
	});
});
