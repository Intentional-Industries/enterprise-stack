CREATE TABLE IF NOT EXISTS settings (
  key         VARCHAR(255) PRIMARY KEY,
  value       TEXT         NOT NULL,
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES ('hello_world', 'hello world')
ON CONFLICT (key) DO NOTHING;
