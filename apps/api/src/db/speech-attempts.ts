import { sql } from 'kysely';
import type { Db } from './database.js';
import type { SpeechOutcome } from './schema.js';

// Read-aloud tries, counted for the speech limits over a rolling window (SPEC.md › The model
// feature › Timeout, fallback and limits).

/** Any constant: the key of the lock that makes the speech tries count one at a time. */
const SPEECH_LOCK = 0x5be3c4;

/**
 * Records a try for the user at `at`, unless, within `windowMs` before it, they already made
 * `perUser` tries or all users together made `global`. The count and the insert run under one
 * lock, so two simultaneous tries can never both pass a limit. Rows older than the window (by the
 * database's clock) are deleted on the way: nothing reads them. Answers the new row's id, or
 * which limit was reached.
 */
export async function recordSpeechAttempt(
	db: Db,
	userId: string,
	{ at, windowMs, perUser, global }: { at: Date; windowMs: number; perUser: number; global: number }
): Promise<{ id: string } | 'user_limit' | 'global_limit'> {
	const since = new Date(at.getTime() - windowMs);
	return db.transaction().execute(async (trx) => {
		await sql`SELECT pg_advisory_xact_lock(${SPEECH_LOCK})`.execute(trx);
		await trx
			.deleteFrom('speech_attempts')
			.where('created_at', '<', sql<Date>`now() - make_interval(secs => ${windowMs / 1000})`)
			.execute();
		const { all, mine } = await trx
			.selectFrom('speech_attempts')
			.select((eb) => [
				eb.fn.countAll<string>().as('all'),
				eb.fn.count<string>('id').filterWhere('user_id', '=', userId).as('mine')
			])
			.where('created_at', '>', since)
			.where('created_at', '<=', at)
			.executeTakeFirstOrThrow();
		if (Number(mine) >= perUser) return 'user_limit';
		if (Number(all) >= global) return 'global_limit';
		return trx
			.insertInto('speech_attempts')
			.values({ user_id: userId, created_at: at })
			.returning('id')
			.executeTakeFirstOrThrow();
	});
}

/** Fills in a try's outcome once the provider answered, or did not. */
export async function setSpeechOutcome(db: Db, id: string, outcome: SpeechOutcome): Promise<void> {
	await db.updateTable('speech_attempts').set({ outcome }).where('id', '=', id).execute();
}
