import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import type { Services } from '../services/index.js';
import { errorResponse } from './errors.js';
import { InvalidInput } from './input.js';
import type { LogVariables } from './logger.js';
import type { SessionCookies, SessionVariables } from './session.js';
import { isSpeechWav, SPEECH_BODY_LIMIT } from './wav.js';

// A loose bound only: the service checks the word is in the corpus.
const query = z.object({ word: z.string().min(1).max(100) });

/**
 * `/api/speech`: read-aloud tries (SPEC.md › The model feature). The session is checked before
 * the body is read; the body is a WAV recording, refused when too large (413) or in another
 * format (400), so neither reaches the provider (AC-49).
 */
export function speechRoutes(services: Services, cookies: SessionCookies) {
	return new Hono<{ Variables: SessionVariables & LogVariables }>()
		.use(cookies.require(services.auth))
		.post(
			'/recognitions',
			bodyLimit({
				maxSize: SPEECH_BODY_LIMIT,
				onError: (c) => errorResponse(c, 413, 'payload_too_large', 'The recording is too large')
			}),
			async (c) => {
				const parsed = query.safeParse(c.req.query());
				if (!parsed.success) throw new InvalidInput('word');
				const audio = new Uint8Array(await c.req.arrayBuffer());
				if (!isSpeechWav(audio)) throw new InvalidInput('not a 16 kHz mono 16-bit PCM WAV');
				const result = await services.speech.check(c.var.session.userId, parsed.data.word, audio);
				// The outcome is the only detail of a try that reaches the server log.
				c.set('logDetail', result.outcome);
				return c.json(result);
			}
		);
}
