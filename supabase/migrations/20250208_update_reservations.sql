-- Rename columns to match our types
ALTER TABLE reservations 
  RENAME COLUMN guest_count TO guests_count;

ALTER TABLE reservations 
  RENAME COLUMN email TO guest_email;

ALTER TABLE reservations 
  RENAME COLUMN contact TO guest_phone;

ALTER TABLE reservations 
  RENAME COLUMN checkin_date TO check_in;

ALTER TABLE reservations 
  RENAME COLUMN checkout_date TO check_out;

ALTER TABLE reservations 
  RENAME COLUMN external_id TO source_id;

-- Add price related columns
ALTER TABLE reservations 
  ADD COLUMN total_price DECIMAL(10,2),
  ADD COLUMN cleaning_fee DECIMAL(10,2),
  ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR',
  ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN payment_method VARCHAR(50),
  ADD COLUMN deposit_amount DECIMAL(10,2);

-- Add additional guest info
ALTER TABLE reservations
  ADD COLUMN guest_country VARCHAR(2),
  ADD COLUMN guest_language VARCHAR(5),
  ADD COLUMN special_requests TEXT;

-- Add check-in details
ALTER TABLE reservations
  ADD COLUMN estimated_arrival_time TIME,
  ADD COLUMN actual_arrival_time TIME,
  ADD COLUMN check_in_notes TEXT,
  ADD COLUMN check_out_notes TEXT;
