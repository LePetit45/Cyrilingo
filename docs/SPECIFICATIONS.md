# Cyrilingo — Specifications

> Status: **draft v0.2**. Still to specify: exercise rules in detail, screens and visual design, content production, deployment target, non-functional requirements.

## 1. Vision

A web app that helps someone used to the Latin alphabet (initial target audience: French speakers) **read and recognize the Bulgarian Cyrillic alphabet** quickly, through short, repeated sessions.

Concrete goal: by the end of the course, the user can sound out any Bulgarian word (signs, menus, proper names), even without understanding its meaning.

### Out of scope (for now)
- Learning Bulgarian vocabulary, grammar or conversation.
- Handwriting / cursive.
- Other Cyrillic variants (Russian, Serbian, Ukrainian…).

## 2. Target audience

- French speakers with no prior knowledge of Cyrillic.
- Typical use: preparing a trip, moving to Bulgaria, or a first step before learning the language.
- Short sessions (one lesson ≈ 6–8 minutes), on mobile as well as desktop.

## 3. Learning content

### 3.1 The Bulgarian alphabet (30 letters)

А Б В Г Д Е Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ь Ю Я

### 3.2 Grouping by difficulty for a Latin-alphabet reader

| Group | Letters | Pitfall / hook |
|---|---|---|
| **1. Allies**: same shape, same sound | А, Е, К, М, О, Т | Reassuring: you can already read 6 letters |
| **2. False friends**: Latin shape, different sound | В (v), Н (n), Р (r), С (s), У (u, French "ou"), Х (h/kh) | The real trap: you have to "unlearn" |
| **3. Greek cousins**: new but guessable | Б (b), Г (g), Д (d), Л (l), П (p), Ф (f), И (i), Й (y), З (z) | Visual mnemonics |
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

### 3.5 Word corpus
Reading words are chosen to be **guessable by a French speaker** once decoded, so reading feels rewarding:
такси, кафе, банка, хотел, ресторант, телефон, метро, театър, музей, шоколад, паспорт, аптека, България, София, Пловдив…

Each word is tagged with the letters it contains, and carries its French translation and its stressed vowel.

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
- Review is **driven by the path**: each lesson contains ~4 review questions. Half target letters from the **2 previous lessons**, half target **older letters picked at random**.
- A letter is considered learned once its lesson is completed; the review questions in later lessons keep it fresh.

### 4.5 Lesson progress model
- A progress bar shows how far the user is in the lesson.
- **Correct answer**: the bar moves forward.
- **Wrong answer**: the bar does not move, and the missed question comes back later in the same lesson.
- The lesson ends when **every question has been answered correctly once** (100%). It can therefore always be completed, and its length is the planned questions plus the misses.
- Leaving a lesson midway **discards it**: nothing about an unfinished lesson is saved.

### 4.6 Final exam: "L'Épreuve de Preslav"
- Named after the Preslav Literary School in Bulgaria, where the Cyrillic alphabet was developed. Title awarded on success (French UI string): **« Titre de saint-maître absolue du cyrillique »**.
- **30 questions** covering all 30 letters, mixing the three exercise types, with a majority of word reading.
- No mnemonic hints during the exam.
- **Real score**: unlike lessons, missed questions are not repeated; every mistake counts. Passing requires **≥ 90%** correct answers (consistent with §8).
- Can be taken at any time and retaken any number of times.
- On success: a **diploma screen with an animation**. The user can type a first name to display on the diploma; it is not saved.

### 4.7 Free review
- Secondary entry point on the home screen: **"Free review"**, 12 questions picked at random among the letters of completed lessons.
- Uses the same progress model as lessons (§4.5). Nothing is saved.

## 5. Exercises

### 5.1 Letter discovery card
Uppercase + lowercase glyph (Bulgarian shape), **recorded sound** (autoplay), French + official transliterations, mnemonic, 2–3 example words, note on the "standard" shape and pronunciation nuances where relevant.

### 5.2 Exercise types
1. **Letter → sound MCQ**: a Cyrillic letter is shown → pick its transliteration among 4.
2. **Sound → letter MCQ**: a sound / transliteration is shown → pick the Cyrillic letter among 4.
3. **Reading**: a Cyrillic syllable or word is shown → type it in Latin letters. Both transliterations (French phonetic and official) are accepted.

### 5.3 Rules
- **Case**: whenever possible, letters are shown with **both forms** (e.g. Дд). Words are written in lowercase (Bulgarian shapes), with a capital for proper names.
- **MCQ distractors**: random letters among those already known, and sometimes deliberately confusable ones (В/B, Н/H, Р/P, С/C, У/Y, Х/X; Ш/Щ, И/Й, Ц/Щ, Ъ/Ь).
- **Wrong reading answer**: the answer is compared letter by letter with the accepted transliterations, and the **wrong letters are highlighted** in the feedback. When the answer is too different to align, the whole expected answer is shown.
- **Feedback after a wrong answer**: correct answer, sound, and a reminder of the letter's mnemonic.
- **After any reading answer**: French translation of the word, stressed vowel underlined, and audio.
- **Audio**: plays automatically on discovery cards and after each answer; during a question it only plays through a button (otherwise it would give the answer away).
- Response time is not taken into account.

## 6. Progress, persistence and motivation

- **Saved data** (browser storage only): the **list of completed lessons** and **whether the final exam was passed**. Nothing else: no per-letter statistics, no unfinished lesson state.
- **Settings**: a "Reset my progress" button.
- **Alphabet chart**: each letter is shown as *learned* (its lesson is completed) or *not yet*.
- **End-of-lesson summary**: score (first-try success rate) and the letters missed during this lesson.
- **Home screen**: the path (§4.1), a primary **"Continue"** button opening the suggested lesson, and a secondary **"Free review"** button (§4.7).
- No limit on the number of lessons per day.
- No XP, streaks or badges in the MVP.

## 7. Technical constraints

- **Static application** (SPA), no backend for the MVP.
- Minimal progress data stored in the browser (`localStorage`), see §6.
- Installable **PWA** that works offline (handy when traveling).
- Free hosting: GitHub Pages ❓ (requires a public repo or a paid GitHub plan; see D6).
- **Stack (D4)**: SvelteKit + Svelte 5 + TypeScript, static build via `adapter-static`. Switching to a server adapter will allow adding a backend (accounts, sync) without a rewrite.
- PWA via `vite-plugin-pwa` (or SvelteKit's built-in service worker).
- Possible app store distribution: Capacitor (webview). A fully native app is out of scope.
- **Architecture**: all business logic (alphabet data, lesson definitions, corpus, lesson engine, answer checking, progress persistence) lives in plain TypeScript modules with no dependency on Svelte. Svelte is only used for the UI, which limits the cost of a future framework change.
- Font supporting Bulgarian localization (`lang="bg"` + OpenType `locl` feature), required given D2. Candidate: Sofia Sans (Bulgarian type foundry); support to be checked on all target browsers.
- Audio: short files (Opus/MP3) per letter and per corpus word, precached by the PWA for offline use.
- Accessibility: contrast, keyboard navigation, generous font sizes for glyphs.

### 7.1 Audio production (to explore together)

Files are generated **once** by a Bulgarian text-to-speech voice, then served as static assets. The provider is chosen **after hands-on trials run by the project owner**, before any implementation.

- Candidates to evaluate: Azure Speech (bg-BG neural voices), Google Cloud Text-to-Speech, ElevenLabs (multilingual), others to suggest.
- Criteria: accuracy of a letter's **isolated** sound (hard for TTS, especially Ъ, Щ, Ж), naturalness of words, cost, license terms for the generated files.
- Watch out: TTS mispronounces isolated letters; we may need to feed it a syllable or a phonetic transcription (SSML) rather than the bare letter.
- Deliverable for this step: a short list of test letters and words, listened to on each provider, then a decision recorded here.

### 7.2 Internationalization

French-only interface for the MVP, but **no hard-coded text in components**: all labels and learning content (mnemonics, sound explanations) are centralized per locale, so English can be added later.

## 8. Success criteria

- A user who has completed the course passes the final exam (≥ 90% of words read correctly).
- The full course can be completed in about a week at 10 min/day.

## 9. Backlog (after MVP)
- "Real signs" mode: photos of signs, menus, shopfronts to decode.
- Dictation: hear a word → type it in Cyrillic (phonetic virtual keyboard).
- Timed mode / daily challenge / streaks.
- Export or share the diploma as an image.
- User accounts and multi-device sync.
- English interface.

## 10. Decisions

| # | Question | Decision |
|---|---|---|
| D1 | Displayed transliteration | **Both** (French phonetic as reference + official) |
| D2 | Bulgarian lowercase typography | **From the start** |
| D3 | Audio in the MVP | **Recordings** |
| D3b | Recording source | **TTS generated once**; provider chosen after trials (§7.1) |
| D4 | Front-end stack | **SvelteKit (static) + Svelte 5 + TS** |
| D5 | Interface language | **FR for the MVP**, centralized strings to add EN later |
| D6 | Repo visibility / license / hosting | Private repo (current) ❓ GitHub Pages needs a public repo or a paid plan |
| D7 | Spaced repetition | **None time-based**; review driven by the path (§4.4) |
| D8 | Lesson unlocking | **Free navigation**, suggested order only (§4.2) |
| D9 | Lesson progress model | **Bar frozen on error, missed question repeated, 100% to finish** (§4.5) |
| D10 | Persistence | **Completed lessons + exam passed only** (§6) |
