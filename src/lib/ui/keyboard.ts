/**
 * Whether a keyboard shortcut of the lesson screen (keys 1–4, typing on the in-app keyboard)
 * must be ignored: modified keys (Ctrl+1 switches tabs), repeats, events already handled, and
 * keys pressed while a modal dialog (quit confirmation) is open.
 */
export function isShortcutBlocked(event: KeyboardEvent): boolean {
	return (
		event.defaultPrevented ||
		event.repeat ||
		event.ctrlKey ||
		event.metaKey ||
		event.altKey ||
		document.querySelector('dialog[open]') !== null
	);
}
