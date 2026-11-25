import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SERVICE_ERRORS } from '../http/errors.js';
import { ServiceError } from '../services/errors.js';
import type { Services } from '../services/index.js';

/** The token was revoked or expired while the server ran: every tool is refused from then on. */
export class Unauthenticated extends Error {
	override name = 'Unauthenticated';
}

/**
 * The user the agent acts as, checked again on every call so that revoking the token stops a
 * running server (AC-53). No tool takes a user id: the token is the only way to name one (AC-52).
 */
export type ActingUser = () => Promise<string>;

// The same loose bounds as the HTTP routes, against oversized input; the services check the real
// rules (name length, list id, corpus word), so a tool and its route refuse alike (AC-51).
const listId = z.string().max(100).describe('The id of one of the learner’s word lists');
const listName = z.string().max(200).describe('The list name, 1 to 40 characters once trimmed');
const word = z.string().max(100).describe('A word of the Cyrilingo corpus, written in Cyrillic');

/**
 * Declares the 6 tools of SPEC.md › MCP tools. Each one validates its input, calls the same
 * service function as its HTTP route, and answers the same JSON (AC-50, AC-51).
 */
export function registerTools(server: McpServer, services: Services, actingUser: ActingUser) {
	const { lessons, progress, wordLists } = services;
	const run = (call: (userId: string) => Promise<unknown>) => answer(actingUser, call);

	server.registerTool(
		'list_lessons',
		{
			description:
				'List the 10 lessons of the course in order, with the letters each one teaches and whether the learner completed it.',
			annotations: { readOnlyHint: true }
		},
		() => run((userId) => lessons.list(userId))
	);

	server.registerTool(
		'get_progress',
		{
			description:
				'Get the learner’s progress: completed lesson ids and whether the final exam was passed.',
			annotations: { readOnlyHint: true }
		},
		() => run((userId) => progress.get(userId))
	);

	server.registerTool(
		'list_word_lists',
		{
			description:
				'List the learner’s personal word lists, with the Cyrillic words and their official Latin transliteration.',
			annotations: { readOnlyHint: true }
		},
		() => run((userId) => wordLists.list(userId))
	);

	server.registerTool(
		'create_word_list',
		{
			description:
				'Create a new, empty personal word list with the given name (1 to 40 characters).',
			inputSchema: { name: listName }
		},
		({ name }) => run((userId) => wordLists.create(userId, name))
	);

	server.registerTool(
		'add_word_to_list',
		{
			description:
				'Add a word from the Cyrilingo corpus (written in Cyrillic) to one of the learner’s word lists.',
			inputSchema: { listId, word }
		},
		({ listId, word }) => run((userId) => wordLists.addWord(userId, listId, word))
	);

	server.registerTool(
		'delete_word_list',
		{
			description:
				'Delete one of the learner’s word lists and every word in it. This cannot be undone.',
			inputSchema: { listId },
			annotations: { destructiveHint: true }
		},
		({ listId }) =>
			run(async (userId) => {
				await wordLists.remove(userId, listId);
				return { deleted: true };
			})
	);
}

/**
 * Runs a service call as the acting user. The result is the JSON the HTTP route answers; a
 * refusal is a tool error carrying the same `{"error": {"code", "message"}}` as the route.
 */
async function answer(
	actingUser: ActingUser,
	call: (userId: string) => Promise<unknown>
): Promise<CallToolResult> {
	try {
		return json(await call(await actingUser()));
	} catch (error) {
		if (error instanceof ServiceError) {
			return refusal(error.code, SERVICE_ERRORS[error.code].message);
		}
		if (error instanceof Unauthenticated) {
			return refusal('unauthenticated', 'The agent token is unknown, expired or revoked');
		}
		// Nothing about the failure reaches the agent: it may hold data it must not see.
		console.error(`MCP tool failed: ${error instanceof Error ? error.name : 'unknown error'}`);
		return refusal('internal', 'Internal error');
	}
}

function json(value: unknown, isError = false): CallToolResult {
	return { content: [{ type: 'text', text: JSON.stringify(value) }], isError };
}

function refusal(code: string, message: string): CallToolResult {
	return json({ error: { code, message } }, true);
}
