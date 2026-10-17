import { webManifest } from '#lib/pwa/manifest.js';

// Written to build/manifest.webmanifest at build time.
export const prerender = true;

export function GET() {
	return new Response(JSON.stringify(webManifest), {
		headers: { 'content-type': 'application/manifest+json' }
	});
}
