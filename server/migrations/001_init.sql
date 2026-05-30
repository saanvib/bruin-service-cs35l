CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id              text PRIMARY KEY,
  provider_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  name            text NOT NULL,
  category        text,
  location        text,
  description     text,
  price           numeric(10, 2),
  duration        integer,
  photos          jsonb NOT NULL DEFAULT '[]'::jsonb,
  services        jsonb NOT NULL DEFAULT '[]'::jsonb,
  available_dates jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviews         jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_category_idx ON listings(category);

CREATE TABLE IF NOT EXISTS bookings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  date           date NOT NULL,
  time           text NOT NULL,
  customer_name  text NOT NULL,
  customer_email text NOT NULL,
  status         text NOT NULL DEFAULT 'pending',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_listing_idx ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS bookings_user_idx    ON bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_date_idx    ON bookings(listing_id, date);
