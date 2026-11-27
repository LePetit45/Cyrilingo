import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Services } from '../services/index.js';
import { registerTools, Unauthenticated } from './tools.js';

/** The MCP server cannot start: the message says why, for the person running it. */
export class McpStartError extends Error {
	override name = 'McpStartError';
}

/**
 * The MCP server of SPEC.md › MCP tools, acting as the user of one agent token (AC-52). Refuses to
 * start when the key is missing, unknown, expired, replaced or a browser session; the key is
 * checked again on every tool call, so regenerating it stops a running server (AC-53).
 */
export async function createMcpServer(
	services: Services,
	token: string | undefined
): Promise<McpServer> {
	const agentToken = token?.trim();
	if (!agentToken) {
		throw new McpStartError(
			'CYRILINGO_SESSION_TOKEN is missing: regenerate the agent key in Cyrilingo’s settings'
		);
	}
	const authenticate = () => services.auth.authenticate(agentToken, 'agent');
	if (!(await authenticate())) {
		throw new McpStartError('CYRILINGO_SESSION_TOKEN is unknown, expired or was regenerated');
	}

	const server = new McpServer({ name: 'cyrilingo', version: '1.0.0' });
	registerTools(server, services, async () => {
		const session = await authenticate();
		if (!session) throw new Unauthenticated();
		return session.userId;
	});
	return server;
}
