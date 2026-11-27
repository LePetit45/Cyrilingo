import { randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterAll, afterEach, describe, expect, inject, it, vi } from 'vitest';
import { hashToken } from '../auth/tokens.js';
import { createDb } from '../db/database.js';
import { createApp } from '../http/app.js';
import { createServices, type Services } from '../services/index.js';
import { createMcpServer, McpStartError } from './server.js';

const publicUrl = 'https://cyrilingo.example';
const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

// One set of services behind both front doors, as in production: the HTTP API and the MCP server.
const services = createServices(db);
// Behind a trusted proxy, so each learner signs up from an address of their own (AC-26).
const app = createApp({ config: { publicUrl, trustProxy: true }, services, log: () => {} });

const clients: Client[] = [];
afterEach(async () => {
	vi.restoreAllMocks();
	await Promise.all(clients.splice(0).map((client) => client.close()));
});

function http(method: string, path: string, cookie: string, body?: unknown) {
	return app.request(`/api${path}`, {
		method,
		headers: {
			Origin: publicUrl,
			Cookie: cookie,
			...(body === undefined ? {} : { 'Content-Type': 'application/json' })
		},
		body: body === undefined ? undefined : JSON.stringify(body)
	});
}

interface Learner {
	userId: string;
	/** The browser session cookie, `session=…`. */
	cookie: string;
	/** The account's agent key, made in the settings. */
	token: string;
}

/** Signs a new learner up through the API, then creates an agent token for them. */
async function newLearner(): Promise<Learner> {
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
	const created = await http('POST', '/me/agent-token', cookie);
	const { token } = (await created.json()) as { token: string };
	const session = await services.auth.authenticate(cookie.slice('session='.length));
	return { userId: session!.userId, cookie, token };
}

/** An MCP client connected, in memory, to a server started with this token. */
async function connect(token: string, withServices: Services = services): Promise<Client> {
	const server = await createMcpServer(withServices, token);
	const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
	await server.connect(serverSide);
	const client = new Client({ name: 'cyrilingo-tests', version: '1.0.0' });
	await client.connect(clientSide);
	clients.push(client);
	return client;
}

/** Calls a tool and parses its JSON answer. */
async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
	const result = await client.callTool({ name, arguments: args });
	const [content] = result.content as { type: string; text: string }[];
	return { isError: result.isError === true, body: JSON.parse(content!.text) as unknown };
}

/** The reason `createMcpServer` refuses to start, or undefined when it starts. */
async function startRefusal(token: string | undefined, withServices: Services = services) {
	const outcome = await createMcpServer(withServices, token).then(
		() => undefined,
		(error: unknown) => error
	);
	if (outcome !== undefined) expect(outcome).toBeInstanceOf(McpStartError);
	return outcome;
}

const TOOLS = [
	'add_word_to_list',
	'create_word_list',
	'delete_word_list',
	'get_progress',
	'list_lessons',
	'list_word_lists'
];

describe('MCP server', () => {
	it('[AC-50] lists 6 tools, each with a description of at least 20 characters', async () => {
		const { tools } = await (await connect((await newLearner()).token)).listTools();
		expect(tools.map(({ name }) => name).sort()).toEqual(TOOLS);
		for (const tool of tools) expect(tool.description?.length).toBeGreaterThanOrEqual(20);
	});

	it('[AC-51] read tools answer exactly what their HTTP route answers', async () => {
		const learner = await newLearner();
		await http('PATCH', '/progress', learner.cookie, {
			completedLessons: ['l1', 'l2'],
			examPassed: false
		});
		const list = (await (
			await http('POST', '/word-lists', learner.cookie, { name: 'Animaux' })
		).json()) as {
			id: string;
		};
		await http('POST', `/word-lists/${list.id}/words`, learner.cookie, { word: 'котка' });
		const client = await connect(learner.token);

		for (const [tool, path] of [
			['list_lessons', '/lessons'],
			['get_progress', '/progress'],
			['list_word_lists', '/word-lists']
		] as const) {
			const answer = await call(client, tool);
			expect(answer.isError).toBe(false);
			expect(answer.body).toEqual(await (await http('GET', path, learner.cookie)).json());
		}
	});

	it('[AC-51] each tool calls the same service function as its HTTP route, as the token’s user', async () => {
		const learner = await newLearner();
		const client = await connect(learner.token);
		const { userId, cookie } = learner;
		const spy = <T extends object>(service: T, method: keyof T & string) =>
			vi.spyOn(service, method as never) as unknown as { mock: { calls: unknown[][] } };

		const lessons = spy(services.lessons, 'list');
		await call(client, 'list_lessons');
		await http('GET', '/lessons', cookie);
		expect(lessons.mock.calls).toEqual([[userId], [userId]]);

		const progress = spy(services.progress, 'get');
		await call(client, 'get_progress');
		await http('GET', '/progress', cookie);
		expect(progress.mock.calls).toEqual([[userId], [userId]]);

		const list = spy(services.wordLists, 'list');
		await call(client, 'list_word_lists');
		await http('GET', '/word-lists', cookie);
		expect(list.mock.calls).toEqual([[userId], [userId]]);

		const create = spy(services.wordLists, 'create');
		const viaMcp = await call(client, 'create_word_list', { name: 'Mots' });
		const viaHttp = await (await http('POST', '/word-lists', cookie, { name: 'Mots' })).json();
		expect(create.mock.calls).toEqual([
			[userId, 'Mots'],
			[userId, 'Mots']
		]);
		const shape = { id: expect.any(String), name: 'Mots', words: [] };
		expect(viaMcp.body).toMatchObject(shape);
		expect(viaHttp).toMatchObject(shape);
		const mcpList = (viaMcp.body as { id: string }).id;
		const httpList = (viaHttp as { id: string }).id;

		const addWord = spy(services.wordLists, 'addWord');
		const added = await call(client, 'add_word_to_list', { listId: mcpList, word: 'котка' });
		await http('POST', `/word-lists/${httpList}/words`, cookie, { word: 'котка' });
		expect(addWord.mock.calls).toEqual([
			[userId, mcpList, 'котка'],
			[userId, httpList, 'котка']
		]);
		expect(added.body).toMatchObject({ words: [{ cyrillic: 'котка', latin: 'kotka' }] });

		const remove = spy(services.wordLists, 'remove');
		expect(await call(client, 'delete_word_list', { listId: mcpList })).toEqual({
			isError: false,
			body: { deleted: true }
		});
		await http('DELETE', `/word-lists/${httpList}`, cookie);
		expect(remove.mock.calls).toEqual([
			[userId, mcpList],
			[userId, httpList]
		]);
		expect(await call(client, 'list_word_lists')).toEqual({ isError: false, body: [] });
	});

	it('[AC-51] refuses with the same errors as the HTTP routes, another learner’s list included', async () => {
		const owner = await newLearner();
		const other = await newLearner();
		const ownersList = (await (
			await http('POST', '/word-lists', owner.cookie, { name: 'À moi' })
		).json()) as {
			id: string;
		};
		const othersList = (await (
			await http('POST', '/word-lists', other.cookie, { name: 'Ma liste' })
		).json()) as {
			id: string;
		};
		const client = await connect(other.token);

		const cases: [string, Record<string, unknown>, string, string, unknown][] = [
			// Somebody else's list is "not found", exactly like a missing one (AC-32).
			[
				'delete_word_list',
				{ listId: ownersList.id },
				'DELETE',
				`/word-lists/${ownersList.id}`,
				undefined
			],
			[
				'add_word_to_list',
				{ listId: ownersList.id, word: 'котка' },
				'POST',
				`/word-lists/${ownersList.id}/words`,
				{ word: 'котка' }
			],
			[
				'delete_word_list',
				{ listId: randomUUID() },
				'DELETE',
				`/word-lists/${randomUUID()}`,
				undefined
			],
			['delete_word_list', { listId: 'not-an-id' }, 'DELETE', '/word-lists/not-an-id', undefined],
			[
				'add_word_to_list',
				{ listId: othersList.id, word: 'xyz' },
				'POST',
				`/word-lists/${othersList.id}/words`,
				{ word: 'xyz' }
			],
			['create_word_list', { name: '   ' }, 'POST', '/word-lists', { name: '   ' }]
		];
		for (const [tool, args, method, path, body] of cases) {
			const viaMcp = await call(client, tool, args);
			const viaHttp = await http(method, path, other.cookie, body);
			expect(viaHttp.ok).toBe(false);
			expect(viaMcp).toEqual({ isError: true, body: await viaHttp.json() });
		}
		// The owner's list is still there.
		const lists = (await (await http('GET', '/word-lists', owner.cookie)).json()) as unknown[];
		expect(lists).toHaveLength(1);
	});

	it('[AC-52] refuses to start without a valid agent token', async () => {
		const learner = await newLearner();
		expect(await startRefusal(undefined)).toBeDefined();
		expect(await startRefusal('   ')).toBeDefined();
		expect(await startRefusal('an unknown token')).toBeDefined();
		// A browser session is no agent token.
		expect(await startRefusal(learner.cookie.slice('session='.length))).toBeDefined();
		// 31 days later, the token has expired.
		const later = createServices(db, undefined, {
			now: () => new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
		});
		expect(await startRefusal(learner.token, later)).toBeDefined();
		expect(await startRefusal(learner.token)).toBeUndefined();
	});

	it('[AC-52] acts as the token’s user only: no tool takes a user, and other learners’ data stays out', async () => {
		const me = await newLearner();
		const someoneElse = await newLearner();
		await http('POST', '/word-lists', someoneElse.cookie, { name: 'Pas à toi' });
		await http('PATCH', '/progress', someoneElse.cookie, {
			completedLessons: ['l1'],
			examPassed: true
		});
		const client = await connect(me.token);

		const { tools } = await client.listTools();
		for (const tool of tools) {
			for (const field of Object.keys(tool.inputSchema.properties ?? {})) {
				expect(field).not.toMatch(/user|token|email/i);
			}
		}
		expect((await call(client, 'list_word_lists')).body).toEqual([]);
		expect((await call(client, 'get_progress')).body).toEqual({
			completedLessons: [],
			examPassed: false
		});
		// And an agent token opens no browser session.
		expect((await http('GET', '/me', `session=${me.token}`)).status).toBe(401);
	});
});

describe('/api/me/agent-token', () => {
	it('[AC-53] regenerates the account’s one agent key, of which only the hash is stored', async () => {
		const learner = await newLearner();
		const me = async () => (await http('GET', '/me', learner.cookie)).json();
		expect(await me()).toMatchObject({ hasAgentToken: true });

		const response = await http('POST', '/me/agent-token', learner.cookie);
		expect(response.status).toBe(201);
		const { token, expiresAt } = (await response.json()) as { token: string; expiresAt: string };
		expect(token).toMatch(/^[\w-]{43}$/);
		expect(token).not.toBe(learner.token);
		expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());

		// One key per account: the new one replaced the first, and only its hash is stored.
		const stored = await db
			.selectFrom('sessions')
			.select(['id', 'kind'])
			.where('user_id', '=', learner.userId)
			.where('kind', '=', 'agent')
			.execute();
		expect(stored).toEqual([{ id: hashToken(token), kind: 'agent' }]);
		// The account tells whether a key exists, never the key.
		expect(JSON.stringify(await me())).not.toContain(token);
	});

	it('[AC-53] regenerating refuses the previous key to the MCP server, even one already running', async () => {
		const learner = await newLearner();
		const running = await connect(learner.token);

		const { token } = (await (await http('POST', '/me/agent-token', learner.cookie)).json()) as {
			token: string;
		};
		expect(await startRefusal(learner.token)).toBeDefined();
		expect(await call(running, 'list_word_lists')).toEqual({
			isError: true,
			body: { error: { code: 'unauthenticated', message: expect.any(String) } }
		});
		// The new key works, and the browser session stays.
		expect(await call(await connect(token), 'list_word_lists')).toEqual({
			isError: false,
			body: []
		});
		expect((await http('GET', '/me', learner.cookie)).status).toBe(200);
	});

	it('tells that the account has no key before the first one, or once it expired', async () => {
		const services31DaysLater = createServices(db, undefined, {
			now: () => new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
		});
		const learner = await newLearner();
		expect(await services31DaysLater.account.get(learner.userId)).toMatchObject({
			hasAgentToken: false
		});
		await db
			.deleteFrom('sessions')
			.where('user_id', '=', learner.userId)
			.where('kind', '=', 'agent')
			.execute();
		expect(await services.account.get(learner.userId)).toMatchObject({ hasAgentToken: false });
	});

	it('answers 401 without a session', async () => {
		expect((await http('POST', '/me/agent-token', '')).status).toBe(401);
	});
});
