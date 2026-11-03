// `npm run db:migrate`: applies the pending migrations, then the seed. Run once per deployment,
// before the API starts (the `migrate` service of compose.yaml).
import { ConfigError, loadDatabaseUrl } from '../config.js';
import { createDb } from './database.js';
import { migrate } from './migrate.js';
import { seed } from './seed.js';

try {
	const databaseUrl = loadDatabaseUrl(process.env);
	const applied = await migrate(databaseUrl);
	console.log(applied.length ? `Applied ${applied.join(', ')}` : 'No pending migration');
	const db = createDb(databaseUrl);
	try {
		await seed(db);
	} finally {
		await db.destroy();
	}
	console.log('Seed loaded');
} catch (error) {
	console.error(error instanceof ConfigError ? error.message : error);
	process.exitCode = 1;
}
