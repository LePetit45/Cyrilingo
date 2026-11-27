import { error } from '@sveltejs/kit';
import { LESSONS } from '@cyrilingo/core/content/course.js';
import type { EntryGenerator, PageLoad } from './$types';

// One prerendered page per lesson, so a lesson link or a reload opens it from the static host.
export const entries: EntryGenerator = () => LESSONS.map(({ id }) => ({ id }));

export const load: PageLoad = ({ params }) => {
	const lesson = LESSONS.find(({ id }) => id === params.id);
	if (!lesson) error(404);
	return { lesson, number: LESSONS.indexOf(lesson) + 1 };
};
