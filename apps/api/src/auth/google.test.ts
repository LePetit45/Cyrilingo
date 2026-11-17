import { describe, expect, it } from 'vitest';
import { checkIdTokenClaims, createGoogleClient } from './google.js';

const CLIENT_ID = 'client-id.apps.googleusercontent.com';
const now = new Date('2026-11-17T12:00:00Z');
const valid = {
	iss: 'https://accounts.google.com',
	aud: CLIENT_ID,
	exp: now.getTime() / 1000 + 3600,
	sub: '1234567890',
	email: 'learner@example.com',
	email_verified: true
};

describe('checkIdTokenClaims', () => {
	it('gives the identity of a token issued by Google for this client and still valid', () => {
		expect(checkIdTokenClaims(valid, CLIENT_ID, now)).toEqual({
			sub: '1234567890',
			email: 'learner@example.com',
			emailVerified: true
		});
		expect(checkIdTokenClaims({ ...valid, iss: 'accounts.google.com' }, CLIENT_ID, now)).toEqual(
			expect.objectContaining({ sub: '1234567890' })
		);
		expect(checkIdTokenClaims({ ...valid, aud: ['other', CLIENT_ID] }, CLIENT_ID, now)).toEqual(
			expect.objectContaining({ sub: '1234567890' })
		);
	});

	it('refuses another issuer, another audience, an expired token or a missing claim', () => {
		const check = (claims: object) => () => checkIdTokenClaims(claims, CLIENT_ID, now);
		expect(check({ ...valid, iss: 'https://evil.example' })).toThrow('not issued by Google');
		expect(check({ ...valid, aud: 'another-client' })).toThrow('another client');
		expect(check({ ...valid, exp: now.getTime() / 1000 })).toThrow('expired');
		expect(check({ ...valid, email_verified: undefined })).toThrow('lacks a claim');
		expect(check({ ...valid, email: 'not an e-mail' })).toThrow('lacks a claim');
	});
});

describe('createGoogleClient', () => {
	it('[AC-14] sends the state and a S256 PKCE challenge, never the verifier, to Google', () => {
		const client = createGoogleClient({
			clientId: CLIENT_ID,
			clientSecret: 'secret',
			redirectUri: 'https://cyrilingo.example/api/auth/google/callback'
		});
		const url = client.authorizationUrl('the-state', 'v'.repeat(43));
		expect(url.origin).toBe('https://accounts.google.com');
		expect(Object.fromEntries(url.searchParams)).toMatchObject({
			response_type: 'code',
			client_id: CLIENT_ID,
			redirect_uri: 'https://cyrilingo.example/api/auth/google/callback',
			state: 'the-state',
			scope: 'openid email',
			code_challenge_method: 'S256'
		});
		expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(url.toString()).not.toContain('v'.repeat(43));
	});
});
