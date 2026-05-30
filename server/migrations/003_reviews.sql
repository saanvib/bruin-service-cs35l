CREATE TABLE IF NOT EXISTS reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  rating     integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_listing_idx ON reviews(listing_id);
