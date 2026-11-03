// The API as the end-to-end tests use it (`npm run e2e -w @cyrilingo/api`, started by
// playwright.config.ts): a fresh `cyrilingo_e2e` database on the test server, migrated and
// seeded, then the server itself. PUBLIC_URL and API_PORT come from Playwright.
import { createDb } from './db/database.js';
import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';
import { recreateDatabase, testServerUrl } from './db/testing.js';

const { url } = await recreateDatabase(testServerUrl(), 'cyrilingo_e2e');
await migrate(url);
const db = createDb(url);
await seed(db);
await db.destroy();

process.env.DATABASE_URL = url;
await import('./main.js');
