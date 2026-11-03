// `npm run db:migrate`: applies the pending migrations, then the seed. Run once per deployment,
// before the API starts (the `migrate` service of compose.yaml). Outside production it also
// creates the demo accounts.
import { hashPassword } from '../auth/passwords.js';
import { ConfigError, loadDatabaseUrl } from '../config.js';
import { createDb } from './database.js';
import { DEMO_EMAILS, seedDemoAccounts } from './demo-accounts.js';
import { migrate } from './migrate.js';
import { seed } from './seed.js';

try {
	const databaseUrl = loadDatabaseUrl(process.env);
	const applied = await migrate(databaseUrl);
	console.log(applied.length ? `Applied ${applied.join(', ')}` : 'No pending migration');
	const db = createDb(databaseUrl);
	try {
		await seed(db);
		console.log('Seed loaded');
		if (process.env.NODE_ENV !== 'production') await createDemoAccounts(db);
	} finally {
		await db.destroy();
	}
} catch (error) {
	console.error(error instanceof ConfigError ? error.message : error);
	process.exitCode = 1;
}

async function createDemoAccounts(db: ReturnType<typeof createDb>) {
	const created = await seedDemoAccounts(db, hashPassword);
	if (!created.length) {
		console.log(`Demo accounts already exist (${DEMO_EMAILS.join(', ')})`);
		return;
	}
	// The one exception to "never log a password", asked by the project owner: these accounts
	// exist in development only, and their passwords can be shown nowhere else.
	console.log('Demo accounts created. Note their passwords now, they are not shown again:');
	for (const { email, password } of created) console.log(`  ${email}  ${password}`);
}
