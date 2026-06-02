-- Stores one conversation between a customer and a provider about a listing
CREATE TABLE IF NOT EXISTS conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   text NOT NULL,
  provider_id   text NOT NULL,
  listing_id    text REFERENCES listings(id) ON DELETE SET NULL,
  listing_name  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- prevent duplicate conversations for the same customer+provider+listing
  UNIQUE (customer_id, provider_id, listing_id)
);

CREATE INDEX IF NOT EXISTS conversations_customer_idx ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS conversations_provider_idx ON conversations(provider_id);

-- Stores individual messages within a conversation
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       text NOT NULL,
  sender_name     text NOT NULL,
  body            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id)