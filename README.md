# Cyrilingo

A web app to learn to read the Bulgarian Cyrillic alphabet, designed for native Latin-alphabet readers (French speakers first).

See [docs/SPECIFICATIONS.md](docs/SPECIFICATIONS.md) for the product specification.

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

### End-to-end tests

Playwright needs its browsers installed once (and again after a Playwright upgrade):

```bash
npx playwright install chromium firefox webkit
```

Tests live in [`e2e/`](e2e) and run against the production build on desktop Chrome, Firefox and Safari plus mobile Chrome and Safari viewports. To run a single browser: `npm run test:e2e -- --project=chromium`.

## Project structure

```
src/
├── app.html, app.css     # HTML shell (lang="fr") and global styles / design tokens
├── lib/
│   ├── core/             # Business logic: plain TypeScript, no Svelte (see below)
│   ├── i18n/             # Centralized UI strings, one catalog per locale (locales/fr.ts)
│   ├── ui/               # Reusable Svelte components
│   └── assets/           # Images and icons imported by the app
└── routes/               # SvelteKit pages (UI only)
e2e/                      # Playwright end-to-end tests
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

## Deployment

The site is deployed by Cloudflare Pages through its Git integration: `main` goes to production and every pull request gets a preview deployment. Pages project settings:

- Framework preset: SvelteKit (or none)
- Build command: `npm run build`
- Build output directory: `build`
- Node.js version: read from `.nvmrc`

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint, type check, unit tests and end-to-end tests on every pull request and on pushes to `main`.
