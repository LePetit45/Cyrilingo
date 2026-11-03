import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

/** apps/api/migrations/ */
export const MIGRATIONS_DIR = path.resolve(import.meta.dirname, '../../migrations');

const FILE_NAME = /^(\d{4})_[a-z0-9_]+\.sql$/;

// Any constant shared by every runner: two runners started at once wait for each other.
const LOCK_ID = 7_203_651;

/**
 * Applies the migrations not applied yet, in the order of their numbers, each in its own
 * transaction, and records each one in `schema_migrations`. Returns the names applied.
 */
export async function migrate(databaseUrl: string, directory = MIGRATIONS_DIR): Promise<string[]> {
	const migrations = await listMigrations(directory);
	const client = new pg.Client({ connectionString: databaseUrl });
	await client.connect();
	try {
		await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
		await client.query(`
			CREATE TABLE IF NOT EXISTS schema_migrations (
				version text PRIMARY KEY,
				applied_at timestamptz NOT NULL DEFAULT now()
			)`);
		const { rows } = await client.query<{ version: string }>(
			'SELECT version FROM schema_migrations'
		);
		const applied = new Set(rows.map((row) => row.version));

		const done: string[] = [];
		for (const migration of migrations.filter(({ version }) => !applied.has(version))) {
			const statements = await readFile(path.join(directory, migration.file), 'utf8');
			try {
				await client.query('BEGIN');
				await client.query(statements);
				await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [
					migration.version
				]);
				await client.query('COMMIT');
			} catch (error) {
				await client.query('ROLLBACK');
				throw new Error(`Migration ${migration.file} failed`, { cause: error });
			}
			done.push(migration.version);
		}
		return done;
	} finally {
		await client.end();
	}
}

/** The migration files of a directory, sorted by number; refuses badly named or duplicate ones. */
export async function listMigrations(
	directory: string
): Promise<{ file: string; version: string }[]> {
	const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
	const numbers = new Set<string>();
	return files.map((file) => {
		const number = FILE_NAME.exec(file)?.[1];
		if (!number) throw new Error(`Migration file ${file} must be named like 0001_create_x.sql`);
		if (numbers.has(number)) throw new Error(`Two migration files have the number ${number}`);
		numbers.add(number);
		return { file, version: file.slice(0, -'.sql'.length) };
	});
}
