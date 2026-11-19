import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { createDb } from '../db/database.js';
import { createServices } from '../services/index.js';
import { FakeSpeechClient, makeWav } from '../speech/testing.js';
import { createApp } from './app.js';
import { SPEECH_BODY_LIMIT } from './wav.js';

const publicUrl = 'https://cyrilingo.example';
const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

function newApp(fake: FakeSpeechClient | null = new FakeSpeechClient(), triesPerUser?: number) {
	const lines: string[] = [];
	const app = createApp({
		// Behind a trusted proxy, so each learner signs up from an address of their own (AC-26).
		config: { publicUrl, trustProxy: true },
		services: createServices(
			db,
			{ publicUrl, google: null, azureSpeech: null },
			{ speechClient: fake ?? undefined, speechTriesPerUser: triesPerUser }
		),
		log: (line) => lines.push(line)
	});
	return { app, lines };
}

type App = ReturnType<typeof newApp>['app'];

async function signedIn(app: App): Promise<string> {
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

function sendRecording(
	app: App,
	cookie: string,
	{
		word = 'котка',
		body = makeWav(),
		headers = {}
	}: { word?: string; body?: Uint8Array; headers?: Record<string, string> } = {}
) {
	return app.request(`/api/speech/recognitions?word=${encodeURIComponent(word)}`, {
		method: 'POST',
		headers: { Origin: publicUrl, 'Content-Type': 'audio/wav', Cookie: cookie, ...headers },
		body
	});
}

describe('POST /api/speech/recognitions', () => {
	it('[AC-43] answers the verdict on a recording', async () => {
		const fake = new FakeSpeechClient({ status: 'success', text: 'Котка' });
		const { app } = newApp(fake);
		const response = await sendRecording(app, await signedIn(app));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ outcome: 'match' });

		fake.behavior = { status: 'success', text: 'мляко' };
		const mismatch = await sendRecording(app, await signedIn(app));
		expect(await mismatch.json()).toEqual({ outcome: 'mismatch', heard: 'мляко' });
	});

	it('needs a session, checked before the body is read', async () => {
		const fake = new FakeSpeechClient();
		const { app } = newApp(fake);
		const response = await sendRecording(app, '');
		expect(response.status).toBe(401);
		expect(fake.calls).toHaveLength(0);
	});

	it('[AC-21] refuses a foreign origin and a body that is not WAV audio', async () => {
		const { app } = newApp();
		const cookie = await signedIn(app);
		const foreign = await sendRecording(app, cookie, {
			headers: { Origin: 'https://evil.example' }
		});
		expect(foreign.status).toBe(403);
		const json = await sendRecording(app, cookie, {
			headers: { 'Content-Type': 'application/json' }
		});
		expect(json.status).toBe(403);
	});

	it('[AC-49] refuses a recording over 200 KB with 413, without calling the provider', async () => {
		const fake = new FakeSpeechClient();
		const { app } = newApp(fake);
		const cookie = await signedIn(app);
		const tooLarge = await sendRecording(app, cookie, { body: makeWav({ seconds: 6.5 }) });
		expect(tooLarge.status).toBe(413);
		expect(await tooLarge.json()).toMatchObject({ error: { code: 'payload_too_large' } });
		// 6 s still fit: a recording stopped a little after 5 s is accepted.
		expect(makeWav({ seconds: 6 }).length).toBeLessThan(SPEECH_BODY_LIMIT);
		expect((await sendRecording(app, cookie, { body: makeWav({ seconds: 6 }) })).status).toBe(200);
		expect(fake.calls).toHaveLength(1);
	});

	it('[AC-49] refuses a body that is not 16 kHz mono 16-bit PCM WAV with 400, without calling the provider', async () => {
		const fake = new FakeSpeechClient();
		const { app } = newApp(fake);
		const cookie = await signedIn(app);
		for (const body of [
			makeWav({ sampleRate: 48_000 }),
			makeWav({ channels: 2 }),
			makeWav({ seconds: 0 }),
			new TextEncoder().encode('not audio')
		]) {
			const response = await sendRecording(app, cookie, { body });
			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({ error: { code: 'invalid_input' } });
		}
		expect(fake.calls).toHaveLength(0);
	});

	it('refuses a missing word with 400 and a word the corpus does not have with 400 unknown_word', async () => {
		const { app } = newApp();
		const cookie = await signedIn(app);
		const missing = await app.request('/api/speech/recognitions', {
			method: 'POST',
			headers: { Origin: publicUrl, 'Content-Type': 'audio/wav', Cookie: cookie },
			body: makeWav()
		});
		expect(missing.status).toBe(400);
		const unknown = await sendRecording(app, cookie, { word: 'абв' });
		expect(unknown.status).toBe(400);
		expect(await unknown.json()).toMatchObject({ error: { code: 'unknown_word' } });
	});

	it('[AC-46] answers 429 speech_quota_reached once the user reached their limit', async () => {
		const { app } = newApp(new FakeSpeechClient(), 1);
		const cookie = await signedIn(app);
		expect((await sendRecording(app, cookie)).status).toBe(200);
		const refused = await sendRecording(app, cookie);
		expect(refused.status).toBe(429);
		expect(await refused.json()).toMatchObject({ error: { code: 'speech_quota_reached' } });
	});

	it('[AC-45] reports read aloud off in GET /api/me when there is no speech provider, and every try is unavailable', async () => {
		const { app } = newApp(null);
		const cookie = await signedIn(app);
		const me = await app.request('/api/me', { headers: { Cookie: cookie } });
		expect(await me.json()).toMatchObject({ features: { readAloud: false } });
		expect(await (await sendRecording(app, cookie)).json()).toEqual({ outcome: 'unavailable' });
	});

	it('[AC-47] logs the outcome of a try, never the word, the text heard or the audio', async () => {
		const { app, lines } = newApp(new FakeSpeechClient({ status: 'success', text: 'мляко' }));
		await sendRecording(app, await signedIn(app));
		const line = lines.at(-1) ?? '';
		expect(line).toMatch(/^POST \/api\/speech\/recognitions 200 \d+ms mismatch$/);
		expect(lines.join('\n')).not.toMatch(/котка|мляко|word=/);
	});
});
