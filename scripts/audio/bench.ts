// Text-to-speech bench (spec §10.1): generates the same letters and words with every candidate
// voice and several ways of feeding isolated letters, then writes a local page to compare them by
// ear and pick an input per letter (LETTER_SPECS in letters.ts). Nothing here ships with the app:
// clips land in scripts/audio/bench-out/, which git ignores.
//
//   npm run audio:bench -- [--all-letters] [--voices=a,b] [--force]
//
// Existing clips are kept unless --force is given, so reruns only pay for what changed.
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORDS } from '../../src/lib/core/content/corpus.ts';
import { escapeXml, listVoices, slowed, ssmlDocument, synthesize, type Voice } from './azure.ts';
import { LETTER_SPECS, letterSsml, type LetterStrategy } from './letters.ts';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'bench-out');

/** Letters TTS is most likely to get wrong alone, plus Б and А as controls. */
const HARD_LETTERS = ['А', 'Б', 'Ъ', 'Щ', 'Ж', 'Ш', 'Ч', 'Ц', 'Х', 'Р', 'Й', 'Ь', 'Ю', 'Я'];

/** Words with an unobvious stress or hard letters, checked against their corpus stress index. */
const BENCH_WORDS = [
	'ябълка',
	'благодаря',
	'България',
	'щастие',
	'щъркел',
	'жълт',
	'събота',
	'огън',
	'училище',
	'момиче',
	'Будапеща',
	'компютър',
	'шофьор',
	'синьо',
	'любов',
	'хляб'
] as const satisfies readonly (keyof typeof WORDS)[];

interface Clip {
	/** File name inside the voice folder, without extension. */
	id: string;
	label: string;
	/** SSML fragment spoken inside the voice element. */
	ssml: string;
}

const STRATEGY_LABELS: Record<LetterStrategy, (letter: string) => string> = {
	bare: (letter) => `lettre « ${letter} »`,
	name: (letter) => `nom « ${LETTER_SPECS[letter].name} »`,
	syllable: (letter) => `syllabe « ${LETTER_SPECS[letter].syllable} »`,
	ipa: (letter) => `API /${LETTER_SPECS[letter].ipa}/`
};

function letterClips(letter: string): Clip[] {
	return (['bare', 'name', 'syllable', 'ipa'] as const).flatMap((strategy) => {
		const ssml = letterSsml(letter, strategy);
		if (!ssml) return [];
		return [{ id: `letter-${letter}-${strategy}`, label: STRATEGY_LABELS[strategy](letter), ssml }];
	});
}

function wordClips(word: string): Clip[] {
	return [
		{ id: `word-${word}-normal`, label: 'normal', ssml: escapeXml(word) },
		{ id: `word-${word}-slow`, label: 'lent', ssml: slowed(escapeXml(word)) }
	];
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const letters = args.includes('--all-letters') ? Object.keys(LETTER_SPECS) : HARD_LETTERS;
const voiceArg = args.find((arg) => arg.startsWith('--voices='))?.slice('--voices='.length);

const allVoices = await listVoices();
const multilingual = allVoices.filter((v) => v.SecondaryLocaleList?.includes('bg-BG'));
const voices = voiceArg
	? voiceArg.split(',').map((name) => {
			const voice = allVoices.find((v) => v.ShortName === name);
			if (!voice) throw new Error(`Unknown voice ${name}`);
			return voice;
		})
	: allVoices.filter((v) => v.Locale === 'bg-BG');

console.log(`Voices: ${voices.map((v) => v.ShortName).join(', ')}`);
if (multilingual.length > 0) {
	console.log(`Multilingual voices that also speak Bulgarian (try with --voices=…):`);
	for (const v of multilingual) console.log(`  ${v.ShortName}`);
}

const letterRows = letters.map((letter) => ({ letter, clips: letterClips(letter) }));
const wordRows = BENCH_WORDS.map((word) => ({ word, clips: wordClips(word) }));
const allClips = [...letterRows, ...wordRows].flatMap((row) => row.clips);

let generated = 0;
for (const voice of voices) {
	const folder = join(OUT, voice.ShortName);
	await mkdir(folder, { recursive: true });
	for (const clip of allClips) {
		const file = join(folder, `${clip.id}.mp3`);
		if (existsSync(file) && !force) continue;
		try {
			await writeFile(file, await synthesize(ssmlDocument(voice, clip.ssml)));
			generated++;
		} catch (error) {
			// One rejected clip (e.g. an unsupported phoneme) must not stop the bench.
			console.warn(`  failed ${voice.ShortName}/${clip.id}: ${(error as Error).message}`);
		}
	}
}
console.log(`${generated} clip(s) generated.`);

// Comparison page --------------------------------------------------------------------------------

/** Clips of a cell; letter cells also get a radio per strategy to record the preferred one. */
function cell(voice: Voice, clips: Clip[], letter?: string): string {
	return clips
		.map((clip) => {
			const src = `${encodeURIComponent(voice.ShortName)}/${encodeURIComponent(clip.id)}.mp3`;
			const missing = existsSync(join(OUT, voice.ShortName, `${clip.id}.mp3`)) ? '' : ' disabled';
			const button = `<button data-src="${src}"${missing}>▶ ${escapeXml(clip.label)}</button>`;
			if (!letter) return button;
			const strategy = clip.id.split('-').at(-1);
			return `<label class="pick"><input type="radio" name="${voice.ShortName} ${letter}" value="${strategy}">${button}</label>`;
		})
		.join('');
}

function stressed(word: string): string {
	const index = WORDS[word as keyof typeof WORDS].stress;
	return `${word.slice(0, index)}<u>${word[index]}</u>${word.slice(index + 1)}`;
}

const header = `<tr><th></th>${voices.map((v) => `<th>${v.LocalName}<small>${v.ShortName} · ${v.Gender}</small></th>`).join('')}</tr>`;
const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Banc d'essai TTS</title>
<style>
	body { font: 15px/1.4 system-ui, sans-serif; margin: 24px; color: #222; background: #fafafa; }
	table { border-collapse: collapse; margin-bottom: 40px; }
	th, td { border: 1px solid #ddd; padding: 8px 10px; vertical-align: top; background: #fff; }
	th small { display: block; font-weight: normal; color: #888; }
	td.key { font-size: 28px; font-weight: 600; text-align: center; min-width: 120px; }
	td.key small { display: block; font-size: 12px; font-weight: normal; color: #888; }
	u { text-decoration-thickness: 3px; text-decoration-color: #e8590c; }
	button { display: block; margin: 3px 0; padding: 5px 10px; border: 1px solid #ccc; border-radius: 6px;
		background: #f4f4f4; cursor: pointer; font: inherit; text-align: left; width: 100%; }
	button.playing { background: #ffe8cc; border-color: #e8590c; }
	button:disabled { opacity: 0.4; cursor: default; }
	label.pick { display: flex; align-items: center; gap: 6px; }
	textarea { width: 100%; max-width: 600px; height: 160px; font: 13px ui-monospace, monospace; margin-bottom: 40px; }
</style>
</head>
<body>
<h1>Banc d'essai TTS · Azure</h1>
<p>Pour chaque lettre : quelle stratégie donne le son enseigné, sans ambiguïté ? Pour chaque mot :
l'accent tombe-t-il sur la voyelle soulignée ? Bouton grisé = la génération a échoué.</p>
<h2>Lettres</h2>
<table>${header}${letterRows
	.map(
		({ letter, clips }) =>
			`<tr><td class="key">${letter}<small>/${LETTER_SPECS[letter].ipa}/</small></td>${voices.map((v) => `<td>${cell(v, clips, letter)}</td>`).join('')}</tr>`
	)
	.join('')}</table>
<h2>Mes choix <small>(à copier-coller dans la conversation)</small></h2>
<textarea id="picks" readonly placeholder="Coche la meilleure version de chaque lettre."></textarea>
<h2>Mots <small>(accent attendu souligné)</small></h2>
<table>${header}${wordRows
	.map(
		({ word, clips }) =>
			`<tr><td class="key">${stressed(word)}</td>${voices.map((v) => `<td>${cell(v, clips)}</td>`).join('')}</tr>`
	)
	.join('')}</table>
<script>
	const audio = new Audio();
	let current;
	document.addEventListener('click', (event) => {
		const button = event.target.closest('button[data-src]');
		if (!button) return;
		current?.classList.remove('playing');
		current = button;
		button.classList.add('playing');
		audio.src = button.dataset.src;
		audio.play();
	});
	audio.addEventListener('ended', () => current?.classList.remove('playing'));

	// Picks survive a reload of the page (rerunning the bench rewrites it).
	const picks = document.getElementById('picks');
	const radios = [...document.querySelectorAll('input[type=radio]')];
	function load() {
		try {
			return JSON.parse(localStorage.getItem('tts-bench-picks') ?? '{}');
		} catch {
			return {};
		}
	}
	function refresh() {
		const chosen = radios.filter((radio) => radio.checked);
		picks.value = chosen.map((radio) => radio.name + ': ' + radio.value).join('\\n');
		try {
			localStorage.setItem(
				'tts-bench-picks',
				JSON.stringify(Object.fromEntries(chosen.map((radio) => [radio.name, radio.value])))
			);
		} catch {
			// Storage may be unavailable for file:// pages: the text area is enough.
		}
	}
	const saved = load();
	for (const radio of radios) {
		radio.checked = saved[radio.name] === radio.value;
		radio.addEventListener('change', refresh);
	}
	refresh();
</script>
</body>
</html>
`;
await writeFile(join(OUT, 'index.html'), page);
console.log(`Open ${join(OUT, 'index.html')}`);
