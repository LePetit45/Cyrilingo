import { fr } from './locales/fr';

/** Shape of a UI string catalog. French is the reference locale; other locales must match it. */
export type Messages = typeof fr;

export type Locale = 'fr';

export const DEFAULT_LOCALE: Locale = 'fr';

const catalogs: Record<Locale, Messages> = { fr };

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
	return catalogs[locale];
}

/** UI strings for the current locale. The MVP is French-only (spec D5). */
export const m = getMessages();
