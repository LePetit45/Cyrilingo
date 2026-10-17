// Static build: every page is prerendered at build time as an HTML shell (spec §10,
// adapter-static), then rendered in the browser only: progress and settings live in
// localStorage, so there is nothing meaningful to render ahead of time.
export const prerender = true;
export const ssr = false;
