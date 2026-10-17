# CLAUDE.md

## Project

Cyrilingo is a web app (SvelteKit static build + TypeScript) that teaches native Latin-alphabet readers, French speakers first, to read the Bulgarian Cyrillic alphabet. The product spec lives in [docs/SPECIFICATIONS.md](docs/SPECIFICATIONS.md) and is the source of truth for scope and decisions.

## Language rule

**Everything that ends up on the GitHub repository must be written in English.** This includes:

- documentation (README, specs, ADRs, this file);
- code, identifiers and comments;
- commit messages, branch names;
- pull requests, issues, review comments, release notes;
- the repository description and other GitHub metadata.

Conversation with the project owner can happen in French; switch to English when writing anything that gets committed or posted to GitHub.

**Exception — product content:** the app's learner-facing text targets French speakers, so French UI strings and learning material (mnemonics, French phonetic transliterations, sound explanations) are allowed, but only inside the dedicated locale/content files (see spec §10.2). Code and comments around them stay in English.

## Git workflow

- One branch + one pull request per feature, squash-merged.
- No direct commits to `main`, except for documentation (README, `docs/`, this file).
