import { serve } from '@hono/node-server';
import type { Config } from './config.js';
import { createDb } from './db/database.js';
import { createApp } from './http/app.js';
import { createServices, type ServiceOptions } from './services/index.js';

/**
 * Starts the API server on the configured port, until SIGINT or SIGTERM. `options` lets the
 * end-to-end API stand a fake in for a provider; `main.ts` passes none.
 */
export function startServer(config: Config, options: ServiceOptions = {}) {
	const db = createDb(config.databaseUrl);
	const services = createServices(db, config, options);
	const app = createApp({ config, services });

	const server = serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
		console.log(`API listening on port ${port}`);
		for (const warning of config.warnings) console.warn(warning);
		if (!services.features.google) {
			console.log('Google sign-in is off (GOOGLE_CLIENT_ID or SECRET missing)');
		}
		if (!services.features.readAloud) {
			console.log('Read aloud is off (AZURE_SPEECH_KEY or REGION missing)');
		}
	});

	for (const signal of ['SIGINT', 'SIGTERM'] as const) {
		process.on(signal, () => {
			server.close();
			void db.destroy();
		});
	}
}
