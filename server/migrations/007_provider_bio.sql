CREATE TABLE IF NOT EXISTS provider_profiles (
  provider_id text PRIMARY KEY,
  bio         text NOT NULL DEFAULT ''
);