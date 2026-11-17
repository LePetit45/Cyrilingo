import type { Db } from './database.js';
import type { OAuthProvider } from './schema.js';

/** The user a provider identity is linked to, if any. */
export async function findLinkedUserId(
	db: Db,
	provider: OAuthProvider,
	providerUserId: string
): Promise<string | undefined> {
	const row = await db
		.selectFrom('oauth_accounts')
		.select('user_id')
		.where('provider', '=', provider)
		.where('provider_user_id', '=', providerUserId)
		.executeTakeFirst();
	return row?.user_id;
}

export async function linkIdentity(
	db: Db,
	link: { provider: OAuthProvider; providerUserId: string; userId: string }
): Promise<void> {
	await db
		.insertInto('oauth_accounts')
		.values({
			provider: link.provider,
			provider_user_id: link.providerUserId,
			user_id: link.userId
		})
		.execute();
}

/** The providers linked to a user, each once, in alphabetical order. */
export async function listLinkedProviders(db: Db, userId: string): Promise<OAuthProvider[]> {
	const rows = await db
		.selectFrom('oauth_accounts')
		.select('provider')
		.distinct()
		.where('user_id', '=', userId)
		.orderBy('provider')
		.execute();
	return rows.map((row) => row.provider);
}
