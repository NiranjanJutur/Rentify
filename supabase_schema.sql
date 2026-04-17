-- ============================================
-- RENTIFY DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PROPERTIES
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  property_type TEXT DEFAULT 'PG / Hostel',
  total_rooms INTEGER DEFAULT 0,
  base_rent NUMERIC(10,2) DEFAULT 0,
  amenities TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TENANTS
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  room TEXT NOT NULL,
  block TEXT DEFAULT '',
  floor INTEGER DEFAULT 1,
  rent_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'occupied' CHECK (status IN ('occupied', 'vacant', 'pending')),
  join_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. STAFF
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  shift TEXT DEFAULT 'Morning',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'late', 'off_duty')),
  clocked_in TEXT DEFAULT '—',
  phone TEXT,
  salary NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  expense_type TEXT DEFAULT 'one_time' CHECK (expense_type IN ('one_time', 'recurring', 'petty_cash')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'verified')),
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  method TEXT DEFAULT '—',
  due_date DATE,
  paid_date DATE,
  month TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. COMPLAINTS (Maintenance)
CREATE TABLE IF NOT EXISTS complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. NOTICES
CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access to their own data
-- Properties: owner can CRUD
CREATE POLICY "Users can manage their properties"
  ON properties FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- For other tables, allow access if user owns the parent property
CREATE POLICY "Users can manage tenants of their properties"
  ON tenants FOR ALL
  USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage staff of their properties"
  ON staff FOR ALL
  USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage expenses of their properties"
  ON expenses FOR ALL
  USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage payments of their properties"
  ON payments FOR ALL
  USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage complaints of their properties"
  ON complaints FOR ALL
  USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage notices of their properties"
  ON notices FOR ALL
  USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()));

-- ============================================
-- SEED DATA (for demo purposes)
-- ============================================

-- Insert a demo property (will be linked to the first authenticated user)
-- You can update the owner_id after creating your first user
INSERT INTO properties (id, name, address, property_type, total_rooms, base_rent, amenities, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Sunrise Residency',
  '42, MG Road, Koramangala, Bangalore 560034',
  'PG / Hostel',
  20,
  10000,
  ARRAY['WiFi', 'Laundry', 'CCTV', 'Kitchen', 'Parking'],
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Seed Tenants
INSERT INTO tenants (property_id, name, phone, room, block, floor, rent_amount, status, join_date, paid) VALUES
('a0000000-0000-0000-0000-000000000001', 'Aakash Mehta', '+91 98765 43210', 'A-201', 'Block A', 2, 12500, 'occupied', '2026-01-15', true),
('a0000000-0000-0000-0000-000000000001', 'Priyanka Sharma', '+91 87654 32100', 'A-302', 'Block A', 3, 14000, 'occupied', '2026-03-01', true),
('a0000000-0000-0000-0000-000000000001', 'Rohit Kumar', '+91 76543 21009', 'B-105', 'Block B', 1, 9500, 'occupied', '2026-08-10', false),
('a0000000-0000-0000-0000-000000000001', 'Sneha Reddy', '+91 65432 10908', 'B-208', 'Block B', 2, 11000, 'pending', '2026-09-01', false),
('a0000000-0000-0000-0000-000000000001', 'Vikram Singh', '+91 54321 09807', 'C-104', 'Block C', 1, 10000, 'occupied', '2026-06-20', true),
('a0000000-0000-0000-0000-000000000001', 'Deepika Patel', '+91 43210 98706', 'C-303', 'Block C', 3, 13500, 'occupied', '2026-02-14', true),
('a0000000-0000-0000-0000-000000000001', '— Vacant —', '', 'A-103', 'Block A', 1, 12500, 'vacant', '2026-01-01', false),
('a0000000-0000-0000-0000-000000000001', '— Vacant —', '', 'B-301', 'Block B', 3, 10000, 'vacant', '2026-01-01', false);

-- Seed Staff
INSERT INTO staff (property_id, name, role, shift, status, clocked_in, phone, salary) VALUES
('a0000000-0000-0000-0000-000000000001', 'Rajesh Kumar', 'Housekeeping Lead', 'Morning', 'active', '06:30 AM', '+91 98765 43210', 18000),
('a0000000-0000-0000-0000-000000000001', 'Priya Sharma', 'Security Guard', 'Night', 'active', '10:00 PM', '+91 87654 32109', 15000),
('a0000000-0000-0000-0000-000000000001', 'Amit Patel', 'Maintenance Tech', 'Morning', 'late', '—', '+91 76543 21098', 20000),
('a0000000-0000-0000-0000-000000000001', 'Sunita Devi', 'Cook', 'Split', 'active', '05:00 AM', '+91 65432 10987', 22000),
('a0000000-0000-0000-0000-000000000001', 'Vikram Singh', 'Warden', 'Full Day', 'off_duty', '—', '+91 54321 09876', 25000);

-- Seed Expenses
INSERT INTO expenses (property_id, category, description, amount, expense_type, status, due_date) VALUES
('a0000000-0000-0000-0000-000000000001', 'Electricity', 'Electricity Bill - Tower A', 8420, 'recurring', 'pending', '2026-10-15'),
('a0000000-0000-0000-0000-000000000001', 'Water', 'Water Supply - Municipal', 1200, 'recurring', 'verified', '2026-10-02'),
('a0000000-0000-0000-0000-000000000001', 'Maintenance', 'Acme Elevators Ltd. Service', 4500, 'one_time', 'paid', '2026-10-11'),
('a0000000-0000-0000-0000-000000000001', 'Cleaning', 'Monthly Deep Cleaning', 3500, 'recurring', 'pending', '2026-10-22');

-- Seed Complaints
INSERT INTO complaints (property_id, title, description, category, status, priority, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'Bathroom Leak — Ceiling Drip', 'Water dripping from ceiling in bathroom. Appears to be from the unit above.', 'Plumbing', 'in_progress', 'high', now() - interval '3 days'),
('a0000000-0000-0000-0000-000000000001', 'WiFi Not Working — 3rd Floor', 'WiFi connectivity issues on the entire 3rd floor of Block B.', 'Network', 'assigned', 'medium', now() - interval '4 days'),
('a0000000-0000-0000-0000-000000000001', 'AC Not Cooling', 'Split AC in room not cooling. Compressor making loud noise.', 'HVAC', 'open', 'high', now() - interval '5 days'),
('a0000000-0000-0000-0000-000000000001', 'Broken Window Latch', 'Window latch in bedroom broken. Cannot be securely locked.', 'Carpentry', 'open', 'medium', now() - interval '6 days'),
('a0000000-0000-0000-0000-000000000001', 'Kitchen Exhaust Fan', 'Common kitchen exhaust fan stopped working.', 'Electrical', 'resolved', 'low', now() - interval '9 days');

-- Seed Notices
INSERT INTO notices (property_id, title, body, category, priority, pinned) VALUES
('a0000000-0000-0000-0000-000000000001', 'Water Supply Maintenance', 'Water supply will be interrupted from 10 AM to 2 PM on Oct 18 for tank cleaning in Blocks A & B.', 'Maintenance', 'high', true),
('a0000000-0000-0000-0000-000000000001', 'Rent Due Reminder — November', 'Kindly pay your November rent by the 5th to avoid late fees. UPI and bank transfer details have been shared.', 'Finance', 'urgent', true),
('a0000000-0000-0000-0000-000000000001', 'Diwali Celebration 🪔', 'Join us for a community Diwali celebration on Oct 31st at 7 PM. Snacks and sweets will be provided!', 'Event', 'normal', false),
('a0000000-0000-0000-0000-000000000001', 'WiFi Upgrade Notice', 'Upgrading to 500 Mbps fiber. Brief outage expected on Oct 20, 6 AM - 8 AM.', 'Infrastructure', 'high', false),
('a0000000-0000-0000-0000-000000000001', 'New Parking Rules', 'Effective Nov 1: All vehicles must be registered at the front desk.', 'Policy', 'normal', false);

-- Seed Payments
INSERT INTO payments (tenant_id, property_id, amount, status, method, due_date, paid_date, month)
SELECT t.id, t.property_id, t.rent_amount, 
  CASE WHEN t.paid THEN 'paid' ELSE 'pending' END,
  CASE WHEN t.paid THEN 'UPI' ELSE '—' END,
  '2026-11-05'::DATE,
  CASE WHEN t.paid THEN '2026-10-05'::DATE ELSE NULL END,
  'October 2026'
FROM tenants t
WHERE t.status != 'vacant' AND t.property_id = 'a0000000-0000-0000-0000-000000000001';
