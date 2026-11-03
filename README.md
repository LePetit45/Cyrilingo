# Cyrilingo

A web app to learn to read the Bulgarian Cyrillic alphabet, designed for native Latin-alphabet readers (French speakers first).

See [SPEC.md](SPEC.md) for the product specification and [AGENTS.md](AGENTS.md) for the working rules.

## Status: v0.10.0-beta, v2 in progress

v2 (spec in [SPEC.md](SPEC.md)) adds a back end, accounts, personal word lists, a read-aloud exercise and an MCP server. Until it ships, this README describes the static v0.10.0-beta.

Live at **https://cyrilingo.pages.dev**.

The whole course is playable: the path of 10 lessons, letter discovery cards, the three exercise types with the in-app keyboard on touch devices, free review, the final exam (« L'Épreuve de Preslav ») with its diploma, the alphabet screen and the settings. It works offline once opened. Since v0.10.0-beta every screen uses the light, Duolingo-inspired design (spec §8).

Not in the beta:

- recorded voice: no recordings yet (spec §10.1), audio buttons stay hidden;
- the content (mnemonics, words, translations, stress) is a first draft to be reviewed (spec §9).

To try a local build like the real thing (production build, service worker, offline):

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
cp .env.example .env      # then fill in PUBLIC_URL, POSTGRES_PASSWORD and DATABASE_URL
docker compose up -d db   # PostgreSQL 17, on 127.0.0.1 only
npm run db:migrate        # migrations, then the seed
npm run dev
```

The app is served at http://localhost:5173 and the API at http://localhost:3000; Vite forwards `/api` to it, so the front end calls `/api/...` on its own origin. The front end alone still works without the database (guest mode).

## Scripts

| Command              | What it does                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run dev`        | Start the front end and the API with hot reload                                                 |
| `npm run db:migrate` | Apply pending migrations, then load the seed                                                    |
| `npm run build`      | Build the static site into `apps/web/build/`                                                    |
| `npm run preview`    | Serve the production build locally (http://localhost:4173)                                      |
| `npm run lint`       | Check formatting (Prettier) and lint (ESLint)                                                   |
| `npm run format`     | Format all files with Prettier                                                                  |
| `npm run check`      | Type check every workspace (`tsc`, `svelte-check`)                                              |
| `npm run test:unit`  | Run unit tests in watch mode (add `-- --run` for a single run); the API tests need the database |
| `npm run test:e2e`   | Build the app and run the Playwright end-to-end tests                                           |
| `npm test`           | Run unit tests once, then end-to-end tests                                                      |
| `npm run icons`      | Regenerate the PWA icons from the favicon (see below)                                           |

### End-to-end tests

Playwright needs its browsers installed once (and again after a Playwright upgrade):

```bash
npx playwright install chromium firefox webkit
```

Tests import `test` and `expect` from [`e2e/test.ts`](e2e/test.ts), which disables Web Audio so sound effects don't play while tests run. [`e2e/answers.ts`](e2e/answers.ts) answers questions by reading the screen, and [`e2e/storage.ts`](e2e/storage.ts) starts the app with a given progress.

Tests live in [`e2e/`](e2e) and run against the production build on desktop Chrome, Firefox and Safari plus mobile Chrome and Safari viewports. To run a single browser: `npm run test:e2e -- --project=chromium`.

## Project structure

An npm workspaces monorepo; every command above runs from the repository root.

```
packages/core/src/        # Business logic: plain TypeScript, no Svelte (see below)
├── content/              # Letters, lessons, corpus (typed data + invariant tests)
│   └── i18n/             # Learning content per locale (translations, sounds, notes)
├── engine/               # Question composition, distractors, sessions (progress model)
├── reading.ts            # Transliteration and typed-answer checking
└── progress.ts           # localStorage persistence of progress and settings
apps/web/                 # SvelteKit front end
├── src/
│   ├── app.html, app.css # HTML shell (lang="fr") and global styles / design tokens
│   ├── lib/
│   │   ├── i18n/         # UI strings, per locale (locales/)
│   │   ├── ui/           # Svelte components
│   │   │   ├── session/  # Question player shared by lessons, free review and exam
│   │   │   ├── state/    # Reactive app state wrapping core's progress.ts
│   │   │   └── audio/    # Synthesized sound effects, recorded voice lookup
│   │   ├── pwa/          # Web app manifest
│   │   └── assets/       # Images, icons and recordings imported by the app
│   ├── routes/
│   │   ├── (tabs)/       # Pages with the bottom tab bar: path, alphabet, settings, about
│   │   └── (play)/       # Full-screen pages: lesson/[id], review, exam
│   └── service-worker/   # Offline support (own tsconfig, WebWorker types)
└── static/               # Files served as-is
apps/api/                 # Hono REST API on Node.js
├── src/
│   ├── http/             # Routes and middlewares: validate, call one service, map errors
│   ├── services/         # The rules (ownership, limits); never see HTTP
│   ├── db/               # Kysely queries, connection, migration runner, seed, test databases
│   ├── config.ts         # Environment variables, checked at start
│   └── main.ts           # Starts the server
└── migrations/           # Numbered SQL files: 0001_reference_data.sql, …
e2e/                      # Playwright end-to-end tests
scripts/                  # Maintenance scripts (icons, recordings)
```

The front end imports core through its package name, `@cyrilingo/core/<module>.js` (e.g. `@cyrilingo/core/reading.js`), and its own modules through the `#lib` alias with a `.js` extension, e.g. `import { m } from '#lib/i18n/index.js'`. `npm run test:unit` runs one Vitest project per workspace (`core`, `web`, `api`). The API tests create a throwaway database (`cyrilingo_test_…`) on the server of `TEST_DATABASE_URL`, else `DATABASE_URL`, migrate and seed it, and drop it at the end.

### Architecture rule

All business logic (alphabet data, lessons, corpus, lesson engine, answer checking, progress persistence) lives in `packages/core` as plain TypeScript modules with **no dependency on Svelte or SvelteKit**. Svelte is only used for the UI, so the framework can be swapped later and the API can reuse the same rules. ESLint enforces this: `packages/core` and `apps/web/src/lib/i18n/` cannot import `svelte`, `$app/*`, `.svelte` files or UI components, and cannot contain `.svelte.ts` rune modules. Unit tests sit next to the code they test (`*.test.ts`).

### UI strings

No text is hard-coded in components. UI strings live in [`apps/web/src/lib/i18n/locales/fr.ts`](apps/web/src/lib/i18n/locales/fr.ts) and are used through `m` (`m.app.name`). French is the reference catalog: the `Messages` type is derived from it, so adding English means adding `locales/en.ts` typed as `Messages` and registering it in [`apps/web/src/lib/i18n/index.ts`](apps/web/src/lib/i18n/index.ts). Learning content follows the same pattern in [`packages/core/src/content/i18n/`](packages/core/src/content/i18n/).

### Font and Bulgarian letter shapes

The app uses [Sofia Sans](https://fonts.google.com/specimen/Sofia+Sans) (variable), self-hosted through `@fontsource-variable/sofia-sans` so it works offline and makes no third-party requests. Bulgarian Cyrillic is the font's **default** design: д, т, л, в, г… are drawn with their Bulgarian shapes unless the text is tagged `lang="ru"`, which switches to the Russian forms through the OpenType `locl` feature. This was checked in Chromium, Firefox and WebKit.

All Bulgarian text should go through the [`Cyrillic`](apps/web/src/lib/ui/Cyrillic.svelte) component, which tags it `lang="bg"` so fallback fonts that localize Cyrillic also pick the Bulgarian shapes.

## PWA and offline support

Cyrilingo is an installable PWA that works fully offline once it has been opened once (spec §10). It uses SvelteKit's built-in service worker ([`apps/web/src/service-worker/index.ts`](apps/web/src/service-worker/index.ts)), with no extra dependency:

- On install, it precaches everything the build produces: the prerendered pages, the web manifest, JS/CSS, the Sofia Sans `woff2` files, the icons and the files in `static/`. Precached files are then served cache-first; any other request goes to the network.
- Files under `_app/immutable/` have content-hashed names, so they live in a cache that is kept across deploys: an update only downloads new or changed files. Pages and `static/` files live in a cache tied to the build version, which is dropped when a new version activates.
- A new version takes over once every tab of the old one is closed (no forced reload in the middle of a lesson).
- **Audio** (letters and words): import the files from `apps/web/src/lib` (for example with `import.meta.glob`) rather than putting them in `static/`. They then get content-hashed names, are precached automatically and are only downloaded again when they change. `apps/web/vite.config.ts` keeps `.opus`/`.mp3` files from being inlined as data URIs.

The manifest is built from [`apps/web/src/lib/pwa/manifest.ts`](apps/web/src/lib/pwa/manifest.ts) (name and description come from the i18n catalog; a unit test keeps its colors in sync with `apps/web/src/app.css`). The PNG icons in `apps/web/src/lib/assets/icons/` are rendered from `favicon.svg` with `npm run icons` (it uses Playwright's Chromium); rerun it and commit the PNGs whenever the favicon changes.

[`e2e/pwa.e2e.ts`](e2e/pwa.e2e.ts) checks that the app reloads offline, served by the service worker, in every browser. Under `npm run dev` the build file lists are empty, so only `static/` files get cached; try offline behavior on the production build (`npm run build && npm run preview`). To start from a clean state while debugging, unregister it in the browser dev tools (Application › Service workers).

## Deployment

The site is deployed by Cloudflare Pages through its Git integration: `main` goes to production at https://cyrilingo.pages.dev and every pull request gets a preview deployment. Pages project settings:

- Framework preset: None (the SvelteKit preset expects `adapter-cloudflare` and its `.svelte-kit/cloudflare` output)
- Build command: `npm run build`
- Build output directory: `apps/web/build`
- Node.js version: read from `.nvmrc`

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint, type check, unit tests and end-to-end tests on every pull request (not again on `main` after the merge; it can also be started by hand from the Actions tab).
