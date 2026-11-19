-- Personal word lists (SPEC.md › Word lists and authorization): a signed-in learner's lists of
-- corpus words, used for review only. Deleting a user deletes their lists, and deleting a list
-- deletes its words.

CREATE TABLE word_lists (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	-- Trimmed by the service; 1 to 40 characters.
	name text NOT NULL CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 40),
	created_at timestamptz NOT NULL DEFAULT now(),
	-- Last rename, or last word added or removed.
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX word_lists_user_id_idx ON word_lists (user_id);

-- Many-to-many: the corpus words of each list, each at most once. The seed never deletes a word,
-- so a word dropped from the content stays in the lists that hold it.
CREATE TABLE word_list_words (
	list_id uuid NOT NULL REFERENCES word_lists (id) ON DELETE CASCADE,
	word_id text NOT NULL REFERENCES words (id),
	added_at timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (list_id, word_id)
);
