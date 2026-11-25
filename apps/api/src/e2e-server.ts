// The API as the end-to-end tests use it (`npm run e2e -w @cyrilingo/api`, started by
// playwright.config.ts): a fresh `cyrilingo_e2e` database on the test server, migrated and
// seeded, then the server itself. PUBLIC_URL and API_PORT come from Playwright.
//
// No real provider is ever called, whatever the local .env holds: Google sign-in is off, and
// read aloud is on with a fake model that always hears « абв », a text no lesson asks, so every
// try is a mismatch, which the tests use to walk through the second try.
import { loadConfig } from './config.js';
import { createDb } from './db/database.js';
import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';
import { recreateDatabase, testServerUrl } from './db/testing.js';
import { startServer } from './server.js';
import { FakeSpeechClient } from './speech/testing.js';

/** What the fake model hears, whatever the recording. */
const E2E_HEARD = 'абв';

const { url } = await recreateDatabase(testServerUrl(), 'cyrilingo_e2e');
await migrate(url);
const db = createDb(url);
await seed(db);
await db.destroy();

const settings: Record<string, string | undefined> = { ...process.env, DATABASE_URL: url };
for (const name of ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'AZURE_SPEECH_KEY']) {
	delete settings[name];
}
startServer(loadConfig(settings), {
	speechClient: new FakeSpeechClient({ status: 'success', text: E2E_HEARD })
});
