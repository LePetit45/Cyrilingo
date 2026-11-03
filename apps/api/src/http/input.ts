import type { Context } from 'hono';
import type { z } from 'zod';
import { getConnInfo } from '@hono/node-server/conninfo';

/** The request body didn't parse or didn't match the schema: answered 400 `invalid_input`. */
export class InvalidInput extends Error {
	override name = 'InvalidInput';
}

/** Parses the JSON body with a Zod schema. */
export async function readJson<T extends z.ZodType>(c: Context, schema: T): Promise<z.infer<T>> {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		throw new InvalidInput('The body is not JSON');
	}
	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		throw new InvalidInput(parsed.error.issues.map((issue) => issue.path.join('.')).join(', '));
	}
	return parsed.data;
}

/**
 * The client's IP, for the sign-in limit. Behind a trusted reverse proxy (`TRUST_PROXY=true`),
 * the first address of `X-Forwarded-For`, which that proxy must set; otherwise the socket's.
 */
export function clientIp(c: Context, trustProxy: boolean): string {
	if (trustProxy) {
		const forwarded = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim();
		if (forwarded) return forwarded;
	}
	try {
		return getConnInfo(c).remote.address ?? 'unknown';
	} catch {
		// No socket: a request built in a test.
		return 'unknown';
	}
}
