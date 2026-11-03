import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

// DATABASE_URL (or TEST_DATABASE_URL) from the repository's .env and .env.local, as `npm run dev`
// reads them; a variable already set in the shell (as in CI) wins.
const fromFiles = ['.env', '.env.local'].reduce<Record<string, string | undefined>>(
	(env, file) => ({ ...env, ...readEnvFile(path.resolve(import.meta.dirname, '../..', file)) }),
	{}
);
const env = Object.fromEntries(
	Object.entries(fromFiles).filter(([name]) => process.env[name] === undefined)
) as Record<string, string>;
// The global setup runs in this process, the tests in workers that get `test.env`.
Object.assign(process.env, env);

export default defineConfig({
	test: {
		name: 'api',
		environment: 'node',
		include: ['src/**/*.test.ts'],
		env,
		globalSetup: ['src/db/global-setup.ts'],
		expect: { requireAssertions: true }
	}
});

function readEnvFile(file: string): Record<string, string | undefined> {
	try {
		return parseEnv(readFileSync(file, 'utf8'));
	} catch {
		return {};
	}
}
