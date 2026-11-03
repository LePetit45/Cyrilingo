# Cyrilingo

This file is the source of truth for scope and decisions; [AGENTS.md](AGENTS.md) holds the working rules.

## Project option

Own project: Cyrilingo, a web app that teaches French speakers to read the Bulgarian Cyrillic alphabet.

## Goals

- A French speaker who finishes the 10 lessons can sound out any Bulgarian word (signs, menus, names) without necessarily understanding it, and passes the final exam with 90 % or more.
- The whole course is playable without an account, offline included; signing in is encouraged, never required.
- A learner signs in with an e-mail and a password or with Google, one person always ends up with one account, and their progress follows them across devices.
- A signed-in learner builds personal word lists and reviews them.
- In lessons, a signed-in learner also reads words aloud, checked by a speech recognition model.
- An AI agent can use the app through an MCP server, on behalf of one learner and with exactly that learner's rights.
- The interface is in French, and adding English later needs no rewrite (see UI › Languages).

## Non-goals

- Teaching Bulgarian vocabulary, grammar or conversation; handwriting; other Cyrillic variants (Russian, Serbian…).
- Scoring pronunciation phoneme by phoneme: the read-aloud exercise only checks that the word heard is the word expected.
- Sending e-mails: no e-mail verification for local accounts, no password reset by e-mail.
- Social features: no sharing of word lists, no leaderboards, no daily streaks (ever: not in the spirit of the app).
- An admin back office, native mobile apps.
- Time-based spaced repetition.

## Constraints

- Front end, back end and relational database in one public repository, a REST API between them, every schema change as a numbered migration, a public deployment, no secret in the repository.
- Stack: SvelteKit + Svelte 5 + TypeScript front end, Hono on Node.js back end, PostgreSQL (see Architecture).
- Passwords are never stored as readable text, only as an argon2id hash.
- Free tiers only for third-party services (Google OAuth, Azure Speech F0).
- Offline first: the course, the alphabet and free review keep working offline, for guests and signed-in learners alike. Only sign-in, sync, word lists and read-aloud need the network.
- French UI first, English later: learner-facing text lives only in the per-language locale and content files (see UI › Languages). Everything else in the repository is in English.
- Generic repository: nothing about a particular server, domain or proxy is committed; every deployment detail is an environment variable.
- Browsers: last 2 versions of Chrome, Firefox, Edge and Safari; Safari iOS 16+.
- Performance: Lighthouse mobile performance ≥ 90; front bundle < 300 KB excluding audio.
- Privacy: no analytics, no third-party requests from the front end, no cookie other than the session cookie (so no consent banner).

## The course

### The Bulgarian alphabet

30 letters: А Б В Г Д Е Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ь Ю Я.

| Group                                              | Letters                                  | Hook                           |
| -------------------------------------------------- | ---------------------------------------- | ------------------------------ |
| **1. Allies**: same shape, same sound              | А, Е, К, М, О, Т                         | You can already read 6 letters |
| **2. False friends**: Latin shape, other sound     | В (v), Н (n), Р (r), С (s), У (u), Х (h) | You have to unlearn            |
| **3. Greek cousins**: new but guessable            | Б, Г, Д, Л, П, Ф, И, Й, З                | Familiar from Greek            |
| **4. Newcomers**: sounds French spells differently | Ж, Ц, Ч, Ш, Щ, Ъ, Ь, Ю, Я                | The core of the effort         |

Bulgarian specifics: Щ = "sht"; Ъ is a real vowel (schwa); Ь only appears in **ьо** and is taught as that unit, with **йо**, in the last lesson; **Bulgarian lowercase shapes** (д like _g_, т like _m_, л without a hook) are used everywhere, and the discovery card mentions the standard (Russian) shape. One reference sound per letter; pronunciation nuances are notes on the letter card.

### Transliteration

Both are shown. The **phonetic** one depends on the interface language; in French it is the learning reference (Ж = j, Ш = ch, Ч = tch, Ц = ts, Щ = cht, Ъ = eu, Ю = iou, Я = ia). The **official** one (2009 system: zh, sh, ch, ts, sht, a, yu, ya), used on signs and passports, is shown next to it and accepted in typed answers. An English interface would use the official one as its phonetic reference, since it is already English-based.

### Path

- A **Duolingo-style path** of **10 lessons of 3 new letters each**, in **4 sections**, one per group, in the order of the table above, followed by the **final exam**.
- **Nothing is locked**: every lesson and the exam can be opened at any time. Each lesson is _completed_, _suggested_ (the first not completed) or _not done yet_.
- A lesson assumes every earlier lesson is known. Its letters are fixed; its readings are **drawn at random** from the corpus among the words readable with the letters known so far, so a replay shows other words. A lesson never shows a letter from a later lesson.

### Lesson flow

1. **Discovery cards** for the 3 new letters: both cases (Bulgarian shapes), recorded sound, both transliterations, example words, notes.
2. **9 questions on the new letters**: each letter goes through letter → sound MCQ, sound → letter MCQ and the reading of a word (a syllable when too few words exist).
3. **3 mixed readings** (syllables in lesson 1).
4. **Up to 4 review questions** (see Review).
5. For a signed-in learner, **2 read-aloud questions** on words of the lesson (see The model feature), on top of the questions above.

Questions of steps 2–5 are shuffled. A lesson takes 6–8 minutes.

### Progress model

- A **wrong answer** (or « Je ne sais pas ») does not move the progress bar; the question comes back later in the lesson, with its choices reshuffled.
- The lesson ends when **every question has been answered right once**. Leaving midway discards it.
- The **summary** shows the first-try success rate and the letters missed.

### Review

No time-based scheduling, no per-letter mastery level. Each lesson has up to 4 review questions: half on the letters of the 2 previous lessons, half on older letters at random (one half fills in for the other; lesson 1 has none). **Free review** asks 12 questions on letters of completed lessons, with words from the whole corpus. **« Réviser ma liste »** asks reading questions on up to 12 words of one of the learner's lists. Nothing about a review is saved.

### Final exam: « L'Épreuve de Preslav »

30 questions covering the 30 letters, mostly readings. Missed questions are not repeated; passing takes **90 %** or more. On success, a diploma with an animation; the first name typed on it is not saved.

### Exercises and answer checking

- **Letter → sound MCQ** and **sound → letter MCQ** (4 choices, answered on tap or with keys 1–4). Distractors are known letters, sometimes deliberate look-alikes (В/B, Н/H, Р/P, С/C, У/Y, Х/X; Ш/Щ, И/Й, Ц/Щ, Ъ/Ь).
- **Reading**: a word is shown, the learner types it in Latin letters and confirms with « Vérifier » or Enter. Case, spaces, hyphens and accents are ignored; each Cyrillic letter is checked against its list of accepted Latin variants (Ъ: a, eu, ă, u; Й: y, i; Х: h, kh; Ж: j, zh; Ц: ts, tz; Ю: iou, yu, ju; Я: ia, ya, ja; У: ou, u; Щ: cht, sht; Ш: ch, sh; Ч: tch, ch), and both systems can be mixed in one word. A final -ия may be typed « ia ». **No typo tolerance**; wrong letters are highlighted.
- **Read aloud** (signed-in learners only): see The model feature.
- **« Je ne sais pas »** on every question counts as wrong and shows the answer.
- **Feedback** in a colored panel at the bottom (green / red), with the answer, the letter or word, its translation and its recording. Audio autoplays on discovery cards, on sound → letter prompts and after each answer, never before an answer it would give away. Words also have a slowed-down « turtle » replay.
- **Input**: on touch devices (`pointer: coarse`), an in-app keyboard whose layout follows the interface language (AZERTY in French; the native keyboard never opens); on desktop, a plain text field with autocorrect off.

### Content

Typed TypeScript data files (letters, lessons, ~270 words and ~60 syllables, transliteration table; translations and other learner-facing text in one content file per language), drafted by Claude and reviewed by the project owner against Wiktionary and Bulgarian dictionaries. Unit tests check the content invariants. Recordings are generated once with Azure Speech text-to-speech (voice `bg-BG-BorislavNeural`) by `npm run audio`, committed as static files; the app never calls the TTS provider at run time.

## The model feature

- Model: Azure AI Speech, speech to text (short-audio REST API, language `bg-BG`), called from `apps/api/src/speech/` and nowhere else.
- Input: a recording of the learner reading one word aloud (at most 5 seconds, 16 kHz mono WAV) and the language code; never the expected word, never anything about the user.
- Output: the text heard, validated (non-empty, at most 40 characters, only Bulgarian letters) then compared with the expected word, giving `match`, `mismatch` (with the validated text), `not_understood` or `unavailable`.
- When it fails: no key, a timeout after 8 seconds, a provider error or a 429 all give `unavailable`: the learner sees a sentence saying so, the question is passed without penalty and the lesson goes on. An output that fails validation is never shown (`not_understood`). Every other feature works with no key at all.

### What it does

During a lesson, a signed-in learner sees **2 read-aloud questions**: a word of the lesson is shown, the learner taps the microphone, reads it aloud, and the app says whether the word heard is the word expected. They come **in addition to** the regular questions (none of them is replaced). Lessons with no word (only syllables, lesson 1) have none.

- **« Je ne peux pas parler »** skips the question and removes the read-aloud questions for the rest of the lesson; it counts neither as right nor as wrong.
- A **match** counts as a right answer. A **mismatch** shows « J'ai entendu : … » with the validated text, plays the reference recording and allows a second try; after 2 failed tries the question is passed **without penalty**, since recognizing a single isolated word is never 100 % reliable.
- When the feature is **unavailable** (no key, provider down, timeout, quota reached, microphone refused), the learner sees a sentence saying so, the question is passed without penalty and the lesson goes on.
- Guests never get these questions; the summary tells them signing in unlocks them.

### Why this model

- It is a dedicated speech recognition model that supports Bulgarian; unlike a general LLM, it does not "fix" what it hears into something plausible.
- The free tier (F0, 5 audio hours per month) covers far more than this app needs (a try is ~3 s).
- Microsoft does not use the audio sent to this API to train its models, and does not keep it unless logging is enabled on the resource (it is not).
- The project already uses Azure Speech to generate its recordings, so no new account is needed.

Rejected: **Gemini** (multimodal LLM: can hallucinate a transcription; on the free tier Google may use inputs to improve its products, and here the input is a voice) and **a local Whisper model** (no data leaves, but slow on a small server and weaker on isolated Bulgarian words).

### How it works

1. The browser records up to **5 seconds** with `MediaRecorder`, converts it to 16 kHz mono 16-bit WAV (`AudioContext`), and sends it to `POST /api/speech/recognitions?word=<id>` (≤ 256 KB).
2. The route checks the session and the body, then calls `speechService.check(userId, wordId, audio)`.
3. The service checks the word is in the corpus and the daily quota, then calls the **speech client** (an interface; `AzureSpeechClient` in production, `FakeSpeechClient` in tests). Only the audio and the language go to the provider: **never the expected word**, so the model cannot be biased toward the right answer.
4. The client call has a **timeout of 8 seconds** (`AbortSignal.timeout`).
5. The service **validates** the output, then compares it with the expected word, and returns `match`, `mismatch`, `not_understood` or `unavailable`.

### Output validation

The provider's text is shown to nobody until it passes these checks:

- recognition status is `Success` (anything else → `not_understood`);
- after lowercasing, Unicode NFC and removing punctuation, it is **non-empty**, at most **40 characters**, and made **only of the 30 Bulgarian letters, spaces and hyphens** (anything else — Latin letters, digits, other Cyrillic letters such as ы or ё — → `not_understood`).

A match is equality of the normalized text with the normalized expected word.

### Timeout, fallback and limits

| Situation                               | Behavior                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `AZURE_SPEECH_KEY` missing              | the API starts normally, `GET /api/me` reports the feature off, lessons have no read-aloud question |
| timeout (8 s), network error, 5xx       | `unavailable`, question passed, readable sentence                                                   |
| provider 429 (rate limit)               | `unavailable`, same                                                                                 |
| more than **60 tries per user per day** | 429 from our API, readable sentence, question passed                                                |
| microphone refused or missing           | handled in the browser, question passed, readable sentence                                          |

The fallback is written first: every other feature works with no key at all.

### What data leaves the app

| Data                                                                 | Goes to                                                     | When                | Kept                                                                        |
| -------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------- |
| the read-aloud recording (the learner's voice, ≤ 5 s)                | Microsoft Azure, in the region set by `AZURE_SPEECH_REGION` | each read-aloud try | not stored by Cyrilingo, nor logged; not kept by Azure (no logging enabled) |
| the fact that a person signs into Cyrilingo, and their Google e-mail | Google (they sign in there)                                 | Google sign-in      | by Google, per its terms                                                    |

Never sent anywhere: the expected word, the user's id or e-mail (not to Azure), passwords, tokens. Server logs hold the method, path, status, duration and, for speech, the outcome; never request bodies, e-mails, audio, recognized text or tokens.

## Auth

- Local: e-mail and a password of 8 to 128 characters, stored only as an argon2id hash.
- Provider: Sign in with Google, the OAuth 2.0 authorization code flow with PKCE, on the server.
- Linking: on the e-mail address, and only when Google marks it as verified; an address Google has not verified is refused. Linking to a local account whose address was never verified removes its password and revokes its sessions.

### Local accounts

- Sign-up with an e-mail and a password of **8 to 128 characters**. The password is stored as an **argon2id** hash (never in clear, never logged). The e-mail is lowercased and trimmed; it is **not verified** (no e-mail sending).
- Sign-in failures give the same answer for an unknown e-mail and a wrong password (401), in about the same time (a password check is spent on unknown e-mails too). More than 10 failed attempts from one IP within 15 minutes are refused with 429, even with the right password. The count lives in the API's memory (one process; a restart forgets it). The IP is the socket's, or behind a trusted proxy (`TRUST_PROXY=true`) the first address of `X-Forwarded-For`, which that proxy must set.
- Signing up with an e-mail that already has an account is refused with 409, with a sentence suggesting to sign in (code `email_taken`), with Google if that account has no password (`email_taken_google`).

### Google sign-in

- OAuth 2.0 authorization code flow with **PKCE** and a `state` value, both kept in short-lived HttpOnly cookies and checked on the callback. Scopes: `openid email`. The ID token is verified (signature, issuer, audience, expiry).
- The redirect URI is `${PUBLIC_URL}/api/auth/google/callback`.
- A Google identity whose e-mail is **not verified by Google** (`email_verified` false) is refused: it never creates nor links an account.

### One person, one account

On a Google callback with a verified e-mail:

1. If the Google identity (`sub`) is already linked, sign into its user.
2. Else, if a user has the **same e-mail**, link the Google identity to that user and sign in. If that user's e-mail was never verified (a local account), its password is **removed** and its other sessions are **revoked**: somebody may have created the account with another person's address before that person ever signed in ("pre-hijacking"). The learner is told, and can set a new password in the settings.
3. Else, create a user with `email_verified` true and link the identity.

Somebody who signs up with a password on Monday and with Google on Tuesday is one user, with the same progress and lists.

### Sessions

Both ways end in **the same kind of session**: a random 256-bit token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie named `session`. Only its SHA-256 hash is stored, so a database leak gives no usable token. A session lasts 30 days, renewed when used during its last 15 days. Signing out deletes it. Changing the password revokes the other sessions.

### Authorization

Authentication answers "who are you"; authorization answers "may you do this". Every rule lives in the **service layer**, never in a route handler: services take the acting user's id as their first argument, and every query on owned data is scoped to it. A word list that belongs to somebody else is answered exactly like a list that does not exist (**404**), so ids cannot be probed. Services are tested directly for these rules (AC-32), and the HTTP routes and MCP tools only translate inputs and errors.

### Account management

The settings show the e-mail and the linked providers, let the learner set or change a password (the current one is required when one exists), create or revoke agent tokens (see MCP tools), and **delete the account** (with confirmation), which removes all its data. A forgotten password cannot be reset without e-mail: an account linked to Google can still sign in with Google; otherwise it is lost (see Non-goals).

### Guests and progress sync

- Guests play the whole course; their progress lives in `localStorage`, and nothing is sent to the server. The path and the summary invite them to sign in (« Connecte-toi pour garder ta progression sur tous tes appareils »).
- **At sign-in**, the device's progress is merged into the account (`PATCH /api/progress`), then the device shows the account's progress.
- **While signed in**, the account is the reference and the device keeps a copy for offline play. Each completed lesson and passed exam is sent to the account; if the request fails (offline), it waits in a queue on the device. At each sync (app start, back online), the device sends its queue, then **replaces** its copy with the account's progress. Only the queue is sent, never the whole copy, so a reset made on another device is not undone.
- **Signing out** removes the account's progress from the device and keeps the settings.
- **« Réinitialiser ma progression »** while signed in resets the account's progress (`DELETE /api/progress`) as well as the device's, after a confirmation saying it applies to every device.

## MCP tools

An MCP server (stdio transport, `npm run mcp`) lets an AI agent use Cyrilingo **as one learner**. It is built with the official TypeScript SDK (`@modelcontextprotocol/sdk`), which handles the JSON-RPC 2.0 protocol (the `initialize` handshake, `tools/list`, `tools/call`); the project only declares the tools.

- **One user, never an admin**: the server reads an ordinary session token from `CYRILINGO_SESSION_TOKEN` and resolves it with the same auth service as the HTTP API; it refuses to start when the token is missing, unknown or expired. The learner creates the token in the settings (« Créer un jeton pour un agent »): a session of kind `agent`, shown once, revocable. There is no admin token anywhere.
- **One set of rules, two front doors**: every tool validates its input, then calls **the same service function as the matching HTTP route**, and maps service errors to MCP errors. No tool runs its own query.

| Tool               | What it does                                                                                                        | Who may call it                 | Service function          | HTTP route                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------- | -------------------------------- |
| `list_lessons`     | List the 10 lessons of the course in order, with the letters each one teaches and whether the learner completed it. | the token's user                | `lessonService.list`      | `GET /api/lessons`               |
| `get_progress`     | Get the learner's progress: completed lesson ids and whether the final exam was passed.                             | the token's user                | `progressService.get`     | `GET /api/progress`              |
| `list_word_lists`  | List the learner's personal word lists, with the Cyrillic words and their official Latin transliteration.           | the token's user, own lists     | `wordListService.list`    | `GET /api/word-lists`            |
| `create_word_list` | Create a new, empty personal word list with the given name (1 to 40 characters).                                    | the token's user                | `wordListService.create`  | `POST /api/word-lists`           |
| `add_word_to_list` | Add a word from the Cyrilingo corpus (written in Cyrillic) to one of the learner's word lists.                      | the token's user, own list only | `wordListService.addWord` | `POST /api/word-lists/:id/words` |
| `delete_word_list` | Delete one of the learner's word lists and every word in it. This cannot be undone.                                 | the token's user, own list only | `wordListService.remove`  | `DELETE /api/word-lists/:id`     |

The first two are read-only, over the course; the four others act on the learner's own data. To use the server, set `DATABASE_URL` and `CYRILINGO_SESSION_TOKEN` (locally against the development database, or inside the `api` container of a deployment).

## UI

Stack: SvelteKit + Svelte 5 + TypeScript, built as a static PWA (`adapter-static`, service worker), plain CSS with design tokens, Nunito and Sofia Sans self-hosted. Screens: Path (home), Lesson, Free review, Exam and diploma, Alphabet, Word lists, Sign in, Sign up, Settings.

### Screens

| Screen                                | Content                                                                                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Path** (home)                       | letters-read count, current section banner, the path, free review and exam entries; sign-in invitation for guests                                                                            |
| **Lesson**, **Free review**, **Exam** | discovery cards, questions, bottom feedback panel, summary; diploma after a passed exam                                                                                                      |
| **Alphabet**                          | the 30 letters, learned or not; a letter opens its discovery card                                                                                                                            |
| **Word lists**                        | the learner's lists; a list shows its words, lets the learner rename it, delete it, remove words, and start « Réviser ma liste » (reading questions on up to 12 of its words, nothing saved) |
| **Sign in** / **Sign up**             | e-mail and password forms, « Continuer avec Google »                                                                                                                                         |
| **Settings**                          | sound, sound effects, account (e-mail, password, agent tokens, sign out, delete account), reset progress, about                                                                              |

Words are added to a list from the feedback panel of a reading or read-aloud question (« Ajouter à une liste »), for signed-in learners. Navigation: bottom tab bar on mobile with **5 entries** (Parcours, Alphabet, Révision libre, Listes, Plus), left sidebar with the same entries on desktop; hidden during a lesson, review or exam. Guests opening Listes see a sign-in invitation.

### Visual identity

Light, gamified theme inspired by Duolingo's visual language (not a copy: no name, mascot, proprietary font or brand colors from it): white surfaces, light gray borders, chunky elements with a darker bottom edge, green for main actions and right answers, red for wrong ones, one color per path section (green, pink, blue, purple). Nunito for the interface, Sofia Sans for every Cyrillic text (Bulgarian shapes, tagged `lang="bg"`). No mascot, no dark mode yet.

### Design tokens

Colour, spacing, font size, font family and radius come from **CSS custom properties** defined once in `apps/web/src/app.css` (`--color-*`, `--space-*`, `--font-size-*`, `--font-*`, `--radius-*`). Component styles use only `var(--…)` for these properties; a unit test scans component styles and fails on a raw value (AC-60).

### Responsive

Mobile first. Every screen works at **380, 768 and 1280 pixels** wide with no horizontal scrolling, checked by an end-to-end test on each screen at the three widths (AC-61).

### Four states per screen

Every screen has a **loading**, an **empty**, an **error** and a **success** state. Errors are sentences from the locale file, saying what happened and what to do; never a raw body, status code or stack trace.

| Screen                 | Loading                                                                         | Empty                                                                                                                              | Error                                                                                           | Success                   |
| ---------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------- |
| Path                   | syncing badge while the account progress loads (the local path shows meanwhile) | no lesson done: welcome banner, lesson 1 suggested                                                                                 | « Impossible de synchroniser ta progression. Elle reste enregistrée sur cet appareil. » + retry | path with states          |
| Lesson / review / exam | spinner while the session is composed and fonts load                            | free review with no completed lesson: « Termine une leçon pour débloquer la révision libre. »                                      | unknown lesson id: « Cette leçon n'existe pas. » + back to the path                             | questions, summary        |
| Read-aloud question    | « J'écoute… » while recording, « J'analyse ta lecture… » while waiting          | no word heard: « Je n'ai rien entendu. Rapproche-toi du micro et réessaie. »                                                       | the sentences of The model feature › Timeout, fallback and limits                               | match / mismatch feedback |
| Alphabet               | spinner until fonts load                                                        | no letter learned: « Aucune lettre apprise pour l'instant. »                                                                       | (static data) generic error page                                                                | letter grid               |
| Word lists             | skeleton list                                                                   | no list: « Tu n'as pas encore de liste. » + create button; empty list: « Cette liste est vide. Ajoute des mots depuis une leçon. » | load or save failure sentence + retry                                                           | lists and words           |
| Sign in / up           | button busy while submitting                                                    | empty form                                                                                                                         | wrong credentials, e-mail taken, too many attempts, network down: one sentence each             | redirect to the path      |
| Settings               | spinner on account actions                                                      | guest: sign-in invitation in place of the account block                                                                            | action failure sentence                                                                         | saved state               |

A shared `+error.svelte` page catches anything unexpected with a sentence and a link home. Every async action uses one `AsyncState` helper (`idle | loading | error | success`) so no screen can skip a state.

### Keyboard and focus

The main flow (open the suggested lesson, read the cards, answer every question, finish) works with the **keyboard alone**: Tab / Shift+Tab, Enter, Space, keys 1–4 on MCQs, typing on readings, Escape to leave. The focused element always shows a visible ring (`:focus-visible`, 3 px, `--color-focus`), never removed. Dialogs trap focus and give it back on close.

### Contrast

Text contrast is **at least 4.5:1** everywhere, white text on colored buttons included (their fills are dark enough for it; the 3:1 large-text exception is not used). Measured with **axe-core** (`@axe-core/playwright`, rule `color-contrast`) on every screen in end-to-end tests (AC-64), and token pairs are checked with the WebAIM Contrast Checker.

### The model feature in the UI

The read-aloud question shows that it is **working** (microphone pulsing and « J'écoute… » while recording, a spinner and « J'analyse ta lecture… » while waiting, announced through an `aria-live` region) and shows **when it failed** (a readable sentence in the feedback panel).

### Languages

The interface ships in **French** only; **English is planned**, and nothing may stand in its way:

- UI strings live in `apps/web/src/lib/i18n/locales/<lang>.ts`, learner-facing content (translations, sound explanations, letter notes, phonetic transliterations) in `packages/core/src/content/i18n/<lang>.ts`. French is the reference catalog: its type is what another language must implement, so a missing string is a compile error.
- No learner-facing text anywhere else: not in components, not in the API (it returns error codes), not in the database (words have no translation column), not in MCP tool output (it returns Cyrillic and official transliterations, which do not depend on the language).
- What depends on the language is looked up by language: phonetic transliteration, keyboard layout, accepted spellings in typed answers (the union over languages is accepted, so a learner who switches language keeps passing).
- The language is a device setting, like sound (default: the browser's language when supported, else French); the `<html lang>` follows it, Bulgarian text stays `lang="bg"`.
- Adding English then means: the two English files, a QWERTY layout, a language switch in the settings, and English end-to-end checks. No schema change, no API change.

## Architecture

### Layout

An npm workspaces monorepo:

```
packages/core/   pure TypeScript shared by both sides: alphabet, content, lesson engine,
                 reading checker, speech text normalization. No framework, no I/O.
apps/web/        SvelteKit (Svelte 5) static PWA: routes, components, i18n, a typed API client.
apps/api/        Hono on Node.js:
  src/http/        routes: parse and validate input, call one service, map errors to HTTP
  src/services/    the rules: ownership, limits, linking, quotas (take the acting user id)
  src/db/          Kysely queries, connection, migration runner, seed
  src/auth/        password hashing, tokens, Google OAuth client
  src/speech/      SpeechClient interface, Azure client, fake client
  src/mcp/         MCP server: tool declarations calling the services
  migrations/      0001_init.sql, 0002_…sql
```

### Layers

`http` and `mcp` → `services` → `db`, `auth`, `speech`. A route handler never talks to the database or to a provider; a service never sees HTTP. ESLint enforces the import boundaries.

One request through every layer, deleting a word list:

1. `apps/web/src/routes/(tabs)/lists/[id]/+page.svelte`: the learner confirms the deletion; the page calls the API client.
2. `apps/web/src/lib/api/client.ts`: `DELETE /api/word-lists/:id`, with the session cookie.
3. `apps/api/src/http/word-lists.ts`: checks the session and the id, calls `wordListService.remove(userId, listId)`, maps "not found" to 404.
4. `apps/api/src/services/word-lists.ts`: deletes the list only if `user_id` is the acting user, else throws "not found".
5. `apps/api/src/db/word-lists.ts`: `DELETE FROM word_lists WHERE id = $1 AND user_id = $2`; the list's words go with it (cascade).

The MCP tool `delete_word_list` (`apps/api/src/mcp/tools.ts`) enters at step 4 with the token's user, so the same rule applies.

### Data model

PostgreSQL. Reference data (letters, lessons, words) comes from the TypeScript content files and is **seeded** into the database on every deployment (idempotent upsert), so foreign keys can point at it. The seed never deletes a row: a word dropped from the content stays in the lists that hold it. Seeding changes data, not the schema; every schema change is a numbered migration. The seed creates no account: accounts are made through sign-up, in development too.

| Table                | Content                                                                                                                          | Owned by a user        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `letters`            | the 30 letters (`id` = the uppercase letter, `section` = its group, position)                                                    | no                     |
| `lessons`            | the 10 lessons (`id` = `l1`…`l10`, section, position)                                                                            | no                     |
| `lesson_letters`     | **many-to-many** lessons ↔ letters (3 letters per lesson)                                                                        | no                     |
| `words`              | corpus words and syllables (`id` = the Cyrillic text, kind); no translation: translations are per language, in the content files | no                     |
| `users`              | `id`, `email` (unique, lowercased), `email_verified`, `password_hash` (nullable), `exam_passed_at`, `created_at`                 | —                      |
| `oauth_accounts`     | `(provider, provider_user_id)` → `user_id`: one row per Google identity linked to a user                                         | yes                    |
| `sessions`           | `id` = SHA-256 of the token, `user_id`, `kind` (`browser` or `agent`), `expires_at`, `created_at`                                | yes                    |
| `lesson_completions` | **many-to-many** users ↔ lessons, with `completed_at`                                                                            | yes                    |
| `word_lists`         | `id`, `user_id`, `name`, `created_at`, `updated_at`                                                                              | yes                    |
| `word_list_words`    | **many-to-many** word lists ↔ words, with `added_at`                                                                             | yes (through the list) |
| `speech_attempts`    | `user_id`, `created_at`, `outcome` — counts the daily speech quota; no audio, no text                                            | yes                    |

Deleting a user cascades to everything they own.

### REST API

JSON over HTTPS under `/api`, served on the same origin as the front end (the front end calls relative paths). Errors are `{"error": {"code": "...", "message": "..."}}`; the front end shows a sentence in the interface language picked from `code`, never the body itself. The API holds no learner-facing text.

| Method and path                          | What it does                                                                                           | Auth    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------- |
| `GET /api/health`                        | 200 when the database answers                                                                          | —       |
| `POST /api/auth/signup`                  | create a local account, start a session                                                                | —       |
| `POST /api/auth/login`                   | sign in with e-mail and password                                                                       | —       |
| `POST /api/auth/logout`                  | end the current session                                                                                | session |
| `GET /api/auth/google`                   | start Google sign-in (redirect)                                                                        | —       |
| `GET /api/auth/google/callback`          | finish Google sign-in, start a session, redirect to the app                                            | —       |
| `GET /api/me`                            | the signed-in user (e-mail, password set or not, linked providers, features on)                        | session |
| `PUT /api/me/password`                   | set or change the password                                                                             | session |
| `DELETE /api/me`                         | delete the account and all its data                                                                    | session |
| `POST /api/me/agent-tokens`              | create an agent token for the MCP server, shown once                                                   | session |
| `DELETE /api/me/agent-tokens`            | revoke every agent token                                                                               | session |
| `GET /api/lessons`                       | the lessons with their letters, and whether each is completed                                          | session |
| `GET /api/progress`                      | completed lessons and exam status                                                                      | session |
| `PATCH /api/progress`                    | **merge** progress into the account (union of completed lessons; exam passed if passed on either side) | session |
| `DELETE /api/progress`                   | reset the account's progress (completed lessons and exam)                                              | session |
| `GET /api/word-lists`                    | the user's lists with their words                                                                      | session |
| `POST /api/word-lists`                   | create a list                                                                                          | session |
| `PATCH /api/word-lists/:id`              | rename a list                                                                                          | owner   |
| `DELETE /api/word-lists/:id`             | delete a list                                                                                          | owner   |
| `POST /api/word-lists/:id/words`         | add a corpus word to a list                                                                            | owner   |
| `DELETE /api/word-lists/:id/words/:word` | remove a word from a list                                                                              | owner   |
| `POST /api/speech/recognitions`          | check a read-aloud recording against an expected word                                                  | session |

Mutating requests must carry `Content-Type: application/json` (or `audio/wav` for speech) and an `Origin` equal to `PUBLIC_URL`; anything else is refused with 403 (CSRF protection on top of `SameSite=Lax`). JSON bodies over 16 KB are refused with 413; a malformed body gives 400 `invalid_input`.

### Technologies

| Concern        | Technology                                                                                                           | Why                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Front end      | SvelteKit + Svelte 5 + TypeScript, `adapter-static`, service worker                                                  | offline PWA                                     |
| Back end       | Hono on Node.js 24                                                                                                   | small, typed, Web-standard `Request`/`Response` |
| Database       | PostgreSQL 17                                                                                                        | relational, foreign keys, cascades              |
| Queries        | Kysely                                                                                                               | typed SQL query builder, stays close to SQL     |
| Migrations     | numbered plain SQL files, applied in order by a small runner, each in a transaction, recorded in `schema_migrations` | readable, no magic                              |
| Validation     | Zod                                                                                                                  | one schema per request body and tool input      |
| Passwords      | argon2id (`@node-rs/argon2`)                                                                                         | memory-hard hash, current OWASP recommendation  |
| Google sign-in | Arctic (OAuth 2.0 + PKCE client)                                                                                     | only the OAuth plumbing; sessions stay ours     |
| Speech         | Azure AI Speech REST API through `fetch`                                                                             | see The model feature                           |
| MCP            | `@modelcontextprotocol/sdk`, stdio                                                                                   | official SDK                                    |
| Tests          | Vitest (unit, services against a throwaway PostgreSQL, components), Playwright (end to end), axe-core                |                                                 |
| Coverage       | `@vitest/coverage-v8`                                                                                                | one command, lines and branches                 |
| Deployment     | Docker Compose                                                                                                       | see Deployment                                  |

### Tests and coverage

- `npm run coverage` runs every Vitest project and reports coverage for the whole code; it fails under **80 % of lines or branches**.
- Service tests run the real migrations against a throwaway PostgreSQL and test the rules directly, the ownership checks first.
- The speech service is tested with `FakeSpeechClient`, which can answer right, wrong, garbage, slowly (timeout) or fail, on demand. No test calls a real provider; Google sign-in is tested with a fake OAuth client.
- Every acceptance criterion has a test whose title contains its id; `npm run ac:check` lists the ids in this file, searches the test titles, and fails on any id without a test. CI runs it.

### Deployment

`compose.yaml` runs four services:

- `db`: PostgreSQL with a named volume, on an internal network only;
- `migrate`: runs the migrations then the seed, once, before `api` starts;
- `api`: the Hono server;
- `web`: Nginx serving the static front end and forwarding `/api` to `api`; the only published port, `${WEB_PORT:-8080}`.

HTTPS is terminated by whatever reverse proxy sits in front of `web`; the app trusts its `X-Forwarded-*` headers only when `TRUST_PROXY=true`. Images are built from the repository (`build:`), so any host that can run Docker Compose from a Git repository can deploy it; a merge into `main` is a release.

Configuration, all through environment variables (template in `.env.example`; real values never committed): `PUBLIC_URL`, `PORT` (the API's, default 3000), `WEB_PORT`, `TRUST_PROXY`, `POSTGRES_PASSWORD`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`. Missing Google or Azure settings turn the matching feature off; a missing `PUBLIC_URL` or database setting stops the API at start with a clear message. CI runs a secret scanner (gitleaks) on every pull request.

Local development: `docker compose up db` then `npm run dev` (front end and API with hot reload, Vite proxies `/api`), or `docker compose up --build` for the full stack.

## Acceptance criteria

### Course

- [AC-1] Each of the 30 letters is introduced in exactly one of the 10 lessons, 3 per lesson, in the order of the letter groups.
- [AC-2] A lesson never shows a word or syllable containing a letter from a later lesson.
- [AC-3] A lesson has 3 discovery cards, 9 questions on the new letters (each letter in the three exercise types), 3 mixed readings and up to 4 review questions (none in lesson 1).
- [AC-4] A wrong answer or « Je ne sais pas » leaves the progress bar still and brings the question back later with reshuffled choices; the lesson ends once every question was answered right once.
- [AC-5] A reading answer ignores case, spaces, hyphens and accents, accepts every listed variant of each letter (mixed in one word), and is wrong as soon as one letter is wrong.
- [AC-6] The exam has 30 questions covering the 30 letters, repeats no missed question, and is passed at 90 % or more.
- [AC-7] Free review asks 12 questions, only on letters of completed lessons.
- [AC-8] A guest's progress and settings survive a reload, and a guest's play sends no request to the API.

### Accounts and sessions

- [AC-10] Signing up with a valid e-mail and a password of 8 to 128 characters creates a user, stores an argon2id hash and no clear password, and starts a session.
- [AC-11] Signing in with an unknown e-mail or a wrong password returns 401 with the same message.
- [AC-12] Signing up with an e-mail that already has an account returns 409.
- [AC-13] The session cookie is HttpOnly, Secure and SameSite=Lax, holds a random token whose SHA-256 hash only is stored, expires after 30 days, and is deleted at sign-out.
- [AC-14] A Google callback whose state or PKCE verifier does not match is refused.
- [AC-15] A Google sign-in with a verified e-mail that matches an existing user signs into that user: same id, same progress, same lists, and no second row in `users`.
- [AC-16] A Google identity whose e-mail is not verified neither creates nor links an account.
- [AC-17] Linking Google to a local account whose e-mail was never verified removes its password and revokes its other sessions.
- [AC-18] A signed-in user can set or change their password; changing it requires the current one when one exists and revokes the other sessions.
- [AC-19] Deleting the account removes the user, their sessions, progress, lists and speech attempts.
- [AC-20] More than 10 failed sign-ins from one IP within 15 minutes are refused with 429.
- [AC-21] A mutating request with a foreign `Origin` or an unexpected content type is refused with 403.

### Progress sync

- [AC-22] At sign-in, the device's progress is merged into the account: union of completed lessons, exam passed if passed on either side.
- [AC-23] A lesson completed while signed in is saved to the account; if the request fails, it is kept on the device and sent at the next sync.
- [AC-24] Signing out removes the account's progress from the device and keeps the settings.
- [AC-25] Resetting progress while signed in empties the account's completed lessons and exam status, and other devices show the reset at their next sync.

### Word lists and authorization

- [AC-30] A signed-in user can create a list named with 1 to 40 characters, rename it and delete it; a 21st list is refused.
- [AC-31] Only corpus words can be added to a list, each at most once, up to 200 words per list.
- [AC-32] The word list service refuses to rename, delete, add to or remove from a list owned by another user, with the same "not found" error as a missing list.
- [AC-33] Listing word lists only ever returns the acting user's lists.
- [AC-34] « Réviser ma liste » asks reading questions on up to 12 words of the list and saves nothing; an empty list cannot be reviewed.
- [AC-35] From the feedback panel of a reading question, a signed-in user can add the word to one of their lists.
- [AC-36] Every word list route answers 401 without a session.

### Read aloud (model feature)

- [AC-40] A lesson played signed in contains 2 read-aloud questions on words of the lesson in addition to the regular questions; a guest's lesson contains none.
- [AC-41] « Je ne peux pas parler » passes the question, removes the remaining read-aloud questions of the lesson, and counts neither right nor wrong.
- [AC-42] A recognized text is shown only if it is non-empty, at most 40 characters, and made only of Bulgarian letters, spaces and hyphens after normalization; otherwise the outcome is `not_understood`.
- [AC-43] A recognized text equal to the expected word is a right answer; a different one is shown as « J'ai entendu », and after 2 failed tries the question is passed without penalty.
- [AC-44] A provider that does not answer within 8 seconds, fails, or rate-limits gives the outcome `unavailable`, and the lesson goes on.
- [AC-45] Without `AZURE_SPEECH_KEY`, the API starts, every other feature works, and lessons have no read-aloud question.
- [AC-46] A user's 61st recognition of the day is refused with 429.
- [AC-47] The provider receives only the audio and the language, never the expected word nor user data; the audio and recognized text are neither stored nor logged.
- [AC-48] While recording and while waiting, the read-aloud question shows that it is working; on failure, it shows a readable sentence.

### MCP server

- [AC-50] The MCP server lists 6 tools, each with a description of at least 20 characters.
- [AC-51] Each MCP tool calls the same service function as its HTTP route, and gets the same result and the same errors (an MCP `delete_word_list` on another user's list fails like the HTTP route).
- [AC-52] The MCP server refuses to start without a valid session token, and acts as that token's user only.
- [AC-53] A signed-in user can create an agent token, shown once, and revoke all agent tokens, after which the MCP server is refused.

### UI

- [AC-60] Component styles take colour, spacing, font size, font family and radius only from design tokens.
- [AC-61] Every screen has no horizontal scrolling at 380, 768 and 1280 pixels wide.
- [AC-62] Every screen that loads data shows a loading, an empty, an error and a success state, and the error is a sentence from the locale file.
- [AC-63] Lesson 1 can be completed with the keyboard alone, and the focused element always has a visible focus ring.
- [AC-64] axe-core reports no `color-contrast` violation (4.5:1) on any screen.

### Data and operations

- [AC-70] Migrations are numbered SQL files applied in order, each once, and running them again changes nothing.
- [AC-71] The seed loads every letter, lesson and corpus word, and running it again changes nothing.
- [AC-72] `GET /api/health` returns 200 when the database answers and 503 when it does not.
- [AC-73] The API refuses to start without `PUBLIC_URL` or a database setting, and starts with Google or Azure settings missing.
- [AC-74] `npm run ac:check` fails when an acceptance criterion of this file has no test containing its id.

### Slice 1: sign-in and the word lists screen

- [AC-75] A visitor who is not signed in and opens Listes sees the sign-in invitation and no list, and `GET /api/word-lists` without a session returns 401 with no list in the body.
- [AC-76] After signing in, Listes shows that account's lists from the `word_lists` table, each with its name and its number of words, and none of another account's lists.
- [AC-77] Deleting one row of `word_lists` in the database and reloading Listes removes that list from the screen.

## Traceability

Each acceptance criterion id, and the test whose title names it. Filled in as the tests are written; `npm run ac:check` fails when an id has no test, so this table cannot quietly go stale.

| Criterion  | Test            |
| ---------- | --------------- |
| AC-1–AC-77 | not written yet |

## Spec vs result

Nothing has been built from this spec yet. Once slice 1 is built and checked: which criteria passed, which were missed or reinterpreted, and what changed in this spec because of it.

## Decisions

| #   | Question                   | Decision                                                                                                                         |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Displayed transliteration  | **Both**, French phonetic as reference                                                                                           |
| D2  | Bulgarian lowercase shapes | **From the start**, everywhere                                                                                                   |
| D3  | Audio                      | **Recordings** generated once with Azure TTS (voice Borislav), committed                                                         |
| D4  | Front end                  | **SvelteKit (static) + Svelte 5 + TS**, rendered in the browser only                                                             |
| D5  | Interface language         | **French first, English planned**: every learner-facing text in per-language files, nothing language-specific in API or database |
| D7  | Spaced repetition          | **None time-based**, review driven by the path                                                                                   |
| D8  | Unlocking                  | **Free navigation**, suggested order only                                                                                        |
| D9  | Lesson progress            | **Bar frozen on error, missed question repeated, 100 % to finish**                                                               |
| D11 | Answer input               | **In-app keyboard** on touch devices, layout per language (AZERTY in French)                                                     |
| D12 | Content format             | **Typed TypeScript files + invariant tests**, seeded into the database                                                           |
| D13 | Theme                      | **Single light gamified theme**                                                                                                  |
| D17 | Answer confirmation        | **MCQ on tap**, readings with « Vérifier »                                                                                       |
| D18 | Daily streaks              | **Never**                                                                                                                        |
| D21 | Architecture               | **Separate Hono API + static SvelteKit front end** in an npm workspaces monorepo: the REST boundary and the layers stay visible  |
| D22 | Database and migrations    | **PostgreSQL + Kysely + numbered SQL files**                                                                                     |
| D23 | Social provider            | **Google**                                                                                                                       |
| D24 | Sessions                   | **Own opaque tokens in the database** (hashed), not JWTs: revocable, and the MCP server uses the same ones                       |
| D25 | Account linking            | **On verified e-mail only**; linking to an unverified local account removes its password                                         |
| D26 | Guests                     | **Kept**, progress merged into the account at sign-in                                                                            |
| D27 | User-owned data            | **Personal word lists**, used for review only                                                                                    |
| D28 | Model feature              | **Read aloud, checked by Azure speech to text**, signed-in users only, in addition to the existing questions                     |
| D29 | MCP server                 | **Official SDK, stdio, 6 tools**, one user through an agent session token                                                        |
| D30 | Deployment                 | **Docker Compose built from the repository**, behind any HTTPS reverse proxy; nothing host-specific committed                    |
| D31 | Contrast                   | **4.5:1 for all text**, white-on-color included                                                                                  |

Missing numbers are earlier decisions, folded into the text above or superseded.

## Backlog

- Real signs mode (photos of signs to decode), dictation (hear a word, type it in Cyrillic).
- **English interface** (prepared by UI › Languages).
- Dark mode, mascot and logo.
- E-mail verification and password reset by e-mail.
- Sharing the diploma as an image.
