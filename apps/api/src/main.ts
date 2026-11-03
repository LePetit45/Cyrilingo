// Starts the API server: `npm run dev` (with hot reload) or `npm start -w @cyrilingo/api`.
import { serve } from '@hono/node-server';
import { ConfigError, loadConfig, type Config } from './config.js';
import { createDb } from './db/database.js';
import { createApp } from './http/app.js';
import { createServices } from './services/index.js';

let config: Config;
try {
	config = loadConfig(process.env);
} catch (error) {
	if (!(error instanceof ConfigError)) throw error;
	console.error(error.message);
	process.exit(1);
}

const db = createDb(config.databaseUrl);
const app = createApp({ config, services: createServices(db, config) });

const server = serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
	console.log(`API listening on port ${port}`);
	if (!config.google) console.log('Google sign-in is off (GOOGLE_CLIENT_ID or SECRET missing)');
	if (!config.azureSpeech) console.log('Read aloud is off (AZURE_SPEECH_KEY or REGION missing)');
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => {
		server.close();
		void db.destroy();
	});
}
