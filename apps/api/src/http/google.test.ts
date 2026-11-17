import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { FakeGoogleClient } from '../auth/google-testing.js';
import { createDb } from '../db/database.js';
import { createServices } from '../services/index.js';
import { createApp } from './app.js';

const publicUrl = 'https://cyrilingo.example';
const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

function newApp(google: FakeGoogleClient | null = new FakeGoogleClient()) {
	const config = { publicUrl, trustProxy: false, google: null, azureSpeech: null };
	return createApp({
		config,
		services: createServices(db, config, { googleClient: google ?? undefined }),
		log: () => {}
	});
}

/** Every `name=value` pair a response sets, as one Cookie header. */
const cookiesOf = (response: Response) =>
	response.headers
		.getSetCookie()
		.map((cookie) => cookie.split(';')[0])
		.join('; ');

/** `GET /api/auth/google`, then Google's redirect to the callback once `person` agreed. */
async function roundTrip(
	app: ReturnType<typeof newApp>,
	google: FakeGoogleClient,
	person: { sub: string; email: string; emailVerified: boolean },
	tamper: (query: URLSearchParams) => void = () => {}
) {
	const start = await app.request('/api/auth/google');
	const state = new URL(start.headers.get('Location')!).searchParams.get('state')!;
	const query = new URLSearchParams({ code: google.consent(person), state });
	tamper(query);
	return app.request(`/api/auth/google/callback?${query}`, {
		headers: { Cookie: cookiesOf(start) }
	});
}

const person = (emailVerified = true) => ({
	sub: `google-${randomUUID()}`,
	email: `learner-${randomUUID()}@example.com`,
	emailVerified
});

describe('GET /api/auth/google', () => {
	it('redirects to Google and keeps the state and verifier in short-lived HttpOnly cookies', async () => {
		const response = await newApp().request('/api/auth/google');
		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toMatch(/^https:\/\/accounts\.google\.test\//);
		const cookies = response.headers.getSetCookie();
		expect(cookies).toHaveLength(2);
		for (const cookie of cookies) {
			expect(cookie).toMatch(/^google_(state|verifier)=[A-Za-z0-9_-]{43}; /);
			expect(cookie).toContain('Max-Age=600');
			expect(cookie).toContain('Path=/api/auth/google');
			expect(cookie).toContain('HttpOnly');
			expect(cookie).toContain('Secure');
			expect(cookie).toContain('SameSite=Lax');
		}
	});

	it('sends the learner back to the app when Google sign-in is off', async () => {
		const app = newApp(null);
		for (const path of ['/api/auth/google', '/api/auth/google/callback?code=c&state=s']) {
			const response = await app.request(path);
			expect(response.status).toBe(302);
			expect(response.headers.get('Location')).toBe('/signin/google?error=google_unavailable');
		}
	});
});

describe('GET /api/auth/google/callback', () => {
	it('starts a session and sends the learner back to the app', async () => {
		const google = new FakeGoogleClient();
		const app = newApp(google);
		const someone = person();
		const response = await roundTrip(app, google, someone);

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe('/signin/google?signed_in=1');
		const cookies = response.headers.getSetCookie();
		expect(cookies.find((cookie) => cookie.startsWith('session='))).toContain('HttpOnly');
		// The state and verifier are spent.
		expect(cookies.filter((cookie) => /^google_\w+=;/.test(cookie))).toHaveLength(2);

		const me = await app.request('/api/me', { headers: { Cookie: cookiesOf(response) } });
		expect(await me.json()).toMatchObject({
			email: someone.email,
			hasPassword: false,
			providers: ['google'],
			features: { google: true }
		});
	});

	it('[AC-14] refuses a callback whose state does not match, without a session', async () => {
		const google = new FakeGoogleClient();
		const response = await roundTrip(newApp(google), google, person(), (query) =>
			query.set('state', 'forged')
		);
		expect(response.headers.get('Location')).toBe('/signin/google?error=google_failed');
		expect(response.headers.get('Set-Cookie')).not.toMatch(/session=[^;]/);
	});

	it('[AC-14] refuses a callback without the cookies of the browser that started it', async () => {
		const google = new FakeGoogleClient();
		const app = newApp(google);
		const start = await app.request('/api/auth/google');
		const state = new URL(start.headers.get('Location')!).searchParams.get('state')!;
		const code = google.consent(person());
		const response = await app.request(`/api/auth/google/callback?code=${code}&state=${state}`);
		expect(response.headers.get('Location')).toBe('/signin/google?error=google_failed');
	});

	it('[AC-16] tells the app when Google has not verified the e-mail', async () => {
		const google = new FakeGoogleClient();
		const response = await roundTrip(newApp(google), google, person(false));
		expect(response.headers.get('Location')).toBe('/signin/google?error=google_unverified');
	});

	it('[AC-17] tells the app when linking removed the password of a local account', async () => {
		const google = new FakeGoogleClient();
		const app = newApp(google);
		const someone = person();
		const signUp = await app.request('/api/auth/signup', {
			method: 'POST',
			headers: { Origin: publicUrl, 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: someone.email, password: 'correct horse battery' })
		});
		const response = await roundTrip(app, google, someone);
		expect(response.headers.get('Location')).toBe('/signin/google?notice=password_removed');
		const before = await app.request('/api/me', { headers: { Cookie: cookiesOf(signUp) } });
		expect(before.status).toBe(401);
	});

	it('tells the app when the learner said no on Google’s page', async () => {
		const response = await newApp().request('/api/auth/google/callback?error=access_denied');
		expect(response.headers.get('Location')).toBe('/signin/google?error=google_cancelled');
	});

	it('refuses a callback whose query is not what Google sends', async () => {
		const response = await newApp().request(`/api/auth/google/callback?state=${'s'.repeat(200)}`);
		expect(response.headers.get('Location')).toBe('/signin/google?error=google_failed');
	});
});
