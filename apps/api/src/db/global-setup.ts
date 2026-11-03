// Vitest global setup: one migrated and seeded throwaway database per run, dropped at the end.
import type { TestProject } from 'vitest/node';
import { createDb } from './database.js';
import { migrate } from './migrate.js';
import { seed } from './seed.js';
import { createScratchDatabase, testServerUrl } from './testing.js';

declare module 'vitest' {
	export interface ProvidedContext {
		/** The run's migrated and seeded database. */
		databaseUrl: string;
		/** The server, to create more databases on (migration tests start from an empty one). */
		testServerUrl: string;
	}
}

export default async function setup(project: TestProject) {
	const serverUrl = testServerUrl();
	const scratch = await createScratchDatabase(serverUrl);
	await migrate(scratch.url);
	const db = createDb(scratch.url);
	await seed(db);
	await db.destroy();

	project.provide('databaseUrl', scratch.url);
	project.provide('testServerUrl', serverUrl);
	return () => scratch.drop();
}
