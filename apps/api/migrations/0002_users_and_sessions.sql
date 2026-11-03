-- Accounts and their sessions (SPEC.md › Auth). Deleting a user deletes their sessions.

CREATE TABLE users (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	-- Lowercased and trimmed by the service; the check keeps it that way.
	email text NOT NULL CHECK (email = lower(btrim(email)) AND char_length(email) BETWEEN 3 AND 254),
	-- True only when a provider (Google) vouched for the address: local sign-ups are not verified.
	email_verified boolean NOT NULL DEFAULT false,
	-- argon2id hash in PHC format; null for an account that signs in with Google only.
	password_hash text CHECK (password_hash LIKE '$argon2id$%'),
	exam_passed_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE sessions (
	-- SHA-256 of the token, in hex. The token itself is only ever in the cookie (or the agent).
	id text PRIMARY KEY CHECK (id ~ '^[0-9a-f]{64}$'),
	user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	-- 'browser' for a sign-in, 'agent' for a token created for the MCP server.
	kind text NOT NULL CHECK (kind IN ('browser', 'agent')),
	expires_at timestamptz NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
