import type { Db } from './database.js';
import type { SessionKind } from './schema.js';

export interface SessionRow {
	id: string;
	userId: string;
	kind: SessionKind;
	expiresAt: Date;
}

export async function insertSession(db: Db, session: SessionRow): Promise<void> {
	await db
		.insertInto('sessions')
		.values({
			id: session.id,
			user_id: session.userId,
			kind: session.kind,
			expires_at: session.expiresAt
		})
		.execute();
}

/** The session with this id, if it has not expired at `now`. */
export function findLiveSession(db: Db, id: string, now: Date): Promise<SessionRow | undefined> {
	return db
		.selectFrom('sessions')
		.select(['id', 'user_id as userId', 'kind', 'expires_at as expiresAt'])
		.where('id', '=', id)
		.where('expires_at', '>', now)
		.executeTakeFirst();
}

export async function setSessionExpiry(db: Db, id: string, expiresAt: Date): Promise<void> {
	await db.updateTable('sessions').set({ expires_at: expiresAt }).where('id', '=', id).execute();
}

export async function deleteSession(db: Db, id: string): Promise<void> {
	await db.deleteFrom('sessions').where('id', '=', id).execute();
}

/** Deletes every session of a user except `keepId` (the one making the request). */
export async function deleteOtherSessions(db: Db, userId: string, keepId: string): Promise<void> {
	await db.deleteFrom('sessions').where('user_id', '=', userId).where('id', '!=', keepId).execute();
}
