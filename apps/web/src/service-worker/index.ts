// Retires the service worker of earlier versions (SPEC.md › D37). Cyrilingo no longer works
// offline: every file is loaded when a page needs it and kept by the browser's HTTP cache, so a
// first visit no longer downloads the whole app (about 800 files) at once.
//
// SvelteKit no longer registers this file (`serviceWorker.register: false` in vite.config.ts),
// but a browser that installed the old worker still checks this URL for an update at each visit.
// This version then takes over at once, deletes the old caches, unregisters itself and reloads
// the pages it controls, which from then on go straight to the network. It has no fetch handler.
// It can be deleted once no learner is likely to still have the old worker.
import { self } from '$app/service-worker';

const CACHE_PREFIX = 'cyrilingo-';

self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
	event.waitUntil(retire());
});

async function retire() {
	for (const name of await caches.keys()) {
		if (name.startsWith(CACHE_PREFIX)) await caches.delete(name);
	}
	await self.registration.unregister();
	// A page the old worker served may ask for script chunks that no longer exist: reload it.
	for (const client of await self.clients.matchAll({ type: 'window' })) {
		await client.navigate(client.url).catch(() => {});
	}
}
