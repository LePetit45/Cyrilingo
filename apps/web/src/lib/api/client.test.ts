import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from './client.js';

/** A fetch answering every call with this status and JSON body, recording its calls. */
function fakeFetch(status: number, body?: unknown) {
	return vi.fn<typeof fetch>(
		async () =>
			new Response(body === undefined ? null : JSON.stringify(body), {
				status,
				headers: { 'Content-Type': 'application/json' }
			})
	);
}

describe('createApiClient', () => {
	it('sends JSON bodies to relative /api paths', async () => {
		const fetch = fakeFetch(201);
		const result = await createApiClient(fetch).signUp('ana@example.com', 'a password');
		expect(result).toEqual({ ok: true, value: undefined });
		expect(fetch).toHaveBeenCalledWith('/api/auth/signup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: 'ana@example.com', password: 'a password' })
		});
	});

	it('sends no body and no content type when there is nothing to send', async () => {
		const fetch = fakeFetch(204);
		await createApiClient(fetch).deleteAccount();
		expect(fetch).toHaveBeenCalledWith('/api/me', { method: 'DELETE', headers: {} });
	});

	it('returns the parsed body of a success', async () => {
		const account = {
			email: 'ana@example.com',
			hasPassword: true,
			providers: [],
			features: { readAloud: false, google: false }
		};
		const result = await createApiClient(fakeFetch(200, account)).getAccount();
		expect(result).toEqual({ ok: true, value: account });
	});

	it('returns the error code of a refusal, never its message', async () => {
		const result = await createApiClient(
			fakeFetch(401, {
				error: { code: 'invalid_credentials', message: 'Wrong e-mail or password' }
			})
		).signIn('ana@example.com', 'wrong');
		expect(result).toEqual({ ok: false, error: 'invalid_credentials' });
	});

	it('turns an unknown code or a body that is not JSON into `unknown`', async () => {
		const unknownCode = await createApiClient(
			fakeFetch(500, { error: { code: 'internal', message: 'Internal error' } })
		).getAccount();
		expect(unknownCode).toEqual({ ok: false, error: 'unknown' });

		const notJson = await createApiClient(
			vi.fn<typeof fetch>(async () => new Response('<html>Bad gateway</html>', { status: 502 }))
		).getAccount();
		expect(notJson).toEqual({ ok: false, error: 'unknown' });
	});

	it('returns `network` when the request does not reach the API', async () => {
		const offline = vi.fn<typeof fetch>(async () => {
			throw new TypeError('Failed to fetch');
		});
		expect(await createApiClient(offline).signOut()).toEqual({ ok: false, error: 'network' });
	});
});
