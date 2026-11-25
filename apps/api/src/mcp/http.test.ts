import { randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterAll, afterEach, describe, expect, inject, it } from 'vitest';
import { createDb } from '../db/database.js';
import { createApp } from '../http/app.js';
import { createServices } from '../services/index.js';

const publicUrl = 'https://cyrilingo.example';
const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

const services = createServices(db);
const app = createApp({ config: { publicUrl, trustProxy: true }, services, log: () => {} });

const clients: Client[] = [];
afterEach(async () => {
	await Promise.all(clients.splice(0).map((client) => client.close()));
});

/** Signs a learner up, makes their agent key, and answers the session cookie and the key. */
async function newLearner() {
	const signUp = await app.request('/api/auth/signup', {
		method: 'POST',
		headers: {
			Origin: publicUrl,
			'Content-Type': 'application/json',
			'X-Forwarded-For': randomUUID()
		},
		body: JSON.stringify({ email: `learner-${randomUUID()}@example.com`, password: 'a password' })
	});
	const cookie = signUp.headers.get('Set-Cookie')?.split(';')[0] ?? '';
	const regenerate = async () => {
		const response = await app.request('/api/me/agent-token', {
			method: 'POST',
			headers: { Origin: publicUrl, Cookie: cookie }
		});
		return ((await response.json()) as { token: string }).token;
	};
	return { cookie, key: await regenerate(), regenerate };
}

/** The SDK's own HTTP client, talking to `/mcp` of the app in memory. */
async function connect(key: string): Promise<Client> {
	const transport = new StreamableHTTPClientTransport(new URL(`${publicUrl}/mcp`), {
		requestInit: { headers: { Authorization: `Bearer ${key}` } },
		fetch: async (url, init) => app.request(String(url), init)
	});
	const client = new Client({ name: 'cyrilingo-tests', version: '1.0.0' });
	await client.connect(transport);
	clients.push(client);
	return client;
}

/** A raw JSON-RPC call to `/mcp`, as any HTTP client would send it. */
function post(
	headers: Record<string, string>,
	body: unknown = { jsonrpc: '2.0', id: 1, method: 'tools/list' }
) {
	return app.request('/mcp', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json, text/event-stream',
			...headers
		},
		body: JSON.stringify(body)
	});
}

describe('/mcp', () => {
	it('[AC-54] serves the 6 tools over HTTP to the SDK client, as the key’s learner', async () => {
		const learner = await newLearner();
		const client = await connect(learner.key);
		const { tools } = await client.listTools();
		expect(tools).toHaveLength(6);

		const created = await client.callTool({
			name: 'create_word_list',
			arguments: { name: 'Mots' }
		});
		expect(created.isError).toBeFalsy();
		const lists = await app.request('/api/word-lists', { headers: { Cookie: learner.cookie } });
		expect(await lists.json()).toEqual([expect.objectContaining({ name: 'Mots', words: [] })]);
	});

	it('[AC-54] answers 401 with WWW-Authenticate without a valid key, and refuses a replaced key', async () => {
		const learner = await newLearner();
		const browserSession = learner.cookie.slice('session='.length);
		const attempts: Record<string, string>[] = [
			{},
			{ Authorization: 'Bearer an-unknown-key' },
			{ Authorization: `Basic ${learner.key}` },
			// A browser session is no agent key.
			{ Authorization: `Bearer ${browserSession}` }
		];
		for (const headers of attempts) {
			const response = await post(headers);
			expect(response.status).toBe(401);
			expect(response.headers.get('WWW-Authenticate')).toBe('Bearer');
			expect(await response.json()).toMatchObject({ error: { code: 'unauthenticated' } });
		}

		const old = learner.key;
		expect((await post({ Authorization: `Bearer ${old}` })).status).toBe(200);
		await learner.regenerate();
		expect((await post({ Authorization: `Bearer ${old}` })).status).toBe(401);
	});

	it('[AC-54] refuses a web page of another origin, and accepts the app’s own', async () => {
		const { key } = await newLearner();
		const fromElsewhere = await post({
			Authorization: `Bearer ${key}`,
			Origin: 'https://evil.example'
		});
		expect(fromElsewhere.status).toBe(403);
		expect((await post({ Authorization: `Bearer ${key}`, Origin: publicUrl })).status).toBe(200);
	});

	it('answers 405 to GET and DELETE: the server is stateless', async () => {
		for (const method of ['GET', 'DELETE']) {
			const response = await app.request('/mcp', { method });
			expect(response.status).toBe(405);
			expect(response.headers.get('Allow')).toBe('POST');
		}
	});

	it('answers 413 to a body over 64 KB', async () => {
		const { key } = await newLearner();
		const response = await post(
			{ Authorization: `Bearer ${key}` },
			{ padding: 'a'.repeat(70_000) }
		);
		expect(response.status).toBe(413);
	});
});
