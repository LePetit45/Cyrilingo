import { createHash, randomBytes } from 'node:crypto';

/** A new session token: 256 random bits, base64url (43 characters). Never stored as is. */
export function generateToken(): string {
	return randomBytes(32).toString('base64url');
}

/** What the database stores for a token: its SHA-256, in hex. A leaked table gives no token. */
export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}
