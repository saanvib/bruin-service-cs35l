ALTER TABLE listings ADD COLUMN IF NOT EXISTS taken_down boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS flags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, user_id)
);

CREATE INDEX IF NOT EXISTS flags_listing_idx ON flags(listing_id);