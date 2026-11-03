-- Reference data of the course: letters, lessons and corpus words. Its rows come from the
-- TypeScript content files through the seed (src/db/seed.ts), never from users.

CREATE TABLE letters (
	-- The uppercase letter itself, e.g. 'Ж'.
	id text PRIMARY KEY CHECK (char_length(id) = 1),
	-- The path section (letter group) the letter belongs to.
	section text NOT NULL CHECK (section IN ('allies', 'falseFriends', 'greekCousins', 'newcomers')),
	-- Alphabetical position, 1 to 30. Deferred so the seed can reorder letters in one transaction.
	position smallint NOT NULL CHECK (position BETWEEN 1 AND 30),
	CONSTRAINT letters_position_key UNIQUE (position) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE lessons (
	-- 'l1' to 'l10', saved in learners' progress.
	id text PRIMARY KEY CHECK (id ~ '^l[0-9]+$'),
	section text NOT NULL CHECK (section IN ('allies', 'falseFriends', 'greekCousins', 'newcomers')),
	-- Position on the path, from 1.
	position smallint NOT NULL CHECK (position >= 1),
	CONSTRAINT lessons_position_key UNIQUE (position) DEFERRABLE INITIALLY DEFERRED
);

-- Many-to-many: the 3 letters each lesson introduces. A letter is introduced by one lesson only.
CREATE TABLE lesson_letters (
	lesson_id text NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
	letter_id text NOT NULL REFERENCES letters (id) ON DELETE CASCADE,
	-- Order of the discovery cards in the lesson, 1 to 3.
	position smallint NOT NULL CHECK (position BETWEEN 1 AND 3),
	PRIMARY KEY (lesson_id, letter_id),
	CONSTRAINT lesson_letters_letter_key UNIQUE (letter_id),
	CONSTRAINT lesson_letters_position_key UNIQUE (lesson_id, position)
);

-- Words and syllables of the corpus. No translation: translations depend on the interface
-- language and live in the content files.
CREATE TABLE words (
	-- The Cyrillic text itself, e.g. 'котка'.
	id text PRIMARY KEY CHECK (char_length(id) BETWEEN 1 AND 40),
	kind text NOT NULL CHECK (kind IN ('word', 'syllable'))
);
