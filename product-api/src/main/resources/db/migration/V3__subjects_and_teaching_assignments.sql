CREATE TABLE IF NOT EXISTS subjects (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS teaching_assignments (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id),
    subject_id BIGINT NOT NULL REFERENCES subjects(id),
    teacher_id BIGINT NOT NULL REFERENCES users(id),
    UNIQUE(group_id, subject_id, teacher_id)
);

ALTER TABLE lectures
    ADD COLUMN IF NOT EXISTS subject_id BIGINT REFERENCES subjects(id);

ALTER TABLE learning_tests
    ADD COLUMN IF NOT EXISTS subject_id BIGINT REFERENCES subjects(id);
