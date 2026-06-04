ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id text;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_listing_unique 
  ON reviews(listing_id, user_id) 
  WHERE user_id IS NOT NULL;

ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
