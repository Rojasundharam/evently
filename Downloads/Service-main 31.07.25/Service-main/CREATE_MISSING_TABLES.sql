-- Create missing tables for service management system
-- Run this script in your Supabase SQL editor if the migration doesn't work

-- Create service_categories table first (if it doesn't exist)
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  request_no VARCHAR UNIQUE,
  name VARCHAR NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  applicable_to VARCHAR DEFAULT 'all',
  status VARCHAR DEFAULT 'active',
  service_limit INTEGER,
  attachment_url TEXT,
  sla_period INTEGER,
  payment_method VARCHAR DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies to services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE TRIGGER set_updated_at_services
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_request_no ON services(request_no);

-- Grant access to authenticated users (only if policies don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Authenticated users can view all services'
  ) THEN
    CREATE POLICY "Authenticated users can view all services"
      ON services
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Admins can manage services'
  ) THEN
    CREATE POLICY "Admins can manage services"
      ON services
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
      );
  END IF;
END $$;

-- Insert some sample data if tables are empty
INSERT INTO service_categories (code, name, description) 
VALUES 
  ('ACAD', 'Academic Services', 'Services related to academic activities'),
  ('ADMIN', 'Administrative Services', 'General administrative services'),
  ('TECH', 'Technical Services', 'IT and technical support services')
ON CONFLICT (code) DO NOTHING;

INSERT INTO services (category_id, request_no, name, description, payment_method, status, applicable_to)
SELECT 
  sc.id,
  'SRV001',
  'Student ID Card',
  'Request for new or replacement student ID card',
  'free',
  'active',
  'all'
FROM service_categories sc WHERE sc.code = 'ADMIN'
ON CONFLICT (request_no) DO NOTHING;

INSERT INTO services (category_id, request_no, name, description, payment_method, status, applicable_to)
SELECT 
  sc.id,
  'SRV002',
  'Transcript Request',
  'Request for official academic transcript',
  'paid',
  'active',
  'all'
FROM service_categories sc WHERE sc.code = 'ACAD'
ON CONFLICT (request_no) DO NOTHING;

INSERT INTO services (category_id, request_no, name, description, payment_method, status, applicable_to)
SELECT 
  sc.id,
  'SRV003',
  'IT Support',
  'Technical support for computer and network issues',
  'free',
  'active',
  'all'
FROM service_categories sc WHERE sc.code = 'TECH'
ON CONFLICT (request_no) DO NOTHING; 