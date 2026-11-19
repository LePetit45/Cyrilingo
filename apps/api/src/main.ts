// Starts the API server: `npm run dev` (with hot reload) or `npm start -w @cyrilingo/api`.
import { ConfigError, loadConfig, type Config } from './config.js';
import { startServer } from './server.js';

let config: Config;
try {
	config = loadConfig(process.env);
} catch (error) {
	if (!(error instanceof ConfigError)) throw error;
	console.error(error.message);
	process.exit(1);
}

startServer(config);
