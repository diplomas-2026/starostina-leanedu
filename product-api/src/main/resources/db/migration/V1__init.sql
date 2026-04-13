CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS groups (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    course_year INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS group_students (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id),
    student_id BIGINT NOT NULL REFERENCES users(id),
    UNIQUE(group_id, student_id)
);

CREATE TABLE IF NOT EXISTS lectures (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary VARCHAR(800) NOT NULL,
    content TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_tests (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(800) NOT NULL,
    lecture_id BIGINT REFERENCES lectures(id),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    time_limit_min INTEGER NOT NULL,
    attempts_limit INTEGER NOT NULL,
    created_by BIGINT NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    test_id BIGINT NOT NULL REFERENCES learning_tests(id),
    text TEXT NOT NULL,
    points INTEGER NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS question_options (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id),
    text TEXT NOT NULL,
    correct BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS test_assignments (
    id BIGSERIAL PRIMARY KEY,
    test_id BIGINT NOT NULL REFERENCES learning_tests(id),
    group_id BIGINT NOT NULL REFERENCES groups(id),
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS test_attempts (
    id BIGSERIAL PRIMARY KEY,
    test_id BIGINT NOT NULL REFERENCES learning_tests(id),
    student_id BIGINT NOT NULL REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS attempt_answers (
    id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT NOT NULL REFERENCES test_attempts(id),
    question_id BIGINT NOT NULL REFERENCES questions(id),
    selected_option_id BIGINT NOT NULL REFERENCES question_options(id),
    correct BOOLEAN NOT NULL,
    awarded_points INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_daily_usage (
    id BIGSERIAL PRIMARY KEY,
    usage_date DATE NOT NULL UNIQUE,
    used_tokens INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_generations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    lecture_id BIGINT REFERENCES lectures(id),
    status VARCHAR(32) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_hash VARCHAR(255) NOT NULL,
    response_json TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
