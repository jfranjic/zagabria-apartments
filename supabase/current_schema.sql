-- Clean up existing schema
DROP POLICY IF EXISTS "Allow public read for users" ON users;
DROP POLICY IF EXISTS "Allow users to update their own record" ON users;
DROP POLICY IF EXISTS "Allow service role to manage users" ON users;
DROP POLICY IF EXISTS "Allow insert for first admin user" ON users;
DROP POLICY IF EXISTS "Allow authenticated read for apartments" ON apartments;
DROP POLICY IF EXISTS "Allow admins to manage apartments" ON apartments;
DROP POLICY IF EXISTS "Allow authenticated read for reservations" ON reservations;
DROP POLICY IF EXISTS "Allow admins to manage reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated read for cleaning_sessions" ON cleaning_sessions;
DROP POLICY IF EXISTS "Allow admins to manage cleaning_sessions" ON cleaning_sessions;
DROP POLICY IF EXISTS "Cleaners can update their assigned cleaning sessions" ON cleaning_sessions;
DROP POLICY IF EXISTS "Allow authenticated read for calendar_logs" ON calendar_logs;
DROP POLICY IF EXISTS "Allow admins to manage calendar_logs" ON calendar_logs;

DROP TABLE IF EXISTS calendar_logs CASCADE;
DROP TABLE IF EXISTS cleaning_sessions CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS cleaning_status;
DROP TYPE IF EXISTS reservation_source;
DROP TYPE IF EXISTS user_role;

-- Create ENUMs
CREATE TYPE cleaning_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE reservation_source AS ENUM ('manual', 'airbnb', 'booking');
CREATE TYPE user_role AS ENUM ('admin', 'cleaner');

-- Create tables
CREATE TABLE apartments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    address text NOT NULL DEFAULT '',
    beds integer NOT NULL DEFAULT 1,
    max_guests integer NOT NULL DEFAULT 2,
    description text,
    check_in_time time without time zone NOT NULL DEFAULT '15:00:00',
    check_out_time time without time zone NOT NULL DEFAULT '11:00:00',
    cleaning_fee numeric NOT NULL DEFAULT 0.00,
    active boolean NOT NULL DEFAULT true,
    airbnb_ical_url text,
    booking_ical_url text,
    CONSTRAINT apartments_pkey PRIMARY KEY (id)
);

CREATE TABLE users (
    id uuid NOT NULL,
    full_name character varying(255),
    role user_role NOT NULL DEFAULT 'cleaner',
    active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE reservations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    apartment_id uuid,
    guest_name character varying(255) NOT NULL,
    guests_count integer,
    guest_email character varying(255),
    guest_phone character varying(255),
    check_in date NOT NULL,
    check_out date NOT NULL,
    source reservation_source DEFAULT 'manual',
    notes text,
    source_id character varying(255),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    total_price numeric,
    cleaning_fee numeric,
    currency character varying(3) DEFAULT 'EUR',
    payment_status character varying(20) DEFAULT 'pending',
    payment_method character varying(50),
    deposit_amount numeric,
    guest_country character varying(2),
    guest_language character varying(5),
    special_requests text,
    estimated_arrival_time time without time zone,
    actual_arrival_time time without time zone,
    check_in_notes text,
    check_out_notes text,
    daily_rental boolean NOT NULL DEFAULT false,
    planned_departure_time time without time zone,
    CONSTRAINT reservations_pkey PRIMARY KEY (id),
    CONSTRAINT reservations_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    CONSTRAINT valid_dates CHECK (
        (daily_rental = true AND check_in = check_out) OR 
        (daily_rental = false AND check_in < check_out)
    )
);

CREATE TABLE cleaning_sessions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    apartment_id uuid,
    reservation_id uuid,
    cleaner_id uuid,
    status cleaning_status DEFAULT 'pending',
    scheduled_date date NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT cleaning_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT cleaning_sessions_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    CONSTRAINT cleaning_sessions_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    CONSTRAINT cleaning_sessions_cleaner_id_fkey FOREIGN KEY (cleaner_id) REFERENCES users(id)
);

CREATE TABLE calendar_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    apartment_id uuid,
    event_type character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT calendar_logs_pkey PRIMARY KEY (id),
    CONSTRAINT calendar_logs_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_cleaning_sessions_status ON cleaning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_sessions_scheduled ON cleaning_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reservations_daily_rental ON reservations(daily_rental);

-- Enable RLS
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read for users" ON users
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow users to update their own record" ON users
    FOR UPDATE TO public USING (auth.uid() = id);

CREATE POLICY "Allow service role to manage users" ON users
    FOR ALL TO public USING (auth.role() = 'service_role');

CREATE POLICY "Allow insert for first admin user" ON users
    FOR INSERT TO public WITH CHECK (
        NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Allow authenticated read for apartments" ON apartments
    FOR SELECT TO public USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage apartments" ON apartments
    FOR ALL TO public USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

CREATE POLICY "Allow authenticated read for reservations" ON reservations
    FOR SELECT TO public USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage reservations" ON reservations
    FOR ALL TO public USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

CREATE POLICY "Allow authenticated read for cleaning_sessions" ON cleaning_sessions
    FOR SELECT TO public USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage cleaning_sessions" ON cleaning_sessions
    FOR ALL TO public USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

CREATE POLICY "Cleaners can update their assigned cleaning sessions" ON cleaning_sessions
    FOR UPDATE TO public USING (cleaner_id = auth.uid());

CREATE POLICY "Allow authenticated read for calendar_logs" ON calendar_logs
    FOR SELECT TO public USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage calendar_logs" ON calendar_logs
    FOR ALL TO public USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
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
