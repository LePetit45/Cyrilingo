# AGENTS.md

What an agent reads at the start of every session on this repository. The product and its rules are in [SPEC.md](SPEC.md), the source of truth for scope and decisions; this file is about how to work on it.

## Project

Cyrilingo teaches French speakers to read the Bulgarian Cyrillic alphabet. npm workspaces monorepo:

- `packages/core`: pure TypeScript shared by both sides (alphabet, content, lesson engine, answer checking). No framework, no I/O.
- `apps/web`: SvelteKit + Svelte 5 static PWA (offline first, guest mode).
- `apps/api`: Hono REST API on Node.js, PostgreSQL through Kysely, numbered SQL migrations, the MCP server.

## Commands

Run from the repository root. Node.js version: [`.nvmrc`](.nvmrc). Local settings: copy `.env.example` to `.env` (read by Docker Compose, `npm run dev`, `npm run db:migrate` and the API tests).

| Command                     | What it does                                                                  |
| --------------------------- | ----------------------------------------------------------------------------- |
| `npm install`               | install every workspace                                                       |
| `docker compose up db`      | start PostgreSQL for development                                              |
| `npm run dev`               | front end and API with hot reload (Vite proxies `/api`)                       |
| `npm run db:migrate`        | apply pending migrations, then the seed                                       |
| `npm run lint`              | Prettier check + ESLint (including the layer boundaries)                      |
| `npm run check`             | type check every workspace                                                    |
| `npm run test:unit`         | Vitest, all projects (add `-- --run` for a single run)                        |
| `npm run test:e2e`          | build, then Playwright end-to-end tests                                       |
| `npm run coverage`          | all Vitest projects with coverage; fails under 80 % lines or branches         |
| `npm run ac:check`          | fails if an acceptance criterion of SPEC.md has no test containing its id     |
| `npm run mcp`               | start the MCP server (needs `DATABASE_URL` and `CYRILINGO_SESSION_TOKEN`)     |
| `npm run audio`             | regenerate recordings with Azure TTS (needs `AZURE_SPEECH_*` in `.env.local`) |
| `docker compose up --build` | the full stack as deployed                                                    |

Before saying a change is done: `npm run lint && npm run check && npm run coverage && npm run ac:check`, plus `npm run test:e2e` when the UI changed.

## Layers

`http` (Hono routes) and `mcp` (MCP tools) → `services` → `db` / `auth` / `speech`.

- **A route handler or an MCP tool** parses and validates its input (Zod), calls **one** service function, and maps the result or error to HTTP or MCP. It never queries the database, never calls a provider, never decides who may do what.
- **A service** holds the rules: ownership, limits, account linking, quotas. It takes the acting user's id as its first argument and scopes every query on owned data to it. Somebody else's resource is "not found", exactly like a missing one.
- **Every MCP tool calls the same service function as its HTTP route.** Adding a tool means reusing a service, never writing a query.
- **Model calls** go through the `SpeechClient` interface in `apps/api/src/speech/`, with a timeout, and their output is validated in the service before anybody sees it. Tests use `FakeSpeechClient`.
- `packages/core` and `apps/web/src/lib/i18n` never import Svelte, SvelteKit or UI code.
- The front end talks to the back end only through `/api` with the typed client in `apps/web/src/lib/api/`.

## Conventions

- **Language**: everything committed or posted to GitHub is in English (code, comments, docs, commits, branches, PRs, issues, release notes). Exception: learner-facing French text, only inside the per-language files (`apps/web/src/lib/i18n/locales/`, `packages/core/src/content/i18n/`). English is planned (SPEC.md §10.9): never put learner-facing text in components, the API, the database or MCP output. Conversation with the project owner can be in French.
- **No hard-coded UI text**: strings come from the locale catalog (`fr.ts` is the reference). Error messages shown to users are sentences from that file, never a response body.
- **Design tokens**: colour, spacing, font size, font family and radius only through the `var(--…)` tokens of `apps/web/src/app.css`. Add a token rather than typing a value.
- **Every screen** handles loading, empty, error and success; keyboard works with a visible focus; text contrast ≥ 4.5:1.
- **Acceptance criteria**: a new behavior gets an `[AC-n]` line in SPEC.md §12 and a test whose title contains `AC-n`. Never reuse or renumber an id.
- **Schema changes**: a new numbered file in `apps/api/migrations/` (`0007_add_x.sql`). Never edit a migration that is already on `dev`.
- Unit tests sit next to the code (`*.test.ts`); end-to-end tests import `test` from `e2e/test.ts` (it mutes Web Audio).
- Modules are imported with `.js` extensions and the workspace aliases.

## Git workflow

- One branch + one pull request into `dev` per feature, squash-merged. No direct commits to `dev` or `main`, documentation included.
- A release is a pull request from `dev` into `main` that bumps the version (`package.json`, `package-lock.json`); once merged, publish a GitHub release tagged on `main`. A merge into `main` is deployed.
- CI (GitHub Actions) runs on every pull request: lint, type check, coverage, `ac:check`, end-to-end tests, secret scan.

## Always ask the project owner before

- pushing UI changes or opening a pull request with them: show a screenshot first;
- changing the course rules, the content (letters, words, translations) or anything in SPEC.md's goals and non-goals;
- adding a dependency, a third-party service or anything that sends user data out of the app;
- changing the database schema in a way that drops or rewrites data;
- merging a pull request, unless the owner said so for that pull request.

## Never

- Commit a secret (API key, client secret, password, token) or a real `.env` file: only `.env.example` with empty values.
- Commit anything specific to a deployment host (domain, server address, proxy or orchestrator details): use environment variables.
- Put an authorization check in a route handler or an MCP tool instead of the service.
- Write a database query outside `apps/api/src/db/`, or call a model provider outside `apps/api/src/speech/`.
- Call a real provider (Azure, Google) in a test.
- Log request bodies, passwords, tokens, e-mails, audio or recognized text. Only exception: `npm run db:migrate` prints the generated passwords of the development demo accounts, once, at their creation.
- Send the expected word to the speech provider.
- Show a model's output to a user before it is validated.
- Add daily streaks, mnemonics or anything that shows the stressed syllable on screen.
- Let the end-to-end tests play sounds.
