-- Add new columns for Airbnb and Booking.com URLs
ALTER TABLE apartments
ADD COLUMN airbnb_ical_url TEXT,
ADD COLUMN booking_ical_url TEXT;

-- Migrate existing data
UPDATE apartments
SET airbnb_ical_url = ical_url
WHERE ical_url IS NOT NULL;

-- Drop old column
ALTER TABLE apartments
DROP COLUMN ical_url;
