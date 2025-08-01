-- Safe completion script for service management system
-- This script only adds missing elements without creating duplicates

-- Check if services table exists and has data
DO $$
DECLARE
  service_count INTEGER;
BEGIN
  -- Check if services table has data
  SELECT COUNT(*) INTO service_count FROM services;
  
  IF service_count = 0 THEN
    -- Insert sample data only if table is empty
    INSERT INTO service_categories (code, name, description) 
    VALUES 
      ('ACAD', 'Academic Services', 'Services related to academic activities'),
      ('ADMIN', 'Administrative Services', 'General administrative services'),
      ('TECH', 'Technical Services', 'IT and technical support services')
    ON CONFLICT (code) DO NOTHING;

    -- Insert services with safe applicable_to values (try students first, then fallback)
    DO $$
    BEGIN
      BEGIN
        INSERT INTO services (category_id, request_no, name, description, payment_method, status, applicable_to)
        SELECT 
          sc.id,
          'SRV001',
          'Student ID Card',
          'Request for new or replacement student ID card',
          'free',
          'active',
          'students'
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
          'students'
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
          'students'
        FROM service_categories sc WHERE sc.code = 'TECH'
        ON CONFLICT (request_no) DO NOTHING;
        
        RAISE NOTICE 'Inserted services with applicable_to = students';
      EXCEPTION WHEN invalid_text_representation THEN
        -- Try with 'everyone' instead
        INSERT INTO services (category_id, request_no, name, description, payment_method, status)
        SELECT 
          sc.id,
          'SRV001',
          'Student ID Card',
          'Request for new or replacement student ID card',
          'free',
          'active'
        FROM service_categories sc WHERE sc.code = 'ADMIN'
        ON CONFLICT (request_no) DO NOTHING;

        INSERT INTO services (category_id, request_no, name, description, payment_method, status)
        SELECT 
          sc.id,
          'SRV002',
          'Transcript Request',
          'Request for official academic transcript',
          'paid',
          'active'
        FROM service_categories sc WHERE sc.code = 'ACAD'
        ON CONFLICT (request_no) DO NOTHING;

        INSERT INTO services (category_id, request_no, name, description, payment_method, status)
        SELECT 
          sc.id,
          'SRV003',
          'IT Support',
          'Technical support for computer and network issues',
          'free',
          'active'
        FROM service_categories sc WHERE sc.code = 'TECH'
        ON CONFLICT (request_no) DO NOTHING;
        
        RAISE NOTICE 'Inserted services without applicable_to (using default)';
      END;
    END $$;
    
    RAISE NOTICE 'Sample data inserted successfully';
  ELSE
    RAISE NOTICE 'Services table already has data (count: %), skipping sample data insertion', service_count;
  END IF;
END $$;

-- Verify the setup
SELECT 
  'Services table' as table_name,
  COUNT(*) as record_count
FROM services
UNION ALL
SELECT 
  'Service categories table' as table_name,
  COUNT(*) as record_count
FROM service_categories
UNION ALL
SELECT 
  'Service requests table' as table_name,
  COUNT(*) as record_count
FROM service_requests; 