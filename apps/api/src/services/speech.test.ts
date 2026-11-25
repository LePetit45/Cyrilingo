import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { createDb } from '../db/database.js';
import { FakeSpeechClient } from '../speech/testing.js';
import { createAccountService } from './account.js';
import { ServiceError } from './errors.js';
import { createSpeechService, SPEECH_TRIES_PER_USER, SPEECH_WINDOW_MS } from './speech.js';

const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

const AUDIO = new Uint8Array([1, 2, 3, 4]);
const WORD = 'котка';

async function newUser(): Promise<string> {
	const { id } = await db
		.insertInto('users')
		.values({ email: `learner-${randomUUID()}@example.com` })
		.returning('id')
		.executeTakeFirstOrThrow();
	return id;
}

/** The code a promise rejects with, as a `ServiceError`. */
async function refusal(promise: Promise<unknown>) {
	const error = await promise.then(
		() => undefined,
		(reason: unknown) => reason
	);
	expect(error).toBeInstanceOf(ServiceError);
	return (error as ServiceError).code;
}

// Tries are counted over the 24 hours before the service's clock. Each test that counts them runs
// on a clock of its own, years apart and after today, so the tries of the other tests (and of the
// HTTP tests, on the real clock) are never in its window.
let year = 2200;
const ownClock = () => {
	const start = new Date(`${year++}-06-01T12:00:00Z`).getTime();
	let elapsed = 0;
	return { now: () => new Date(start + elapsed), advance: (ms: number) => (elapsed += ms) };
};

const serviceWith = (
	client: FakeSpeechClient | null,
	options: Partial<Parameters<typeof createSpeechService>[0]> = {}
) => createSpeechService({ db, client, log: () => {}, ...ownClock(), ...options });

describe('speech service', () => {
	it('[AC-43] answers a match when the text heard is the expected word', async () => {
		const speech = serviceWith(new FakeSpeechClient({ status: 'success', text: 'Котка.' }));
		expect(await speech.check(await newUser(), WORD, AUDIO)).toEqual({ outcome: 'match' });
	});

	it('[AC-43] answers a match for a text one letter off a word of 4 letters or more', async () => {
		const speech = serviceWith(new FakeSpeechClient({ status: 'success', text: 'котки' }));
		expect(await speech.check(await newUser(), WORD, AUDIO)).toEqual({ outcome: 'match' });
	});

	it('[AC-43] answers a mismatch with the validated text heard', async () => {
		const speech = serviceWith(new FakeSpeechClient({ status: 'success', text: 'Мляко!' }));
		expect(await speech.check(await newUser(), WORD, AUDIO)).toEqual({
			outcome: 'mismatch',
			heard: 'мляко'
		});
	});

	it('[AC-42] answers not understood, showing nothing, for a text that fails validation or no speech', async () => {
		const fake = new FakeSpeechClient();
		const speech = serviceWith(fake);
		const userId = await newUser();
		for (const text of ['kotka', 'котка 2', 'мыло', 'а'.repeat(41), '...']) {
			fake.behavior = { status: 'success', text };
			expect(await speech.check(userId, WORD, AUDIO)).toEqual({ outcome: 'not_understood' });
		}
		fake.behavior = { status: 'no_match' };
		expect(await speech.check(userId, WORD, AUDIO)).toEqual({ outcome: 'not_understood' });
	});

	it('[AC-44] answers unavailable when the provider does not answer in time', async () => {
		const speech = serviceWith(new FakeSpeechClient('hang'), { timeoutMs: 20 });
		expect(await speech.check(await newUser(), WORD, AUDIO)).toEqual({ outcome: 'unavailable' });
	});

	it('[AC-44] answers unavailable when the provider fails, rate-limits or refuses the key, and reports a refused key', async () => {
		const fake = new FakeSpeechClient();
		const lines: string[] = [];
		const speech = serviceWith(fake, { log: (line) => lines.push(line) });
		const userId = await newUser();
		for (const status of [500, 503, 429, 401, 403]) {
			fake.behavior = { failWith: status };
			expect(await speech.check(userId, WORD, AUDIO)).toEqual({ outcome: 'unavailable' });
		}
		expect(lines).toEqual([
			'Speech provider refused the request (401): check the key and the quota',
			'Speech provider refused the request (403): check the key and the quota'
		]);
	});

	it('[AC-45] answers unavailable, without recording a try, when read aloud is off', async () => {
		const userId = await newUser();
		expect(await serviceWith(null).check(userId, WORD, AUDIO)).toEqual({
			outcome: 'unavailable'
		});
		expect(await triesOf(userId)).toHaveLength(0);
	});

	it('refuses a word the corpus does not have, before calling the provider', async () => {
		const fake = new FakeSpeechClient();
		const speech = serviceWith(fake);
		const userId = await newUser();
		for (const word of ['абв', 'ма', '']) {
			expect(await refusal(speech.check(userId, word, AUDIO))).toBe('unknown_word');
		}
		expect(fake.calls).toHaveLength(0);
	});

	it("[AC-46] refuses a user's 61st try within 24 hours, and accepts it once the first try is 24 hours old", async () => {
		const clock = ownClock();
		const fake = new FakeSpeechClient({ status: 'success', text: WORD });
		const speech = serviceWith(fake, clock);
		const userId = await newUser();
		for (let i = 0; i < SPEECH_TRIES_PER_USER; i++) {
			await speech.check(userId, WORD, AUDIO);
			clock.advance(60_000);
		}
		expect(await refusal(speech.check(userId, WORD, AUDIO))).toBe('speech_quota_reached');
		expect(fake.calls).toHaveLength(SPEECH_TRIES_PER_USER);
		// Another learner is not held back by this one.
		expect(await speech.check(await newUser(), WORD, AUDIO)).toEqual({ outcome: 'match' });

		clock.advance(SPEECH_WINDOW_MS - SPEECH_TRIES_PER_USER * 60_000);
		expect(await speech.check(userId, WORD, AUDIO)).toEqual({ outcome: 'match' });
	});

	it('[AC-46] answers unavailable without calling the provider once all users reached the global limit', async () => {
		const fake = new FakeSpeechClient({ status: 'success', text: WORD });
		const speech = serviceWith(fake, { limits: { global: 3 } });
		for (let i = 0; i < 3; i++) {
			expect(await speech.check(await newUser(), WORD, AUDIO)).toEqual({ outcome: 'match' });
		}
		expect(await speech.check(await newUser(), WORD, AUDIO)).toEqual({ outcome: 'unavailable' });
		expect(fake.calls).toHaveLength(3);
	});

	it('[AC-46] never lets simultaneous tries go past a limit', async () => {
		const fake = new FakeSpeechClient({ status: 'success', text: WORD });
		const speech = serviceWith(fake, { limits: { perUser: 5 } });
		const userId = await newUser();
		const results = await Promise.allSettled(
			Array.from({ length: 12 }, () => speech.check(userId, WORD, AUDIO))
		);
		expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(5);
		expect(fake.calls).toHaveLength(5);
	});

	it('[AC-47] sends the provider only the audio and the language, and keeps neither the audio nor the text', async () => {
		const fake = new FakeSpeechClient({ status: 'success', text: 'мляко' });
		const speech = serviceWith(fake);
		const userId = await newUser();
		await speech.check(userId, WORD, AUDIO);
		expect(fake.calls).toEqual([{ audio: AUDIO, language: 'bg-BG' }]);
		expect(JSON.stringify(fake.calls)).not.toContain(WORD);
		expect(await triesOf(userId)).toEqual([
			{ id: expect.any(String), user_id: userId, created_at: expect.any(Date), outcome: 'mismatch' }
		]);
	});

	it("[AC-19] keeps a deleted user's recent tries without the user, so deleting accounts cannot reset the global limit", async () => {
		const clock = ownClock();
		const speech = serviceWith(new FakeSpeechClient({ status: 'success', text: WORD }), {
			...clock,
			limits: { global: 2 }
		});
		const userId = await newUser();
		await speech.check(userId, WORD, AUDIO);
		await speech.check(userId, WORD, AUDIO);
		await createAccountService(db).remove(userId);
		expect(await triesOf(userId)).toEqual([]);
		expect(await speech.check(await newUser(), WORD, AUDIO)).toEqual({ outcome: 'unavailable' });
	});
});

const triesOf = (userId: string) =>
	db.selectFrom('speech_attempts').selectAll().where('user_id', '=', userId).execute();
