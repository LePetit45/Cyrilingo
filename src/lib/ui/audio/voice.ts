// Recorded voice for letters and words (spec §5.1, §10). Files are generated once by a Bulgarian
// text-to-speech voice (spec §10.1) and stored as src/lib/assets/audio/<letter or word>.<ext>;
// importing them from src/lib gives them content-hashed names that the service worker precaches.
// The beta ships without recordings: every lookup returns undefined and audio buttons are hidden.
const files = import.meta.glob<string>('/src/lib/assets/audio/*.{opus,mp3}', {
	eager: true,
	query: '?url',
	import: 'default'
});

const byName = new Map(
	Object.entries(files).map(([path, url]) => [
		path
			.split('/')
			.at(-1)!
			.replace(/\.(opus|mp3)$/, '')
			.normalize('NFC'),
		url
	])
);

/** Whether any recording exists, to show the voice setting. */
export const hasVoice = byName.size > 0;

/** URL of the recording of a letter (uppercase) or a corpus word, if there is one. */
export function voiceUrl(name: string): string | undefined {
	return byName.get(name.normalize('NFC'));
}

let current: HTMLAudioElement | undefined;

/** Plays a recording, stopping the previous one. Does nothing when there is none. */
export function playVoice(name: string): void {
	const url = voiceUrl(name);
	if (!url) return;
	current?.pause();
	current = new Audio(url);
	current.play().catch(() => {
		// Autoplay may be blocked until the user interacts with the page.
	});
}
