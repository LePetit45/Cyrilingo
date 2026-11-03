import { hash, verify } from '@node-rs/argon2';

// argon2id (the library's default algorithm) with the OWASP minimum: 19 MiB, 2 passes, 1 thread.
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

/** The argon2id hash of a password, in PHC format (`$argon2id$v=19$m=…`), salt included. */
export function hashPassword(password: string): Promise<string> {
	return hash(password, OPTIONS);
}

/** True when the password matches the hash. */
export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
	try {
		return await verify(passwordHash, password);
	} catch {
		return false;
	}
}

// Hashed once: checking a password against it takes as long as against a real account.
let dummyHash: Promise<string> | undefined;

/**
 * Spends the time of a password check when there is no account, so the answer time does not
 * tell whether an e-mail has an account (SPEC.md › Local accounts: the same answer for both).
 */
export async function spendPasswordCheckTime(password: string): Promise<void> {
	dummyHash ??= hashPassword('not a password of anybody');
	await verifyPassword(await dummyHash, password);
}
