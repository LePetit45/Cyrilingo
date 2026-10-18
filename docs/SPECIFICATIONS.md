# Cyrilingo — Specifications

> Status: **v0.4**, implemented as the **v0.10.0-beta** (redesigned UI, §8). Live at https://cyrilingo.pages.dev. Remaining open items: audio provider (§10.1, no recordings yet), review of the drafted content by the project owner (§9).

## 1. Vision

A web app that helps someone used to the Latin alphabet (initial target audience: French speakers) **read and recognize the Bulgarian Cyrillic alphabet** quickly, through short, repeated, game-like sessions.

Concrete goal: by the end of the course, the user can sound out any Bulgarian word (signs, menus, proper names), even without understanding its meaning.

### Out of scope (for now)
- Learning Bulgarian vocabulary, grammar or conversation.
- Handwriting / cursive.
- Other Cyrillic variants (Russian, Serbian, Ukrainian…).

## 2. Target audience

- French speakers with no prior knowledge of Cyrillic.
- Typical use: preparing a trip, moving to Bulgaria, or a first step before learning the language.
- Short sessions (one lesson ≈ 6–8 minutes), on mobile first, desktop as well.

## 3. Learning content

### 3.1 The Bulgarian alphabet (30 letters)

А Б В Г Д Е Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ь Ю Я

### 3.2 Grouping by difficulty for a Latin-alphabet reader

| Group | Letters | Pitfall / hook |
|---|---|---|
| **1. Allies**: same shape, same sound | А, Е, К, М, О, Т | Reassuring: you can already read 6 letters |
| **2. False friends**: Latin shape, different sound | В (v), Н (n), Р (r), С (s), У (u, French "ou"), Х (h/kh) | The real trap: you have to "unlearn" |
| **3. Greek cousins**: new but guessable | Б (b), Г (g), Д (d), Л (l), П (p), Ф (f), И (i), Й (y), З (z) | Familiar from the Greek alphabet |
| **4. Newcomers**: sounds missing from French or spelled differently | Ж (French "j"), Ц (ts), Ч (French "tch"), Ш (French "ch"), Щ (French "cht"), Ъ (short schwa, close to French "eu"), Ь, Ю (yu), Я (ya) | The core of the effort |

### 3.3 Bulgarian specifics to cover
- **Щ = "sht"** (not "shch" as in Russian).
- **Ъ** is a real vowel (≈ schwa) and very frequent (e.g. България).
- **Ь** only appears in the combination **ьо** (e.g. шофьор). It is taught as the unit **ьо** ("yo"), together with **йо**, in the last lesson.
- **Bulgarian lowercase typography**: in Bulgarian, several lowercase letters have their own shape (д looks like a *g*, т like an *m*, л without a hook, etc.). The app uses the Bulgarian shapes **from the start**, everywhere (D2). The letter discovery card mentions the "standard" (Russian) shape in a note, so learners are not surprised elsewhere.
- **Pronunciation nuances** (Я/Ю after a consonant, reduction of unstressed vowels) are not taught in the MVP: one reference sound per letter, nuances mentioned in a note on the letter card.

### 3.4 Transliteration
Both are displayed (D1). The French phonetic transliteration is the reference for learning; the official one is shown next to it (and accepted in typed answers) so learners can recognize signs.
- **Official Bulgarian** (2009 system, English-based): Ж = zh, Ш = sh, Ч = ch, Ц = ts, Щ = sht, Ъ = a, Ю = yu, Я = ya. This is the one used on signs and passports.
- **Phonetic for French speakers**: Ж = j, Ш = ch, Ч = tch, Ц = ts, Щ = cht, Ъ = eu, Ю = iou, Я = ia.

## 4. Course structure

### 4.1 Path
- The course is a **Duolingo-style path** of lessons, displayed on the home screen, responsive and mobile-first.
- The path is split into **4 sections, one per letter group** (§3.2), in the fixed order Allies → False friends → Greek cousins → Newcomers. Each section has a title and a short intro.
- **3 new letters per lesson** → 10 lessons in total (2 + 2 + 3 + 3).
- Within a group, letters that allow forming real words earliest (with the letters already known) come first; ties are broken by letter frequency in Bulgarian.
- The **final exam** (§4.6) is the last milestone of the path.
- No placement test.

### 4.2 Free navigation
- **Nothing is locked.** Every lesson and the final exam can be opened at any time.
- The UI suggests the intended order: each lesson has one of three states: *completed*, *suggested* (the first lesson not yet completed), *not done yet*.
- A completed lesson can be replayed at will.
- **A lesson assumes all lessons before it in the path are known**, whether the user actually did them or not. As a consequence, the **content of each lesson is fixed and authored in advance** (static data); only the order of questions is shuffled.
- A lesson never shows a word or syllable containing a letter from a later lesson.

### 4.3 Lesson flow
1. **Discovery cards** for the 3 new letters (§5.1).
2. **9 questions on the new letters**: each letter goes through all three exercise types: letter → sound MCQ, sound → letter MCQ, and a syllable or word reading.
3. **3 syllables or words** mixing new and previously learned letters.
4. **4 review questions** (§4.4).

≈ 16 questions + repeats of missed questions, about 6–8 minutes. Questions within steps 2–4 are shuffled.

Syllables (ма, ко, те…) bridge the gap between letters and words, and fill in when too few real words can be formed with the known letters (typically in the first lessons).

### 4.4 Review (no time-based spaced repetition)
- There is **no time-based scheduling** and no per-letter mastery level (no Leitner boxes, no SM-2/FSRS).
- Review is **driven by the path**: each lesson contains ~4 review questions. Half target letters from the **2 previous lessons**, half target **older letters picked at random**. When one half has too few letters, the other fills in; lesson 1 has no review and lesson 2 reviews the 3 letters of lesson 1.
- A letter is considered learned once its lesson is completed; the review questions in later lessons keep it fresh.

### 4.5 Lesson progress model
- A progress bar shows how far the user is in the lesson.
- **Correct answer**: the bar moves forward.
- **Wrong answer** (or "I don't know"): the bar does not move, and the missed question comes back later in the same lesson.
- The lesson ends when **every question has been answered correctly once** (100%). It can therefore always be completed, and its length is the planned questions plus the misses.
- Leaving a lesson midway **discards it**: nothing about an unfinished lesson is saved.

### 4.6 Final exam: "L'Épreuve de Preslav"
- Named after the Preslav Literary School in Bulgaria, where the Cyrillic alphabet was developed. Title awarded on success (French UI string): **« Titre de saint-maître absolue du cyrillique »**.
- **30 questions** covering all 30 letters, mixing the three exercise types, with a majority of word reading.
- **Real score**: unlike lessons, missed questions are not repeated; every mistake counts. Passing requires **≥ 90%** correct answers (consistent with §12).
- Can be taken at any time and retaken any number of times.
- On success: a **diploma screen with an animation**, issued by « L’École suprême Cyrilingo ». The user can type a first name to display on the diploma; it is not saved.

### 4.7 Free review
- Secondary entry point on the home screen: **"Free review"**, 12 questions picked at random among the letters of completed lessons, drawing words from the whole corpus (§9).
- Uses the same progress model as lessons (§4.5). Nothing is saved.

## 5. Exercises

### 5.1 Letter discovery card
Uppercase + lowercase glyph (Bulgarian shape), **recorded sound** (autoplay), French + official transliterations, 2–3 example words with the letter underlined, note on the "standard" shape and pronunciation nuances where relevant. No mnemonics: the owner found them unhelpful.

### 5.2 Exercise types
1. **Letter → sound MCQ**: a Cyrillic letter is shown → pick its transliteration among 4.
2. **Sound → letter MCQ**: the French phonetic transliteration is shown in large type (e.g. « tch »), with an audio button → pick the Cyrillic letter among 4.
3. **Reading**: a Cyrillic syllable or word is shown → type it in Latin letters (§5.4).

### 5.3 Rules
- **Case**: whenever possible, letters are shown with **both forms** (e.g. Дд). Words are written in lowercase (Bulgarian shapes), with a capital for proper names.
- **MCQ distractors**: random letters among those already known, and sometimes deliberately confusable ones (В/B, Н/H, Р/P, С/C, У/Y, Х/X; Ш/Щ, И/Й, Ц/Щ, Ъ/Ь). For letter → sound questions, a trap can also be the Latin reading of a look-alike (Р → « p », lowercase д → « g »). In the first lesson, fewer than 4 letters are known, so the remaining choices are letters from later lessons (they are never read, only offered as wrong answers).
- A missed question comes back with its choices reshuffled, so it cannot be answered by position.
- **MCQ validation**: immediate on tap/click. Keys 1–4 answer on desktop.
- **Reading validation**: **« Vérifier »** button in the bottom bar, or Enter on a physical keyboard. The button stays inactive until something is typed.
- **"I don't know"** button on every question: counts as a wrong answer, shows the answer, and the question comes back later (§4.5).
- Response time is not taken into account.

#### Reading answer checking
- Case, spaces and hyphens are ignored. Accented letters are accepted as their unaccented version (« ă » = « a »).
- Each Cyrillic letter is validated independently against its list of accepted Latin variants, so both transliterations can be **mixed within one word** (« chokolad », « shokolad »).
- Accepted variants for ambiguous letters (the full table is a reviewed data file):

  | Letter | Accepted |
  |---|---|
  | Ъ | a, eu, ă, u |
  | Й | y, i |
  | Х | h, kh |
  | Ж | j, zh |
  | Ц | ts, tz |
  | Ю | iou, yu, ju |
  | Я | ia, ya, ja |
  | У | ou, u |
  | Щ | cht, sht |
  | Ш | ch, sh |
  | Ч | tch, ch |

- A word-final **-ия** may also be spelled « ia », as in the official transliteration (София → Sofia, България → Balgaria).
- **No typo tolerance**: one wrong letter makes the answer wrong.
- On a wrong answer, the answer is aligned letter by letter with the accepted variants and the **wrong letters are highlighted**. When the answer is too different to align, the whole expected answer is shown.

#### Feedback
- Shown in a **colored panel at the bottom of the screen** (green after a right answer, red after a wrong one) that replaces the action buttons, with a button to go on (« Continuer » / « Compris », or Enter). The question stays visible above it, with the right choice in green and the wrong one in red.
- **After a wrong answer**: correct answer and sound.
- **After any reading answer**: the word with the letter being learned underlined (the letter the question was chosen for; none in a lesson's mixed readings), its French translation, and audio. The stress is not marked: the audio carries it.
- **Audio** plays automatically on discovery cards and after each answer; during a question it only plays through a button (otherwise it would give the answer away).

### 5.4 Answer input
- **Touch devices** (phones, tablets; detected with the `(pointer: coarse)` media query, not screen width): reading answers are typed on an **on-screen keyboard built into the app**. The native keyboard is never opened (input uses `inputmode="none"`).
  - Reasons: a consistent, game-like UI; no autocorrect or autocomplete from the native keyboard (it would "fix" « chokolad » into « chocolat »); no layout jump when the native keyboard opens.
  - Layout: **AZERTY** Latin letters (target audience is French), backspace, and validate key. No accented keys (not needed, see §5.3).
- **Desktop**: no on-screen keyboard; a regular text field typed with the physical keyboard, with browser autocorrect, autocomplete, autocapitalization and spellcheck disabled.
- The on-screen keyboard component is designed so a **Cyrillic layout** can be added later for the dictation mode (§13).

## 6. Progress and persistence

- **Saved data** (browser `localStorage` only): the **list of completed lessons**, **whether the final exam was passed**, and the **settings** (sound, sound effects, whether the welcome screen was already shown). Nothing else: no per-letter statistics, no unfinished lesson state. "Reset my progress" keeps the settings.
- **Alphabet screen**: each letter is shown as *learned* (its lesson is completed) or *not yet*.
- **End-of-lesson summary**: score (first-try success rate) and the letters missed during this lesson.
- No limit on the number of lessons per day.
- No XP or badges in the MVP.
- **No daily streaks, ever**: the app must not pressure learners to come back every day.

## 7. Screens and navigation

### 7.1 Screens
- **Home**: a top bar with the number of letters already read (e.g. « 14/30 »), a banner naming the current section, and the path (§4.1). The suggested lesson is the highlighted node with a « Commencer » bubble. Lessons not suggested yet stay tappable (free navigation, §4.2), only styled as not done.
- **Lesson**: discovery cards → questions → summary.
- **Free review**.
- **Final exam** and **Diploma**.
- **Alphabet**: the 30 letters with their learned / not yet state. Tapping a letter opens its discovery card, even if not learned yet (consistent with free navigation).
- **Settings**: sound on/off, sound effects on/off, "Reset my progress" (with confirmation).
- **About**.

### 7.2 Navigation
- Mobile: **bottom tab bar** with *Path / Alphabet / Free review / More* (« More » holds the settings and the about page). It is hidden during a lesson, a free review and the exam.
- Leaving a lesson: **✕ button** at the top, with a confirmation: « Ta progression dans cette leçon sera perdue. »
- **First launch**: a single welcome screen (3 lines of explanation + "Start" button opening lesson 1). No tutorial.
- **Desktop**: the tab bar becomes a **left sidebar** (logo + labelled entries); the path stays in a centered column, with a **right column** showing progress per letter group, a free review card and the final exam card. Lessons, free review and the exam take the whole window (no sidebar), with a centered play area and the feedback panel across the full width. Questions are playable with the keyboard, and the shortcuts (1–4, Enter) are shown on screen.

## 8. Visual identity and feedback

- **Fun and gamified first**, inspired by the visual language of Duolingo (not a copy: no name, mascot, proprietary font or exact brand colors taken from it).
- **Light theme**: white background, light gray 2 px borders, dark gray text. Dark mode goes to the backlog.
- **Chunky 3D elements**: buttons, path nodes, cards and answer tiles have a darker bottom edge (« lip ») that flattens when pressed. Main buttons are uppercase, bold and letter-spaced.
- **Colors**: green for the main action and right answers, red for wrong answers, blue for selection and secondary actions, gold for celebrations. Each path section has its own color: Allies green, False friends pink, Greek cousins blue, Newcomers purple. Not-done path nodes are gray.
- **Typography**: Nunito (rounded, free) for the interface; Sofia Sans for every Cyrillic text (Bulgarian shapes, §3.3, §10).
- No mascot in the MVP.
- **Animations**: progress bar, bouncing « Commencer » bubble on the suggested lesson, shake on a wrong answer, small celebration on a correct answer, confetti on the diploma. Light vibration on mobile on a wrong answer (where supported).
- **Sound effects**: discreet correct / wrong sounds, can be turned off in the settings.
- **Name and icon**: "Cyrilingo" is kept. Until a real logo exists, a fun stylized rendering of the name is used as the icon.

## 9. Content production

- **Authoring**: Claude writes a first draft (letter cards, lesson composition, corpus), the project owner reviews and corrects.
- **Validation**: no native speaker available. Spelling, translations and stress are checked against reference sources: Wiktionary (shows stress for Bulgarian words) and online Bulgarian dictionaries, plus a listening check with the generated audio.
- **Corpus size**: about **120 words + 60 syllables**, enough for the 10 lessons, the exam and free review.
- **Word choice**: a mix of words guessable by a French speaker (loanwords, international words, city names) and common Bulgarian words, with no fixed ratio. Every word carries its French translation and the index of its stressed vowel (not shown, kept to check the recordings).
- **Format**: **typed TypeScript data files** in the repo (letters, words, syllables, lesson definitions, transliteration table). The compiler catches broken references (e.g. a lesson pointing at a missing word), and **unit tests check content invariants**: every letter is introduced in exactly one lesson, a lesson only uses letters from itself and earlier lessons, every stress index points at a vowel, every word is transliterable with the accepted-variants table.

## 10. Technical constraints

- **Static application** (SPA), no backend for the MVP.
- Installable **PWA** that works offline (handy when traveling).
- **Stack (D4)**: SvelteKit + Svelte 5 + TypeScript, static build via `adapter-static`. Switching to a server adapter will allow adding a backend (accounts, sync) without a rewrite.
- PWA via `vite-plugin-pwa` (or SvelteKit's built-in service worker).
- Possible app store distribution: Capacitor (webview). A fully native app is out of scope.
- **Architecture**: all business logic (alphabet data, lesson definitions, corpus, lesson engine, answer checking, progress persistence) lives in plain TypeScript modules with no dependency on Svelte. Svelte is only used for the UI, which limits the cost of a future framework change.
- Font supporting Bulgarian localization (`lang="bg"` + OpenType `locl` feature), required given D2. Candidate: Sofia Sans (Bulgarian type foundry); support to be checked on all target browsers.
- Audio: short files (Opus/MP3) per letter and per corpus word, precached by the PWA for offline use.
- **Hosting**: **Cloudflare Pages** (free, works with a private repo), deploying `main` automatically, with a **preview deployment for every pull request**. No custom domain in the MVP (`*.pages.dev` address).
- **Supported browsers**: last 2 versions of Chrome, Firefox, Edge and Safari; Safari iOS 16+.
- **Performance** (optimized): Lighthouse mobile performance score ≥ 90; first load < 2 s on 4G; app bundle < 300 KB excluding audio; total audio < 5 MB.
- **Analytics**: none in the MVP: no cookies, no consent banner. Success criteria are checked through tests with a few real users.
- Accessibility: contrast, keyboard navigation, generous font sizes for glyphs.

### 10.1 Audio production (to explore together)

Files are generated **once** by a Bulgarian text-to-speech voice, then served as static assets. The provider is chosen **after hands-on trials run by the project owner**, before any implementation.

- Candidates to evaluate: Azure Speech (bg-BG neural voices), Google Cloud Text-to-Speech, ElevenLabs (multilingual), others to suggest.
- Criteria: accuracy of a letter's **isolated** sound (hard for TTS, especially Ъ, Щ, Ж), naturalness of words, cost, license terms for the generated files.
- Watch out: TTS mispronounces isolated letters; we may need to feed it a syllable or a phonetic transcription (SSML) rather than the bare letter.
- Deliverable for this step: a short list of test letters and words, listened to on each provider, then a decision recorded here.
- **Beta**: ships without recordings. The app looks up `src/lib/assets/audio/<letter or word>.{opus,mp3}`; audio buttons, autoplay and the voice setting only appear once files exist, so recordings can be added without code changes.

### 10.2 Internationalization

French-only interface for the MVP, but **no hard-coded text in components**: all labels and learning content (sound explanations, translations) are centralized per locale, so English can be added later.

## 11. Quality and workflow

- **Unit tests** (Vitest) for all business logic: answer checking, lesson composition, persistence, content invariants (§9).
- **End-to-end test** (Playwright) for the main flow: completing a lesson from start to finish.
- **CI**: GitHub Actions on every pull request: lint, type check, tests. Deployment is handled by Cloudflare Pages.
- **Git workflow**: one branch + one pull request per feature, even solo, squash-merged. No direct commits to `main`, except for documentation.
- **License**: none while the repo is private; to be decided if it goes public.

## 12. Success criteria

- A user who has completed the course passes the final exam (≥ 90% of words read correctly).
- The full course can be completed in about a week at 10 min/day.

## 13. Backlog (after MVP)
- "Real signs" mode: photos of signs, menus, shopfronts to decode.
- Dictation: hear a word → type it in Cyrillic (Cyrillic layout of the in-app keyboard).
- Timed mode / XP / badges.
- Mascot, real logo.
- Dark mode.
- Export or share the diploma as an image.
- Custom domain.
- User accounts and multi-device sync.
- English interface.

## 14. Decisions

| # | Question | Decision |
|---|---|---|
| D1 | Displayed transliteration | **Both** (French phonetic as reference + official) |
| D2 | Bulgarian lowercase typography | **From the start** |
| D3 | Audio in the MVP | **Recordings** |
| D3b | Recording source | **TTS generated once**; provider chosen after trials (§10.1) |
| D4 | Front-end stack | **SvelteKit (static) + Svelte 5 + TS** |
| D5 | Interface language | **FR for the MVP**, centralized strings to add EN later |
| D6 | Repo visibility / hosting / license | **Private repo, Cloudflare Pages**, no license for now |
| D7 | Spaced repetition | **None time-based**; review driven by the path (§4.4) |
| D8 | Lesson unlocking | **Free navigation**, suggested order only (§4.2) |
| D9 | Lesson progress model | **Bar frozen on error, missed question repeated, 100% to finish** (§4.5) |
| D10 | Persistence | **Completed lessons + exam passed only** (§6) |
| D11 | Answer input | **In-app AZERTY keyboard on touch devices**, physical keyboard on desktop (§5.4) |
| D12 | Content format | **Typed TypeScript data files + invariant tests** (§9) |
| D13 | Theme | **Single light, gamified theme** inspired by Duolingo's visual language; dark mode later (§8) |
| D14 | Rendering | Pages prerendered as shells, **rendered in the browser only** (`ssr = false`): everything shown depends on `localStorage` |
| D15 | Sound effects | **Synthesized with Web Audio** (no files to download or cache) |
| D16 | Beta scope | **v0.9.0-beta**: full MVP except recorded voice; not deployed; UI redesign planned after the beta |
| D17 | Answer confirmation | **MCQ checked on tap**, readings with « Vérifier »; feedback in a bottom panel (§5.3) |
| D18 | Daily streaks | **Never**: not in the spirit of the app (§6) |
