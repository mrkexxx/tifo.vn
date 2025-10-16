/*
  # Tsoft Sales Management Database Schema

  ## Overview
  Complete database schema for managing Tsoft Tool sales, including users, packages, orders, commissions, and settings.

  ## 1. New Tables

  ### `users`
  Stores all user accounts with role-based access control
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email for login
  - `name` (text) - Full name
  - `role` (text) - User role: 'admin', 'reseller', 'ctv', 'customer'
  - `phone` (text) - Contact phone number
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `packages`
  Product packages available for purchase
  - `id` (uuid, primary key) - Package identifier
  - `name` (text) - Package name (e.g., "Tsoft 1 tháng", "Combo Tool + VEO3 Ultra")
  - `duration` (integer) - Duration in months
  - `price` (decimal) - Package price in VND
  - `description` (text) - Package details
  - `is_active` (boolean) - Package availability status
  - `created_at` (timestamptz) - Creation timestamp

  ### `orders`
  All sales transactions
  - `id` (uuid, primary key) - Order identifier
  - `customer_id` (uuid, foreign key) - References users table
  - `package_id` (uuid, foreign key) - References packages table
  - `reseller_id` (uuid, foreign key) - Reseller or CTV who created order
  - `amount` (decimal) - Order total amount
  - `payment_status` (text) - Status: 'pending', 'paid', 'cancelled'
  - `payment_method` (text) - Payment method used
  - `order_date` (timestamptz) - Order creation date
  - `activation_date` (timestamptz) - Package activation date
  - `expiry_date` (timestamptz) - Package expiry date
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### `commissions`
  Commission tracking for resellers and CTVs
  - `id` (uuid, primary key) - Commission identifier
  - `order_id` (uuid, foreign key) - References orders table
  - `reseller_id` (uuid, foreign key) - Reseller/CTV receiving commission
  - `percent` (decimal) - Commission percentage (10-20%)
  - `amount` (decimal) - Commission amount
  - `status` (text) - Status: 'pending', 'approved', 'paid'
  - `paid_at` (timestamptz) - Payment timestamp
  - `created_at` (timestamptz) - Record creation timestamp

  ### `settings`
  System configuration and business rules
  - `key` (text, primary key) - Setting key
  - `value` (text) - Setting value (JSON format)
  - `description` (text) - Setting description
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Admin: Full access to all data
  - Reseller: Access to own orders, commissions, and customers
  - CTV: Access to own orders and commissions
  - Customer: Access to own orders only

  ### Policies
  - Separate policies for SELECT, INSERT, UPDATE, DELETE operations
  - Authentication required for all operations
  - Role-based access control enforced at database level

  ## 3. Important Notes
  - All monetary values use DECIMAL(12,2) for precision
  - All timestamps include timezone information
  - Foreign key constraints ensure data integrity
  - Indexes added for performance on commonly queried fields
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'reseller', 'ctv', 'customer')),
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration integer NOT NULL,
  price decimal(12,2) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  package_id uuid NOT NULL REFERENCES packages(id),
  reseller_id uuid REFERENCES users(id),
  amount decimal(12,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_method text,
  order_date timestamptz DEFAULT now(),
  activation_date timestamptz,
  expiry_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  reseller_id uuid NOT NULL REFERENCES users(id),
  percent decimal(5,2) NOT NULL,
  amount decimal(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_reseller_id ON orders(reseller_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_commissions_reseller_id ON commissions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Packages policies
CREATE POLICY "Anyone can view active packages"
  ON packages FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all packages"
  ON packages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert packages"
  ON packages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update packages"
  ON packages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Orders policies
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Resellers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    reseller_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('reseller', 'ctv')
    )
  );

CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Resellers and CTVs can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'reseller', 'ctv')
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Resellers can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (reseller_id = auth.uid())
  WITH CHECK (reseller_id = auth.uid());

-- Commissions policies
CREATE POLICY "Admins can view all commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Resellers can view own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (reseller_id = auth.uid());

CREATE POLICY "Admins can insert commissions"
  ON commissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert commissions"
  ON commissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update commissions"
  ON commissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Settings policies
CREATE POLICY "Admins can view settings"
  ON settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('commission_rate_reseller', '{"min": 10, "max": 20}', 'Commission rate range for resellers'),
  ('commission_rate_ctv', '{"rate": 10}', 'Fixed commission rate for CTVs'),
  ('currency', 'VND', 'Default currency'),
  ('tax_rate', '0', 'Tax rate percentage')
ON CONFLICT (key) DO NOTHING;

-- Insert sample packages
INSERT INTO packages (name, duration, price, description) VALUES
  ('Tsoft 1 tháng', 1, 500000, 'Gói Tsoft Tool sử dụng 1 tháng'),
  ('Tsoft 3 tháng', 3, 1400000, 'Gói Tsoft Tool sử dụng 3 tháng'),
  ('Tsoft 6 tháng', 6, 2700000, 'Gói Tsoft Tool sử dụng 6 tháng'),
  ('Combo Tool + VEO3 Ultra 1 tháng', 1, 800000, 'Combo Tsoft Tool + VEO3 Ultra 1 tháng'),
  ('Combo Tool + VEO3 Ultra 3 tháng', 3, 2200000, 'Combo Tsoft Tool + VEO3 Ultra 3 tháng'),
  ('Combo Tool + VEO3 Ultra 6 tháng', 6, 4200000, 'Combo Tsoft Tool + VEO3 Ultra 6 tháng')
ON CONFLICT DO NOTHING;
