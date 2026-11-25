import { z } from 'zod';

/** The only language read-aloud recordings are recognized in. */
export type SpeechLanguage = 'bg-BG';

/**
 * What the model heard, before any validation (SPEC.md › The model feature): a text, or nothing
 * it could recognize as speech. The service validates the text before anybody sees it.
 */
export type Recognition = { status: 'success'; text: string } | { status: 'no_match' };

/** The provider answered with an error status: down (5xx), rate-limited (429), key refused… */
export class SpeechProviderError extends Error {
	override name = 'SpeechProviderError';

	constructor(readonly status: number) {
		super(`The speech provider answered ${status}`);
	}
}

/**
 * Speech to text (SPEC.md › The model feature). Only the audio and the language go in: never the
 * expected word, never anything about the user. `AzureSpeechClient` in production,
 * `FakeSpeechClient` in the tests; nothing else talks to the provider.
 */
export interface SpeechClient {
	/**
	 * Recognizes a 16 kHz mono 16-bit PCM WAV recording. Rejects when the provider fails, answers
	 * an error status, or `signal` aborts.
	 */
	recognize(audio: Uint8Array, language: SpeechLanguage, signal: AbortSignal): Promise<Recognition>;
}

/** Azure's answer with `format=detailed`: only the fields read are checked. */
const azureAnswer = z.object({
	RecognitionStatus: z.string(),
	NBest: z.array(z.object({ Lexical: z.string() })).optional()
});

/**
 * Azure AI Speech, short-audio REST API. The lexical form is read, not `DisplayText`: the latter
 * adds punctuation, writes numbers as digits (две → 2) and masks words it finds rude, which
 * `profanity=raw` turns off for the lexical form.
 */
export function createAzureSpeechClient(
	{ key, region }: { key: string; region: string },
	fetchFn: typeof fetch = (...args) => fetch(...args)
): SpeechClient {
	return {
		async recognize(audio, language, signal) {
			const url = new URL(
				`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`
			);
			url.searchParams.set('language', language);
			url.searchParams.set('format', 'detailed');
			url.searchParams.set('profanity', 'raw');
			const response = await fetchFn(url, {
				method: 'POST',
				headers: {
					'Ocp-Apim-Subscription-Key': key,
					'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
					Accept: 'application/json'
				},
				body: audio,
				signal
			});
			if (!response.ok) throw new SpeechProviderError(response.status);
			const answer = azureAnswer.parse(await response.json());
			const text = answer.NBest?.[0]?.Lexical;
			return answer.RecognitionStatus === 'Success' && text !== undefined
				? { status: 'success', text }
				: { status: 'no_match' };
		}
	};
}
