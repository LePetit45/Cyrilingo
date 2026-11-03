-- Learners' progress (SPEC.md › Guests and progress sync): which lessons each user completed.
-- Many-to-many users ↔ lessons. Whether the final exam was passed is users.exam_passed_at.

CREATE TABLE lesson_completions (
	user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	-- The seed never deletes a lesson, so a completion always points at an existing one.
	lesson_id text NOT NULL REFERENCES lessons (id),
	-- When the account first learned of it: completing a lesson again keeps the first date.
	completed_at timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (user_id, lesson_id)
);
