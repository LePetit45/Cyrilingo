// Service worker: precaches the whole app at install time so it works fully offline (spec §10).
import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { self } from '$app/service-worker';

// Files are split between two caches:
// - `_app/immutable/` files (JS, CSS, Sofia Sans woff2, icons and, later, audio imported from
//   src/lib) have content-hashed names, so they are kept across deploys and only new or changed
//   files are downloaded by an update;
// - everything else (prerendered pages and the web manifest, files from static/) can change
//   without its name changing, so it lives in a cache tied to the app version.
const CACHE_PREFIX = 'cyrilingo-';
const IMMUTABLE_CACHE = `${CACHE_PREFIX}immutable`;
const VERSION_CACHE = `${CACHE_PREFIX}${version}`;

// Manifest paths are relative to the base path; turn them into absolute pathnames.
const toPathname = (path: string) => new URL(path, self.registration.scope).pathname;

const IMMUTABLE_FILES = new Set(immutable.map(({ path }) => toPathname(path)));
const VERSION_FILES = new Set([...prerendered, ...assets].map(({ path }) => toPathname(path)));

self.addEventListener('install', (event) => {
	event.waitUntil(Promise.all([precacheImmutable(), precacheVersion()]));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(Promise.all([deleteOldCaches(), pruneImmutable(), self.clients.claim()]));
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	// Precached files are served cache-first. Anything else is not part of the app and goes to
	// the network as if there were no service worker.
	const cacheName = IMMUTABLE_FILES.has(url.pathname)
		? IMMUTABLE_CACHE
		: VERSION_FILES.has(url.pathname)
			? VERSION_CACHE
			: null;
	if (cacheName) event.respondWith(cacheFirst(cacheName, url.pathname, request));
});

async function precacheImmutable() {
	const cache = await caches.open(IMMUTABLE_CACHE);
	const cached = new Set((await cache.keys()).map((request) => new URL(request.url).pathname));
	await cache.addAll([...IMMUTABLE_FILES].filter((pathname) => !cached.has(pathname)));
}

async function precacheVersion() {
	const cache = await caches.open(VERSION_CACHE);
	await cache.addAll([...VERSION_FILES]);
}

// Runs once the previous version no longer controls any page, so its files can go.
async function deleteOldCaches() {
	for (const name of await caches.keys()) {
		if (name.startsWith(CACHE_PREFIX) && name !== IMMUTABLE_CACHE && name !== VERSION_CACHE) {
			await caches.delete(name);
		}
	}
}

async function pruneImmutable() {
	const cache = await caches.open(IMMUTABLE_CACHE);
	for (const request of await cache.keys()) {
		if (!IMMUTABLE_FILES.has(new URL(request.url).pathname)) await cache.delete(request);
	}
}

async function cacheFirst(cacheName: string, pathname: string, request: Request) {
	const cache = await caches.open(cacheName);
	return (await cache.match(pathname)) ?? fetch(request);
}
