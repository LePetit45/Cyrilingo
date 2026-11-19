import { Hono } from 'hono';
import { z } from 'zod';
import type { Services } from '../services/index.js';
import { readJson } from './input.js';
import type { SessionCookies, SessionVariables } from './session.js';

// Loose bounds only, against oversized input: the service checks the real rules (name length,
// corpus word), so the MCP tools get the same checks.
const nameBody = z.object({ name: z.string().max(200) });
const wordBody = z.object({ word: z.string().max(100) });

/**
 * `/api/word-lists`: the signed-in learner's personal word lists. Each handler calls one function
 * of the word list service, which decides who may do what (SPEC.md › Authorization).
 */
export function wordListRoutes(services: Services, cookies: SessionCookies) {
	const lists = services.wordLists;
	return new Hono<{ Variables: SessionVariables }>()
		.use(cookies.require(services.auth))
		.get('/', async (c) => c.json(await lists.list(c.var.session.userId)))
		.post('/', async (c) => {
			const { name } = await readJson(c, nameBody);
			return c.json(await lists.create(c.var.session.userId, name), 201);
		})
		.patch('/:id', async (c) => {
			const { name } = await readJson(c, nameBody);
			return c.json(await lists.rename(c.var.session.userId, c.req.param('id'), name));
		})
		.delete('/:id', async (c) => {
			await lists.remove(c.var.session.userId, c.req.param('id'));
			return c.body(null, 204);
		})
		.post('/:id/words', async (c) => {
			const { word } = await readJson(c, wordBody);
			return c.json(await lists.addWord(c.var.session.userId, c.req.param('id'), word), 201);
		})
		.delete('/:id/words/:word', async (c) =>
			c.json(await lists.removeWord(c.var.session.userId, c.req.param('id'), c.req.param('word')))
		);
}
