-- Update apartments table with new columns
ALTER TABLE apartments
ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS beds integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_guests integer NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS check_in_time time NOT NULL DEFAULT '15:00',
ADD COLUMN IF NOT EXISTS check_out_time time NOT NULL DEFAULT '11:00',
ADD COLUMN IF NOT EXISTS cleaning_fee decimal(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
