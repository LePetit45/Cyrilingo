import { describe, expect, it } from 'vitest';
import { createAzureSpeechClient, SpeechProviderError } from './client.js';
import { makeWav } from './testing.js';

// The Azure client, against a fake `fetch`: no test calls the real provider.

function clientAnswering(status: number, body: unknown) {
	const requests: { url: URL; init: RequestInit }[] = [];
	const fetchFn = (async (url: URL, init: RequestInit) => {
		requests.push({ url, init });
		return new Response(JSON.stringify(body), { status });
	}) as typeof fetch;
	const client = createAzureSpeechClient({ key: 'secret-key', region: 'westeurope' }, fetchFn);
	return { client, requests };
}

const signal = () => new AbortController().signal;

describe('Azure speech client', () => {
	it('[AC-47] sends only the audio and the language, asking for the lexical form without masking', async () => {
		const { client, requests } = clientAnswering(200, {
			RecognitionStatus: 'Success',
			DisplayText: 'Две.',
			NBest: [{ Lexical: 'две', Display: 'Две.' }]
		});
		const audio = makeWav();
		expect(await client.recognize(audio, 'bg-BG', signal())).toEqual({
			status: 'success',
			text: 'две'
		});
		const [{ url, init }] = requests;
		expect(url.origin).toBe('https://westeurope.stt.speech.microsoft.com');
		expect(Object.fromEntries(url.searchParams)).toEqual({
			language: 'bg-BG',
			format: 'detailed',
			profanity: 'raw'
		});
		expect(init.method).toBe('POST');
		expect(init.body).toBe(audio);
		expect(init.headers).toEqual({
			'Ocp-Apim-Subscription-Key': 'secret-key',
			'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
			Accept: 'application/json'
		});
	});

	it('answers no match when Azure heard no speech', async () => {
		for (const status of ['NoMatch', 'InitialSilenceTimeout', 'BabbleTimeout']) {
			const { client } = clientAnswering(200, { RecognitionStatus: status });
			expect(await client.recognize(makeWav(), 'bg-BG', signal())).toEqual({
				status: 'no_match'
			});
		}
	});

	it('[AC-44] rejects with the status when Azure answers an error', async () => {
		for (const status of [401, 403, 429, 500]) {
			const { client } = clientAnswering(status, {});
			const error = await client.recognize(makeWav(), 'bg-BG', signal()).catch((e: unknown) => e);
			expect(error).toBeInstanceOf(SpeechProviderError);
			expect((error as SpeechProviderError).status).toBe(status);
		}
	});

	it('rejects an answer that does not have the expected shape', async () => {
		const { client } = clientAnswering(200, { NBest: 'nope' });
		await expect(client.recognize(makeWav(), 'bg-BG', signal())).rejects.toThrow();
	});
});
