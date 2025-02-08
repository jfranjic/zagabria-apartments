-- Rename columns to match our new schema
ALTER TABLE reservations RENAME COLUMN email TO guest_email;
ALTER TABLE reservations RENAME COLUMN contact TO guest_phone;
ALTER TABLE reservations RENAME COLUMN guest_count TO guests_count;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'reservations' AND column_name = 'status') THEN
        ALTER TABLE reservations ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;
END $$;
