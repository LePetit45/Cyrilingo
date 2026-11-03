import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { afterEach, beforeEach, describe, expect, inject, it } from 'vitest';
import { listMigrations, migrate } from './migrate.js';
import { createScratchDatabase, type ScratchDatabase } from './testing.js';

let database: ScratchDatabase;
let directory: string;

beforeEach(async () => {
	database = await createScratchDatabase(inject('testServerUrl'));
	directory = await mkdtemp(path.join(tmpdir(), 'cyrilingo-migrations-'));
});

afterEach(async () => {
	await database.drop();
	await rm(directory, { recursive: true });
});

async function query<Row extends pg.QueryResultRow>(text: string): Promise<Row[]> {
	const client = new pg.Client({ connectionString: database.url });
	await client.connect();
	try {
		return (await client.query<Row>(text)).rows;
	} finally {
		await client.end();
	}
}

const tablesAndColumns = () =>
	query(`SELECT table_name, column_name, data_type FROM information_schema.columns
		WHERE table_schema = 'public' ORDER BY table_name, column_name`);

describe('migrate', () => {
	it('[AC-70] applies the migrations in order, each once, and running them again changes nothing', async () => {
		// 0002 needs the table of 0001: it only works if they run in that order.
		await writeFile(path.join(directory, '0002_add_b.sql'), 'ALTER TABLE a ADD COLUMN b text;');
		await writeFile(path.join(directory, '0001_create_a.sql'), 'CREATE TABLE a (id int);');

		expect(await migrate(database.url, directory)).toEqual(['0001_create_a', '0002_add_b']);
		const schema = await tablesAndColumns();
		expect(await migrate(database.url, directory)).toEqual([]);
		expect(await tablesAndColumns()).toEqual(schema);
		expect(await query('SELECT version FROM schema_migrations ORDER BY version')).toEqual([
			{ version: '0001_create_a' },
			{ version: '0002_add_b' }
		]);
	});

	it('[AC-70] applies only the new migrations of a database already migrated', async () => {
		await writeFile(path.join(directory, '0001_create_a.sql'), 'CREATE TABLE a (id int);');
		await migrate(database.url, directory);
		await writeFile(path.join(directory, '0002_add_b.sql'), 'ALTER TABLE a ADD COLUMN b text;');
		expect(await migrate(database.url, directory)).toEqual(['0002_add_b']);
	});

	it('[AC-70] rolls a failing migration back entirely and does not record it', async () => {
		await writeFile(path.join(directory, '0001_create_a.sql'), 'CREATE TABLE a (id int);');
		await writeFile(
			path.join(directory, '0002_broken.sql'),
			'CREATE TABLE b (id int); SELECT * FROM missing_table;'
		);
		await expect(migrate(database.url, directory)).rejects.toThrow('Migration 0002_broken.sql');
		expect(await query(`SELECT to_regclass('b') AS b`)).toEqual([{ b: null }]);
		expect(await query('SELECT version FROM schema_migrations')).toEqual([
			{ version: '0001_create_a' }
		]);
	});

	it("applies the repository's migrations to an empty database", async () => {
		expect(await migrate(database.url)).toContain('0001_reference_data');
		expect(await query(`SELECT to_regclass('words') IS NOT NULL AS created`)).toEqual([
			{ created: true }
		]);
	});
});

describe('listMigrations', () => {
	it('refuses files that are not numbered like 0001_name.sql', async () => {
		await writeFile(path.join(directory, 'create_a.sql'), '');
		await expect(listMigrations(directory)).rejects.toThrow('must be named like 0001_create_x.sql');
	});

	it('refuses two files with the same number', async () => {
		await writeFile(path.join(directory, '0001_a.sql'), '');
		await writeFile(path.join(directory, '0001_b.sql'), '');
		await expect(listMigrations(directory)).rejects.toThrow(
			'Two migration files have the number 0001'
		);
	});
});
