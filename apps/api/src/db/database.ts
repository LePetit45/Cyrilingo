import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';
import type { Database } from './schema.js';

export type Db = Kysely<Database>;

/** Opens a connection pool. Call `destroy()` on the result to close it. */
export function createDb(databaseUrl: string): Db {
	const pool = new pg.Pool({
		connectionString: databaseUrl,
		// An unreachable database fails fast instead of holding the request.
		connectionTimeoutMillis: 5_000
	});
	// An idle client losing its connection must not crash the process; the next query reconnects.
	pool.on('error', () => {});
	return new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });
}

/** True when the database answers a trivial query. */
export async function ping(db: Db): Promise<boolean> {
	try {
		await sql`SELECT 1`.execute(db);
		return true;
	} catch {
		return false;
	}
}
