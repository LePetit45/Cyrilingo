// Generates the app's recordings (spec §10.1) into src/lib/assets/audio/:
// - <LETTER>.mp3 for each of the 30 letters, said with the input picked on the bench;
// - <reading>.mp3 and <reading>.slow.mp3 for each corpus word and syllable.
//
//   npm run audio -- [--dry-run] [--force]
//
// manifest.json keeps a hash of the SSML behind each file: only new or changed clips are sent to
// Azure, and files no longer in the course are deleted. Rerun it after editing the corpus.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYLLABLES, WORDS } from '../../src/lib/core/content/corpus.ts';
import { escapeXml, slowed, ssmlDocument, synthesize } from './azure.ts';
import { LETTER_SPECS, letterSsml } from './letters.ts';

const VOICE = { ShortName: 'bg-BG-BorislavNeural', Locale: 'bg-BG' };
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'src/lib/assets/audio');
const MANIFEST = join(dirname(fileURLToPath(import.meta.url)), 'manifest.json');
/** Requests sent at once: the free tier throttles bursts, retried in synthesize(). */
const CONCURRENCY = 4;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

/** Every file the app expects, by file name, with the SSML that produces it. */
const expected = new Map<string, string>();
for (const letter of Object.keys(LETTER_SPECS)) {
	const spec = LETTER_SPECS[letter];
	const body = letterSsml(letter, spec.pick);
	if (!body) throw new Error(`${letter} has no ${spec.pick} input`);
	expected.set(`${letter}.mp3`, ssmlDocument(VOICE, body));
}
for (const reading of new Set([...Object.keys(WORDS), ...SYLLABLES])) {
	const name = reading.normalize('NFC');
	expected.set(`${name}.mp3`, ssmlDocument(VOICE, escapeXml(name)));
	expected.set(`${name}.slow.mp3`, ssmlDocument(VOICE, slowed(escapeXml(name))));
}

const hash = (ssml: string) => createHash('sha256').update(ssml).digest('hex').slice(0, 16);
const manifest: Record<string, string> = existsSync(MANIFEST)
	? JSON.parse(await readFile(MANIFEST, 'utf8'))
	: {};

await mkdir(OUT, { recursive: true });
const present = new Set((await readdir(OUT)).map((file) => file.normalize('NFC')));
const stale = [...present].filter((file) => file.endsWith('.mp3') && !expected.has(file));
const todo = [...expected].filter(
	([file, ssml]) => force || !present.has(file) || manifest[file] !== hash(ssml)
);

console.log(
	`${expected.size} recordings expected: ${todo.length} to generate, ${stale.length} to delete.`
);
if (dryRun) {
	for (const [file] of todo) console.log(`  + ${file}`);
	for (const file of stale) console.log(`  - ${file}`);
	process.exit(0);
}

for (const file of stale) {
	await unlink(join(OUT, file));
	delete manifest[file];
}

let done = 0;
let failed = 0;
const queue = [...todo];
async function worker() {
	for (let next = queue.shift(); next; next = queue.shift()) {
		const [file, ssml] = next;
		try {
			await writeFile(join(OUT, file), await synthesize(ssml));
			manifest[file] = hash(ssml);
		} catch (error) {
			failed++;
			console.warn(`  failed ${file}: ${(error as Error).message}`);
		}
		if (++done % 50 === 0) console.log(`  ${done}/${todo.length}`);
	}
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(MANIFEST, `${JSON.stringify(sorted, null, '\t')}\n`);
console.log(`${done - failed} generated, ${failed} failed.`);
if (failed > 0) process.exitCode = 1;
