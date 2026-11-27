// Starts the MCP server on stdio: `npm run --silent mcp`, with DATABASE_URL and
// CYRILINGO_SESSION_TOKEN set (SPEC.md › MCP tools). Stdout carries the protocol only: every
// message for a person goes to stderr.
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ConfigError, loadDatabaseUrl } from './config.js';
import { createDb } from './db/database.js';
import { createServices } from './services/index.js';
import { createMcpServer, McpStartError } from './mcp/server.js';

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}

let databaseUrl: string;
try {
	databaseUrl = loadDatabaseUrl(process.env);
} catch (error) {
	if (!(error instanceof ConfigError)) throw error;
	fail(error.message);
}

const db = createDb(databaseUrl);
try {
	const server = await createMcpServer(createServices(db), process.env.CYRILINGO_SESSION_TOKEN);
	const transport = new StdioServerTransport();
	transport.onclose = () => void db.destroy();
	await server.connect(transport);
	// The agent closed the pipe: close the server, which closes the database pool.
	process.stdin.on('close', () => void server.close());
	console.error('Cyrilingo MCP server ready on stdio');
} catch (error) {
	await db.destroy();
	fail(
		error instanceof McpStartError
			? error.message
			: 'The MCP server could not start: is the database reachable at DATABASE_URL?'
	);
}
