import { spawn } from 'node:child_process';
import { createServer, type AddressInfo } from 'node:net';
import path from 'node:path';
import { describe, expect, inject, it } from 'vitest';
import { ConfigError, loadConfig, loadDatabaseUrl } from './config.js';

const required = {
	PUBLIC_URL: 'https://cyrilingo.example/',
	DATABASE_URL: 'postgres://user:password@localhost:5432/cyrilingo'
};

describe('loadConfig', () => {
	it('[AC-73] refuses a configuration without PUBLIC_URL or a database setting', () => {
		expect(() => loadConfig({})).toThrow(
			new ConfigError('Invalid configuration: PUBLIC_URL is required; DATABASE_URL is required')
		);
		expect(() => loadConfig({ ...required, PUBLIC_URL: '' })).toThrow('PUBLIC_URL is required');
		expect(() => loadConfig({ ...required, DATABASE_URL: '  ' })).toThrow(
			'DATABASE_URL is required'
		);
	});

	it('[AC-73] turns Google sign-in and read aloud off when their settings are missing', () => {
		expect(loadConfig({ ...required, GOOGLE_CLIENT_ID: 'id', AZURE_SPEECH_KEY: 'key' })).toEqual({
			publicUrl: 'https://cyrilingo.example',
			databaseUrl: required.DATABASE_URL,
			port: 3000,
			trustProxy: false,
			google: null,
			azureSpeech: null
		});
	});

	it('reads every setting', () => {
		const config = loadConfig({
			...required,
			PORT: '8000',
			TRUST_PROXY: 'true',
			GOOGLE_CLIENT_ID: 'id',
			GOOGLE_CLIENT_SECRET: 'secret',
			AZURE_SPEECH_KEY: 'key',
			AZURE_SPEECH_REGION: 'westeurope'
		});
		expect(config).toMatchObject({
			port: 8000,
			trustProxy: true,
			google: { clientId: 'id', clientSecret: 'secret' },
			azureSpeech: { key: 'key', region: 'westeurope' }
		});
	});

	it('refuses invalid values', () => {
		expect(() => loadConfig({ ...required, PUBLIC_URL: 'cyrilingo.example' })).toThrow(
			'PUBLIC_URL must be an http(s) URL'
		);
		expect(() => loadConfig({ ...required, DATABASE_URL: 'mysql://localhost' })).toThrow(
			'DATABASE_URL must be a postgres:// URL'
		);
		expect(() => loadConfig({ ...required, PORT: 'eighty' })).toThrow(ConfigError);
		expect(() => loadConfig({ ...required, TRUST_PROXY: 'yes' })).toThrow(ConfigError);
	});
});

describe('loadDatabaseUrl', () => {
	it('needs only the database setting', () => {
		expect(loadDatabaseUrl({ DATABASE_URL: required.DATABASE_URL })).toBe(required.DATABASE_URL);
		expect(() => loadDatabaseUrl({})).toThrow('DATABASE_URL is required');
	});
});

describe('the API process', () => {
	it('[AC-73] exits at start with a clear message when PUBLIC_URL is missing', async () => {
		const { code, output } = await startApi({ DATABASE_URL: required.DATABASE_URL }, () => false);
		expect(code).toBe(1);
		expect(output).toContain('PUBLIC_URL is required');
	});

	it('[AC-73] starts with the Google and Azure settings missing', async () => {
		const { output } = await startApi(
			{
				PUBLIC_URL: required.PUBLIC_URL,
				DATABASE_URL: inject('databaseUrl'),
				PORT: String(await freePort())
			},
			(output) => output.includes('Read aloud is off')
		);
		expect(output).toContain('API listening on port');
		expect(output).toContain('Google sign-in is off');
	});
});

/** A port nothing listens on right now. */
function freePort() {
	return new Promise<number>((resolve) => {
		const server = createServer().listen(0, () => {
			const { port } = server.address() as AddressInfo;
			server.close(() => resolve(port));
		});
	});
}

/** Runs src/main.ts until it exits or `isReady` says so (then stops it). */
function startApi(env: Record<string, string>, isReady: (output: string) => boolean) {
	const child = spawn(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
		cwd: path.resolve(import.meta.dirname, '..'),
		env: { PATH: process.env.PATH, ...env }
	});
	let output = '';
	return new Promise<{ code: number | null; output: string }>((resolve) => {
		const read = (chunk: Buffer) => {
			output += chunk;
			if (isReady(output)) child.kill();
		};
		child.stdout.on('data', read);
		child.stderr.on('data', read);
		child.on('exit', (code) => resolve({ code, output }));
	});
}
