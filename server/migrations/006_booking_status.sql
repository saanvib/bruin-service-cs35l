ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'confirmed';
UPDATE bookings SET status = 'confirmed' WHERE status = 'pending';