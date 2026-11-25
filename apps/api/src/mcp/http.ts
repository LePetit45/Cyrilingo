import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { errorResponse } from '../http/errors.js';
import type { Services } from '../services/index.js';
import { createMcpServer, McpStartError } from './server.js';

/** A tool call is a few hundred bytes: 64 KB is ample, and keeps big bodies out. */
const MCP_BODY_LIMIT = 64 * 1024;

/**
 * `/mcp`: the same MCP server as `npm run mcp`, over Streamable HTTP, so any learner can plug in
 * their agent (SPEC.md › MCP tools). The account's agent key comes as `Authorization: Bearer …`.
 *
 * Stateless: each POST builds a server for the key it carries, answers in JSON and is closed, so
 * the key is checked on every request and nothing is kept between them. There is no SSE stream
 * to open (GET) nor session to end (DELETE).
 */
export function mcpRoutes(services: Services, publicUrl: string) {
	return new Hono()
		.post(
			'/',
			bodyLimit({
				maxSize: MCP_BODY_LIMIT,
				onError: (c) => errorResponse(c, 413, 'payload_too_large', 'The body is too large')
			}),
			async (c) => {
				// Agents send no Origin; a web page does. Only the app's own origin may call (the MCP
				// specification asks servers to check it, against DNS rebinding).
				const origin = c.req.header('Origin');
				if (origin !== undefined && origin !== publicUrl) {
					return errorResponse(c, 403, 'forbidden', 'Origin not allowed');
				}

				let server;
				try {
					server = await createMcpServer(services, bearerToken(c.req.header('Authorization')));
				} catch (error) {
					if (!(error instanceof McpStartError)) throw error;
					c.header('WWW-Authenticate', 'Bearer');
					return errorResponse(c, 401, 'unauthenticated', 'A valid agent key is required');
				}

				const transport = new WebStandardStreamableHTTPServerTransport({
					sessionIdGenerator: undefined,
					enableJsonResponse: true
				});
				await server.connect(transport);
				try {
					return await transport.handleRequest(c.req.raw);
				} finally {
					await server.close();
				}
			}
		)
		.on(['GET', 'DELETE'], '/', (c) => {
			c.header('Allow', 'POST');
			return errorResponse(c, 405, 'method_not_allowed', 'Only POST: this server is stateless');
		});
}

/** The token of an `Authorization: Bearer <token>` header, if there is one. */
function bearerToken(header: string | undefined): string | undefined {
	const match = /^Bearer\s+(\S+)\s*$/i.exec(header ?? '');
	return match?.[1];
}
