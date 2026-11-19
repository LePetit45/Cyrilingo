import pg from 'pg';

// Direct access to the end-to-end API's database (apps/api/src/e2e-server.ts): `cyrilingo_e2e`
// on the test server, for tests that change data behind the app's back.

function e2eDatabaseUrl(): string {
	if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
		try {
			process.loadEnvFile('.env');
		} catch {
			// No .env: CI sets TEST_DATABASE_URL.
		}
	}
	const server = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
	if (!server) throw new Error('Set TEST_DATABASE_URL or DATABASE_URL, as for the API tests');
	const url = new URL(server);
	url.pathname = '/cyrilingo_e2e';
	return url.toString();
}

/** Runs one SQL statement on the end-to-end database. */
export async function e2eQuery(text: string, values: unknown[] = []): Promise<unknown[]> {
	const client = new pg.Client({ connectionString: e2eDatabaseUrl() });
	await client.connect();
	try {
		return (await client.query(text, values)).rows;
	} finally {
		await client.end();
	}
}
