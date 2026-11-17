-- Google identities linked to users (SPEC.md › One person, one account). One row per identity;
-- a user may have several. Deleting a user deletes their links.

CREATE TABLE oauth_accounts (
	provider text NOT NULL CHECK (provider IN ('google')),
	-- The provider's stable id for the person (Google's `sub`), never their e-mail.
	provider_user_id text NOT NULL CHECK (char_length(provider_user_id) BETWEEN 1 AND 255),
	user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	created_at timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (provider, provider_user_id)
);

CREATE INDEX oauth_accounts_user_id_idx ON oauth_accounts (user_id);
