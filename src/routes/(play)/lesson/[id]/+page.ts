import { error } from '@sveltejs/kit';
import { LESSONS } from '#lib/core/content/course.js';
import type { EntryGenerator, PageLoad } from './$types';

// One prerendered page per lesson, so every lesson opens offline.
export const entries: EntryGenerator = () => LESSONS.map(({ id }) => ({ id }));

export const load: PageLoad = ({ params }) => {
	const lesson = LESSONS.find(({ id }) => id === params.id);
	if (!lesson) error(404);
	return { lesson, number: LESSONS.indexOf(lesson) + 1 };
};
