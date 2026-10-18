// Minimal Azure Speech text-to-speech client (spec §10.1), shared by the bench and the generator.
// Reads AZURE_SPEECH_KEY and AZURE_SPEECH_REGION: run the scripts with --env-file=.env.local.

/** MP3 mono, 24 kHz, 48 kbit/s: plenty for a voice, about 6 KB per second. */
const FORMAT = 'audio-24khz-48kbitrate-mono-mp3';

export interface Voice {
	ShortName: string;
	LocalName: string;
	Locale: string;
	Gender: string;
	SecondaryLocaleList?: string[];
}

function env(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is missing: run with --env-file=.env.local`);
	return value;
}

const key = env('AZURE_SPEECH_KEY');
const host = `https://${env('AZURE_SPEECH_REGION')}.tts.speech.microsoft.com`;

export function escapeXml(text: string): string {
	return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Slowed-down reading, for the « listen slowly » button. */
export function slowed(body: string): string {
	return `<prosody rate="-25%">${body}</prosody>`;
}

export async function listVoices(): Promise<Voice[]> {
	const response = await fetch(`${host}/cognitiveservices/voices/list`, {
		headers: { 'Ocp-Apim-Subscription-Key': key }
	});
	if (!response.ok) throw new Error(`voices/list: ${response.status} ${await response.text()}`);
	return (await response.json()) as Voice[];
}

/**
 * Full SSML document saying `body` (an SSML fragment) in Bulgarian. Azure otherwise pads short
 * clips with about a second of silence: exact leading and trailing silences keep them tight.
 */
export function ssmlDocument(voice: Pick<Voice, 'ShortName' | 'Locale'>, body: string): string {
	// Voices from another locale (multilingual ones) are told to speak Bulgarian.
	const inner = voice.Locale === 'bg-BG' ? body : `<lang xml:lang="bg-BG">${body}</lang>`;
	return (
		`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ` +
		`xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="bg-BG">` +
		`<voice name="${voice.ShortName}">` +
		`<mstts:silence type="Leading-exact" value="50ms"/>` +
		`<mstts:silence type="Tailing-exact" value="100ms"/>` +
		`${inner}</voice></speak>`
	);
}

/** Synthesizes an SSML document to MP3, waiting and retrying when the free tier throttles. */
export async function synthesize(ssml: string): Promise<Buffer> {
	for (let attempt = 0; ; attempt++) {
		const response = await fetch(`${host}/cognitiveservices/v1`, {
			method: 'POST',
			headers: {
				'Ocp-Apim-Subscription-Key': key,
				'Content-Type': 'application/ssml+xml',
				'X-Microsoft-OutputFormat': FORMAT,
				'User-Agent': 'cyrilingo-audio'
			},
			body: ssml
		});
		if (response.ok) return Buffer.from(await response.arrayBuffer());
		if (response.status === 429 && attempt < 5) {
			const wait = Number(response.headers.get('Retry-After') ?? 5);
			await new Promise((resolve) => setTimeout(resolve, wait * 1000));
			continue;
		}
		throw new Error(`${response.status} ${await response.text()}`);
	}
}
