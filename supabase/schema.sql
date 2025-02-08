-- Clean up existing data
DELETE FROM auth.users;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read for users" ON users;
DROP POLICY IF EXISTS "Allow users to update their own record" ON users;
DROP POLICY IF EXISTS "Allow service role to manage users" ON users;
DROP POLICY IF EXISTS "Allow authenticated read for apartments" ON apartments;
DROP POLICY IF EXISTS "Allow admins to manage apartments" ON apartments;
DROP POLICY IF EXISTS "Allow authenticated read for reservations" ON reservations;
DROP POLICY IF EXISTS "Allow admins to manage reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated read for cleaning_sessions" ON cleaning_sessions;
DROP POLICY IF EXISTS "Allow admins to manage cleaning_sessions" ON cleaning_sessions;
DROP POLICY IF EXISTS "Cleaners can update their assigned cleaning sessions" ON cleaning_sessions;
DROP POLICY IF EXISTS "Allow authenticated read for calendar_logs" ON calendar_logs;
DROP POLICY IF EXISTS "Allow admins to manage calendar_logs" ON calendar_logs;

-- Drop existing tables and types
DROP TABLE IF EXISTS calendar_logs CASCADE;
DROP TABLE IF EXISTS cleaning_sessions CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;

DROP TYPE IF EXISTS cleaning_status;
DROP TYPE IF EXISTS reservation_source;
DROP TYPE IF EXISTS user_role;

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'cleaner');

-- Create enum for reservation sources
CREATE TYPE reservation_source AS ENUM ('manual', 'airbnb', 'booking');

-- Create enum for cleaning status
CREATE TYPE cleaning_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create apartments table
CREATE TABLE apartments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    ical_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users,
    full_name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'cleaner',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create reservations table
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    guest_count INTEGER,
    email VARCHAR(255),
    contact VARCHAR(255),
    checkin_date DATE NOT NULL,
    checkout_date DATE NOT NULL,
    source reservation_source DEFAULT 'manual',
    notes TEXT,
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_dates CHECK (checkout_date > checkin_date)
);

-- Create cleaning_sessions table
CREATE TABLE cleaning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    cleaner_id UUID REFERENCES users(id),
    status cleaning_status DEFAULT 'pending',
    scheduled_date DATE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create calendar_logs table
CREATE TABLE calendar_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_reservations_dates ON reservations(checkin_date, checkout_date);
CREATE INDEX idx_cleaning_sessions_status ON cleaning_sessions(status);
CREATE INDEX idx_cleaning_sessions_scheduled ON cleaning_sessions(scheduled_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_apartments_updated_at
    BEFORE UPDATE ON apartments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_sessions_updated_at
    BEFORE UPDATE ON cleaning_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE apartments FORCE ROW LEVEL SECURITY;
ALTER TABLE reservations FORCE ROW LEVEL SECURITY;
ALTER TABLE cleaning_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE calendar_logs FORCE ROW LEVEL SECURITY;

-- Policy for users table
CREATE POLICY "Allow public read for users"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Allow users to update their own record"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Allow service role to manage users"
    ON users
    USING (auth.role() = 'service_role');

CREATE POLICY "Allow insert for first admin user"
    ON users FOR INSERT
    WITH CHECK (
        NOT EXISTS (
            SELECT 1 FROM users
            WHERE role = 'admin'
        )
        OR auth.role() = 'service_role'
    );

-- Apartments policies
CREATE POLICY "Allow authenticated read for apartments"
    ON apartments FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage apartments"
    ON apartments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Reservations policies
CREATE POLICY "Allow authenticated read for reservations"
    ON reservations FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage reservations"
    ON reservations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Cleaning sessions policies
CREATE POLICY "Allow authenticated read for cleaning_sessions"
    ON cleaning_sessions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage cleaning_sessions"
    ON cleaning_sessions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Cleaners can update their assigned cleaning sessions"
    ON cleaning_sessions FOR UPDATE
    USING (cleaner_id = auth.uid());

-- Calendar logs policies
CREATE POLICY "Allow authenticated read for calendar_logs"
    ON calendar_logs FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage calendar_logs"
    ON calendar_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
