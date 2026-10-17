# Cyrilingo — Specifications

> Status: **draft v0.1**, to be refined together. Items marked ❓ are open decisions.

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
- 5 to 10 minute sessions, on mobile as well as desktop.

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

The course unlocks the groups in this order.

### 3.3 Bulgarian specifics to cover
- **Щ = "sht"** (not "shch" as in Russian).
- **Ъ** is a real vowel (≈ schwa) and very frequent (e.g. България).
- **Ь** only appears in the combination **ьо** (e.g. шофьор).
- **Bulgarian lowercase typography**: in Bulgarian, several lowercase letters have their own shape (д looks like a *g*, т like an *m*, л without a hook, etc.). ✅ Decision D2: the app uses the Bulgarian shapes **from the start**, everywhere. The letter discovery card mentions the "standard" (Russian) shape in a note, so learners are not surprised elsewhere.

### 3.4 Transliteration
✅ Decision D1: **both are displayed**. The French phonetic transliteration is the reference for learning; the official one is shown next to it (and accepted in typed answers) so learners can recognize signs.
- **Official Bulgarian** (2009 system, English-based): Ж = zh, Ш = sh, Ч = ch, Ц = ts, Щ = sht, Ъ = a, Ю = yu, Я = ya. This is the one used on signs and passports.
- **Phonetic for French speakers**: Ж = j, Ш = ch, Ч = tch, Ц = ts, Щ = cht, Ъ = eu, Ю = iou, Я = ia.

### 3.5 Word corpus
Reading words are chosen to be **guessable by a French speaker** once decoded, so reading feels rewarding:
такси, кафе, банка, хотел, ресторант, телефон, метро, театър, музей, шоколад, паспорт, аптека, България, София, Пловдив…

Each word is tagged with the letters it contains → a word is only offered once all of its letters have been introduced.

## 4. Features

### 4.1 MVP
1. **Letter discovery**: uppercase + lowercase glyph (Bulgarian shape), **recorded sound**, French + official transliterations, mnemonic, 2–3 example words.
2. **Recognition quiz**: a Cyrillic letter is shown → pick its transliteration among 4.
3. **Reverse quiz**: a sound / Latin letter is shown → pick the Cyrillic letter (false friends used as distractors).
4. **Word reading**: a Cyrillic word is shown → type it in Latin letters (tolerant of transliteration variants).
5. **Spaced repetition**: each letter has a mastery level; missed letters come back more often.
6. **Progress**: alphabet chart colored by mastery, saved locally.

### 4.2 Later (backlog)
- "Real signs" mode: photos of signs, menus, shopfronts to decode.
- Dictation: hear a word → type it in Cyrillic (phonetic virtual keyboard).
- Timed mode / daily challenge / streaks.
- User accounts and multi-device sync.
- English interface.

## 5. User experience

- Mobile-first, usable with one hand.
- Immediate feedback (correct / incorrect + correct answer shown).
- One session = ~10 to 15 questions, with a summary at the end.
- No account required: open it and play.

## 6. Technical constraints

- **Static application** (SPA), no backend for the MVP.
- Progress stored in the browser (`localStorage` / IndexedDB).
- Installable **PWA** that works offline (handy when traveling).
- Free hosting: GitHub Pages.
- ✅ Stack (D4): **SvelteKit + Svelte 5 + TypeScript**, static build via `adapter-static` (GitHub Pages). Switching to a server adapter will allow adding a backend (accounts, sync) without a rewrite.
- PWA via `vite-plugin-pwa` (or SvelteKit's built-in service worker).
- Possible app store distribution: Capacitor (webview). A fully native app is out of scope.
- **Architecture**: all business logic (alphabet data, corpus, spaced repetition, progress persistence) lives in plain TypeScript modules with no dependency on Svelte. Svelte is only used for the UI, which limits the cost of a future framework change.
- Font supporting Bulgarian localization (`lang="bg"` + OpenType `locl` feature), required given D2. Candidate: Sofia Sans (Bulgarian type foundry); support to be checked on all target browsers.
- Audio: short files (Opus/MP3) per letter and per corpus word, precached by the PWA for offline use.
- Accessibility: contrast, keyboard navigation, generous font sizes for glyphs.

### 6.1 Audio production (to explore together)

Files are generated **once** by a Bulgarian text-to-speech voice, then served as static assets. The provider is chosen **after hands-on trials run by the project owner**, before any implementation.

- Candidates to evaluate: Azure Speech (bg-BG neural voices), Google Cloud Text-to-Speech, ElevenLabs (multilingual), others to suggest.
- Criteria: accuracy of a letter's **isolated** sound (hard for TTS, especially Ъ, Щ, Ж), naturalness of words, cost, license terms for the generated files.
- Watch out: TTS mispronounces isolated letters; we may need to feed it a syllable or a phonetic transcription (SSML) rather than the bare letter.
- Deliverable for this step: a short list of test letters and words, listened to on each provider, then a decision recorded here.

### 6.2 Internationalization

French-only interface for the MVP, but **no hard-coded text in components**: all labels and learning content (mnemonics, sound explanations) are centralized per locale, so English can be added later.

## 7. Success criteria

- A user who has completed the course correctly reads ≥ 90% of the corpus words.
- The full course can be completed in ~1 week at 10 min/day.

## 8. Decisions

| # | Question | Options | Decision |
|---|---|---|---|
| D1 | Displayed transliteration | official / French phonetic / both | **both** |
| D2 | Bulgarian lowercase typography | ignore / teach at the end / from the start | **from the start** |
| D3 | Audio in the MVP | none / browser speech synthesis / recordings | **recordings** |
| D3b | Recording source | native voice (who?) / high-quality TTS generated once / free library (Wikimedia Commons, Forvo…) | **TTS generated once**; provider chosen after trials (see §6.1) |
| D4 | Front-end stack | Svelte / React / vanilla TS | **SvelteKit (static) + TS** |
| D5 | Interface language | FR only / FR + EN | **FR for the MVP**, centralized strings to add EN later |
| D6 | Repo visibility / license | private / public + open license | private (current) |
