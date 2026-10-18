import type { Page } from '@playwright/test';

/** Whether the self-hosted Sofia Sans Cyrillic subset has been loaded by the page. */
export function isSofiaSansCyrillicLoaded(page: Page) {
	return page.evaluate(async () => {
		await document.fonts.ready;
		return [...document.fonts].some(
			(face) =>
				face.family.replaceAll('"', '') === 'Sofia Sans Variable' &&
				face.unicodeRange.includes('U+400') &&
				face.status === 'loaded'
		);
	});
}
