import { z } from 'zod';

/** The API's settings, read once from environment variables at start (SPEC.md › Deployment). */
export interface Config {
	/** Origin the app is served from: mutating requests must come from it. */
	publicUrl: string;
	databaseUrl: string;
	port: number;
	/** Trust `X-Forwarded-*` headers from the reverse proxy in front of the app. */
	trustProxy: boolean;
	/** Null turns Google sign-in off. */
	google: { clientId: string; clientSecret: string } | null;
	/** Null turns the read-aloud questions off. */
	azureSpeech: { key: string; region: string } | null;
}

/** A setting is missing or invalid: the API must not start. */
export class ConfigError extends Error {
	override name = 'ConfigError';
}

const schema = z.object({
	// Plain HTTP only for development on this machine: deployed, the app is served over HTTPS.
	PUBLIC_URL: z
		.url({ protocol: /^https?$/, error: 'PUBLIC_URL must be an http(s) URL' })
		.refine(
			(url) =>
				!URL.canParse(url) ||
				url.startsWith('https:') ||
				['localhost', '127.0.0.1'].includes(new URL(url).hostname),
			'PUBLIC_URL must use https, except on localhost'
		),
	DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a postgres:// URL'),
	API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	TRUST_PROXY: z.enum(['true', 'false']).default('false'),
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	AZURE_SPEECH_KEY: z.string().optional(),
	AZURE_SPEECH_REGION: z.string().optional()
});

type Env = Record<string, string | undefined>;

/** Reads the configuration, or throws a `ConfigError` naming every missing or invalid setting. */
export function loadConfig(env: Env): Config {
	const settings = parse(schema, env);
	return {
		publicUrl: new URL(settings.PUBLIC_URL).origin,
		databaseUrl: settings.DATABASE_URL,
		port: settings.API_PORT,
		trustProxy: settings.TRUST_PROXY === 'true',
		google:
			settings.GOOGLE_CLIENT_ID && settings.GOOGLE_CLIENT_SECRET
				? { clientId: settings.GOOGLE_CLIENT_ID, clientSecret: settings.GOOGLE_CLIENT_SECRET }
				: null,
		azureSpeech:
			settings.AZURE_SPEECH_KEY && settings.AZURE_SPEECH_REGION
				? { key: settings.AZURE_SPEECH_KEY, region: settings.AZURE_SPEECH_REGION }
				: null
	};
}

/** Reads only the database setting, for the migration command. */
export function loadDatabaseUrl(env: Env): string {
	return parse(schema.pick({ DATABASE_URL: true }), env).DATABASE_URL;
}

function parse<T extends z.ZodType>(target: T, env: Env): z.infer<T> {
	// An empty value, as in `.env.example`, counts as missing.
	const values = Object.fromEntries(
		Object.entries(env)
			.map(([name, value]) => [name, value?.trim()])
			.filter(([, value]) => value)
	);
	const parsed = target.safeParse(values);
	if (!parsed.success) {
		const problems = parsed.error.issues.map((issue) =>
			issue.code === 'invalid_type' ? `${String(issue.path[0])} is required` : issue.message
		);
		throw new ConfigError(`Invalid configuration: ${problems.join('; ')}`);
	}
	return parsed.data;
}
