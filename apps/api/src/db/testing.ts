// Throwaway databases for the tests (SPEC.md › Tests and coverage). Test code only.
import { randomBytes } from 'node:crypto';
import pg from 'pg';

export interface ScratchDatabase {
	url: string;
	drop(): Promise<void>;
}

/** The server tests create their databases on: `TEST_DATABASE_URL`, else `DATABASE_URL`. */
export function testServerUrl(env: Record<string, string | undefined> = process.env): string {
	const url = env.TEST_DATABASE_URL || env.DATABASE_URL;
	if (!url) {
		throw new Error(
			'The API tests need PostgreSQL: run `docker compose up db` and set DATABASE_URL in .env'
		);
	}
	return url;
}

/** Creates an empty database with a random name on the same server, and a way to drop it. */
export async function createScratchDatabase(serverUrl: string): Promise<ScratchDatabase> {
	const name = `cyrilingo_test_${randomBytes(6).toString('hex')}`;
	await onServer(serverUrl, (client) => client.query(`CREATE DATABASE ${name}`));
	const url = new URL(serverUrl);
	url.pathname = `/${name}`;
	return {
		url: url.toString(),
		drop: () => onServer(serverUrl, (client) => client.query(`DROP DATABASE ${name} WITH (FORCE)`))
	};
}

async function onServer(serverUrl: string, run: (client: pg.Client) => Promise<unknown>) {
	const client = new pg.Client({ connectionString: serverUrl });
	await client.connect();
	try {
		await run(client);
	} finally {
		await client.end();
	}
}
