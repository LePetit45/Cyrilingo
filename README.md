# Cyrilingo

A web app to learn to read the Bulgarian Cyrillic alphabet, designed for native Latin-alphabet readers (French speakers first).

See [docs/SPECIFICATIONS.md](docs/SPECIFICATIONS.md) for the product specification.

## Status: v0.9.0-beta

The whole course is playable: the path of 10 lessons, letter discovery cards, the three exercise types with the in-app keyboard on touch devices, free review, the final exam (« L'Épreuve de Preslav ») with its diploma, the alphabet screen and the settings. It works offline once opened.

Not in the beta:

- recorded voice: no recordings yet (spec §10.1), audio buttons stay hidden;
- deployment: the beta is tried locally (see below);
- the content (mnemonics, words, translations, stress) is a first draft to be reviewed (spec §9).

To try it like the real thing (production build, service worker, offline):

```bash
npm install
npm run build && npm run preview
```

Then open http://localhost:4173, on a phone on the same network with `npm run preview -- --host`.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev/docs/svelte) + TypeScript, built as a static site with `@sveltejs/adapter-static`
- [Vitest](https://vitest.dev) for unit tests, [Playwright](https://playwright.dev) for end-to-end tests
- ESLint + Prettier
- Hosted on Cloudflare Pages

## Getting started

Requirements: Node.js 22.17 or later (the version used in CI is pinned in [`.nvmrc`](.nvmrc)).

```bash
npm install
npm run dev
```

The app is served at http://localhost:5173.

## Scripts

| Command             | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `npm run dev`       | Start the development server with hot reload                   |
| `npm run build`     | Build the static site into `build/`                            |
| `npm run preview`   | Serve the production build locally (http://localhost:4173)     |
| `npm run lint`      | Check formatting (Prettier) and lint (ESLint)                  |
| `npm run format`    | Format all files with Prettier                                 |
| `npm run check`     | Type check the project (`svelte-check`)                        |
| `npm run test:unit` | Run unit tests in watch mode (add `-- --run` for a single run) |
| `npm run test:e2e`  | Build the app and run the Playwright end-to-end tests          |
| `npm test`          | Run unit tests once, then end-to-end tests                     |
| `npm run icons`     | Regenerate the PWA icons from the favicon (see below)          |

### End-to-end tests

Playwright needs its browsers installed once (and again after a Playwright upgrade):

```bash
npx playwright install chromium firefox webkit
```

Tests import `test` and `expect` from [`e2e/test.ts`](e2e/test.ts), which disables Web Audio so sound effects don't play while tests run. [`e2e/answers.ts`](e2e/answers.ts) answers questions by reading the screen, and [`e2e/storage.ts`](e2e/storage.ts) starts the app with a given progress.

Tests live in [`e2e/`](e2e) and run against the production build on desktop Chrome, Firefox and Safari plus mobile Chrome and Safari viewports. To run a single browser: `npm run test:e2e -- --project=chromium`.

## Project structure

```
src/
├── app.html, app.css     # HTML shell (lang="fr") and global styles / design tokens
├── lib/
│   ├── core/             # Business logic: plain TypeScript, no Svelte (see below)
│   │   ├── content/      # Letters, lessons, corpus (typed data + invariant tests)
│   │   ├── engine/       # Question composition, distractors, sessions (progress model)
│   │   ├── reading.ts    # Transliteration and typed-answer checking
│   │   └── progress.ts   # localStorage persistence of progress and settings
│   ├── i18n/             # UI strings (locales/) and learning content (content/), per locale
│   ├── ui/               # Svelte components
│   │   ├── session/      # Question player shared by lessons, free review and exam
│   │   ├── state/        # Reactive app state wrapping core/progress.ts
│   │   └── audio/        # Synthesized sound effects, recorded voice lookup
│   ├── pwa/              # Web app manifest
│   └── assets/           # Images and icons imported by the app
├── routes/
│   ├── (tabs)/           # Pages with the bottom tab bar: path, alphabet, settings, about
│   └── (play)/           # Full-screen pages: lesson/[id], review, exam
└── service-worker/       # Offline support (own tsconfig, WebWorker types)
e2e/                      # Playwright end-to-end tests
scripts/                  # Maintenance scripts (icon generation)
static/                   # Files served as-is
```

Modules inside `src/lib` are imported through the `#lib` alias with a `.js` extension, e.g. `import { m } from '#lib/i18n/index.js'`.

### Architecture rule

All business logic (alphabet data, lessons, corpus, lesson engine, answer checking, progress persistence) lives in `src/lib/core/` as plain TypeScript modules with **no dependency on Svelte or SvelteKit**. Svelte is only used for the UI, so the framework can be swapped later. ESLint enforces this: `src/lib/core/` and `src/lib/i18n/` cannot import `svelte`, `$app/*`, `.svelte` files or UI components, and cannot contain `.svelte.ts` rune modules. Unit tests sit next to the code they test (`*.test.ts`).

### UI strings

No text is hard-coded in components. UI strings live in [`src/lib/i18n/locales/fr.ts`](src/lib/i18n/locales/fr.ts) and are used through `m` (`m.app.name`). French is the reference catalog: the `Messages` type is derived from it, so adding English means adding `locales/en.ts` typed as `Messages` and registering it in [`src/lib/i18n/index.ts`](src/lib/i18n/index.ts).

### Font and Bulgarian letter shapes

The app uses [Sofia Sans](https://fonts.google.com/specimen/Sofia+Sans) (variable), self-hosted through `@fontsource-variable/sofia-sans` so it works offline and makes no third-party requests. Bulgarian Cyrillic is the font's **default** design: д, т, л, в, г… are drawn with their Bulgarian shapes unless the text is tagged `lang="ru"`, which switches to the Russian forms through the OpenType `locl` feature. This was checked in Chromium, Firefox and WebKit.

All Bulgarian text should go through the [`Cyrillic`](src/lib/ui/Cyrillic.svelte) component, which tags it `lang="bg"` so fallback fonts that localize Cyrillic also pick the Bulgarian shapes.

## PWA and offline support

Cyrilingo is an installable PWA that works fully offline once it has been opened once (spec §10). It uses SvelteKit's built-in service worker ([`src/service-worker/index.ts`](src/service-worker/index.ts)), with no extra dependency:

- On install, it precaches everything the build produces: the prerendered pages, the web manifest, JS/CSS, the Sofia Sans `woff2` files, the icons and the files in `static/`. Precached files are then served cache-first; any other request goes to the network.
- Files under `_app/immutable/` have content-hashed names, so they live in a cache that is kept across deploys: an update only downloads new or changed files. Pages and `static/` files live in a cache tied to the build version, which is dropped when a new version activates.
- A new version takes over once every tab of the old one is closed (no forced reload in the middle of a lesson).
- **Audio** (letters and words): import the files from `src/lib` (for example with `import.meta.glob`) rather than putting them in `static/`. They then get content-hashed names, are precached automatically and are only downloaded again when they change. `vite.config.ts` keeps `.opus`/`.mp3` files from being inlined as data URIs.

The manifest is built from [`src/lib/pwa/manifest.ts`](src/lib/pwa/manifest.ts) (name and description come from the i18n catalog; a unit test keeps its colors in sync with `src/app.css`). The PNG icons in `src/lib/assets/icons/` are rendered from `favicon.svg` with `npm run icons` (it uses Playwright's Chromium); rerun it and commit the PNGs whenever the favicon changes.

[`e2e/pwa.e2e.ts`](e2e/pwa.e2e.ts) checks that the app reloads offline, served by the service worker, in every browser. Under `npm run dev` the build file lists are empty, so only `static/` files get cached; try offline behavior on the production build (`npm run build && npm run preview`). To start from a clean state while debugging, unregister it in the browser dev tools (Application › Service workers).

## Deployment

The site is deployed by Cloudflare Pages through its Git integration: `main` goes to production and every pull request gets a preview deployment. Pages project settings:

- Framework preset: SvelteKit (or none)
- Build command: `npm run build`
- Build output directory: `build`
- Node.js version: read from `.nvmrc`

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint, type check, unit tests and end-to-end tests on every pull request and on pushes to `main`.
