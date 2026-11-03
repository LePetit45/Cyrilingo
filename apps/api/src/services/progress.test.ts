import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { createDb } from '../db/database.js';
import { createAccountService } from './account.js';
import { ServiceError } from './errors.js';
import { createLessonService } from './lessons.js';
import { createProgressService } from './progress.js';

const db = createDb(inject('databaseUrl'));
afterAll(() => db.destroy());

let clock = new Date('2026-11-03T12:00:00Z');
const progress = createProgressService(db, () => clock);
const lessons = createLessonService(db);
const account = createAccountService(db);

const EMPTY = { completedLessons: [], examPassed: false };

async function newUser(): Promise<string> {
	const { id } = await db
		.insertInto('users')
		.values({ email: `learner-${randomUUID()}@example.com` })
		.returning('id')
		.executeTakeFirstOrThrow();
	return id;
}

const completionsOf = (userId: string) =>
	db.selectFrom('lesson_completions').selectAll().where('user_id', '=', userId).execute();

/** The code a promise rejects with, as a `ServiceError`. */
async function refusal(promise: Promise<unknown>) {
	const error = await promise.then(
		() => undefined,
		(reason: unknown) => reason
	);
	expect(error).toBeInstanceOf(ServiceError);
	return (error as ServiceError).code;
}

describe('progress', () => {
	it('starts empty', async () => {
		expect(await progress.get(await newUser())).toEqual(EMPTY);
	});

	it('[AC-22] merges as a union of completed lessons, in course order', async () => {
		const userId = await newUser();
		await progress.merge(userId, { completedLessons: ['l3', 'l1'], examPassed: false });
		expect(
			await progress.merge(userId, { completedLessons: ['l2', 'l1', 'l2'], examPassed: false })
		).toEqual({ completedLessons: ['l1', 'l2', 'l3'], examPassed: false });
		expect(await progress.get(userId)).toEqual({
			completedLessons: ['l1', 'l2', 'l3'],
			examPassed: false
		});
	});

	it('[AC-22] counts the exam as passed when it was passed on either side', async () => {
		const userId = await newUser();
		await progress.merge(userId, { completedLessons: [], examPassed: true });
		expect(await progress.merge(userId, EMPTY)).toEqual({ completedLessons: [], examPassed: true });
	});

	it('[AC-22] keeps the first completion date of a lesson completed again', async () => {
		const userId = await newUser();
		await progress.merge(userId, { completedLessons: ['l1'], examPassed: true });
		const first = clock;
		clock = new Date(first.getTime() + 60_000);
		await progress.merge(userId, { completedLessons: ['l1'], examPassed: true });
		expect((await completionsOf(userId)).map(({ completed_at }) => completed_at)).toEqual([first]);
		const user = await db
			.selectFrom('users')
			.select('exam_passed_at')
			.where('id', '=', userId)
			.executeTakeFirstOrThrow();
		expect(user.exam_passed_at).toEqual(first);
	});

	it('refuses an unknown lesson and then writes nothing', async () => {
		const userId = await newUser();
		expect(
			await refusal(progress.merge(userId, { completedLessons: ['l1', 'l99'], examPassed: true }))
		).toBe('unknown_lesson');
		expect(await progress.get(userId)).toEqual(EMPTY);
	});

	it('[AC-25] resets the completed lessons and the exam', async () => {
		const userId = await newUser();
		await progress.merge(userId, { completedLessons: ['l1', 'l2'], examPassed: true });
		await progress.reset(userId);
		expect(await progress.get(userId)).toEqual(EMPTY);
		expect(await completionsOf(userId)).toEqual([]);
	});

	it("[AC-25] touches nobody else's progress", async () => {
		const [ana, ben] = [await newUser(), await newUser()];
		await progress.merge(ana, { completedLessons: ['l1'], examPassed: true });
		await progress.merge(ben, { completedLessons: ['l2'], examPassed: false });
		await progress.reset(ben);
		expect(await progress.get(ana)).toEqual({ completedLessons: ['l1'], examPassed: true });
	});

	it('answers not found for an unknown user', async () => {
		const unknown = randomUUID();
		expect(await refusal(progress.get(unknown))).toBe('not_found');
		expect(
			await refusal(progress.merge(unknown, { completedLessons: ['l1'], examPassed: true }))
		).toBe('not_found');
		expect(await refusal(progress.reset(unknown))).toBe('not_found');
	});

	it('[AC-19] goes with the account when it is deleted', async () => {
		const userId = await newUser();
		await progress.merge(userId, { completedLessons: ['l1', 'l2'], examPassed: true });
		await account.remove(userId);
		expect(await completionsOf(userId)).toEqual([]);
	});
});

describe('lessons', () => {
	it('lists the 10 lessons in order, with their letters and what the user completed', async () => {
		const userId = await newUser();
		await progress.merge(userId, { completedLessons: ['l2'], examPassed: false });
		const list = await lessons.list(userId);
		expect(list.map(({ id }) => id)).toEqual(Array.from({ length: 10 }, (_, i) => `l${i + 1}`));
		expect(list.every(({ letters }) => letters.length === 3)).toBe(true);
		expect(list.filter(({ completed }) => completed).map(({ id }) => id)).toEqual(['l2']);
		expect(list[0]).toMatchObject({ section: 'allies', letters: ['А', 'Т', 'М'] });
	});
});
