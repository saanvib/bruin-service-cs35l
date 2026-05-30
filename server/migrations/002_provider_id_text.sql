-- Drop FK first, then change type to allow Descope user IDs (non-UUID strings)
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_provider_id_fkey;
ALTER TABLE listings ALTER COLUMN provider_id TYPE text USING provider_id::text;
