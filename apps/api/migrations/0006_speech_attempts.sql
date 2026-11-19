-- Read-aloud tries (SPEC.md › The model feature › Timeout, fallback and limits): one row per
-- recording sent to the speech provider, counted for the per-user and the global limits over a
-- rolling 24 hours. No audio, no text. Rows older than 24 hours are deleted as new tries come in.
--
-- Deleting a user keeps their recent rows without the user (SET NULL), so that deleting accounts
-- cannot reset the global limit; nothing in such a row says who made it.

CREATE TABLE speech_attempts (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id uuid REFERENCES users (id) ON DELETE SET NULL,
	created_at timestamptz NOT NULL DEFAULT now(),
	-- Empty until the provider answered.
	outcome text CHECK (outcome IN ('match', 'mismatch', 'not_understood', 'unavailable'))
);

CREATE INDEX speech_attempts_created_at_idx ON speech_attempts (created_at);
CREATE INDEX speech_attempts_user_id_idx ON speech_attempts (user_id, created_at);
