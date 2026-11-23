CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  recovery_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS access_codes (
  code_hash TEXT PRIMARY KEY,
  note TEXT,
  issued_at INTEGER NOT NULL,
  redeemed_at INTEGER,
  user_id TEXT REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS access_codes_user ON access_codes(user_id);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS completions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
