-- Helper function to check if a view exists
CREATE OR REPLACE FUNCTION check_if_view_exists(view_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  view_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.views
    WHERE table_schema = 'public' 
    AND table_name = view_name
  ) INTO view_exists;
  
  RETURN view_exists;
END;
$$ LANGUAGE plpgsql;

-- Helper function to execute arbitrary SQL with proper permissions
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql;

-- Function to create the service requests view - with column checking
CREATE OR REPLACE FUNCTION create_service_requests_view()
RETURNS VOID AS $$
DECLARE
  service_id_col TEXT;
  requester_id_col TEXT;
BEGIN
  -- Check if service_id column exists
  SELECT column_name INTO service_id_col
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'service_requests'
    AND column_name = 'service_id';
    
  -- If service_id doesn't exist, try looking for services_id
  IF service_id_col IS NULL THEN
    SELECT column_name INTO service_id_col
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_requests'
      AND column_name LIKE '%service%id%';
  END IF;
  
  -- Check if requester_id column exists
  SELECT column_name INTO requester_id_col
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'service_requests'
    AND column_name = 'requester_id';
    
  -- If requester_id doesn't exist, try looking for user_id or similar
  IF requester_id_col IS NULL THEN
    SELECT column_name INTO requester_id_col
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_requests'
      AND (column_name LIKE '%user%id%' OR column_name LIKE '%requester%');
  END IF;
  
  -- Check if we found the columns
  IF service_id_col IS NULL OR requester_id_col IS NULL THEN
    RAISE EXCEPTION 'Could not identify service_id or requester_id columns';
  END IF;
  
  -- Create the view with the detected columns
  EXECUTE format('
    CREATE OR REPLACE VIEW service_requests_view AS
    SELECT
      sr.id,
      sr.%I AS service_id,
      s.name AS service_name,
      sr.%I AS requester_id,
      p.full_name AS requester_name,
      sr.status,
      sr.level,
      sr.max_approval_level,
      sr.created_at,
      sr.updated_at
    FROM
      service_requests sr
    LEFT JOIN
      services s ON sr.%I = s.id
    LEFT JOIN
      profiles p ON sr.%I = p.id
  ', service_id_col, requester_id_col, service_id_col, requester_id_col);
  
  RAISE NOTICE 'Created view with service_id column: % and requester_id column: %', service_id_col, requester_id_col;
END;
$$ LANGUAGE plpgsql;

-- Function to determine actual column names in service_requests table
CREATE OR REPLACE FUNCTION get_service_requests_columns()
RETURNS TABLE(column_name TEXT, data_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::TEXT, c.data_type::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'service_requests'
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_if_view_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_service_requests_view() TO authenticated;
GRANT EXECUTE ON FUNCTION get_service_requests_columns() TO authenticated;

-- Create the view if it doesn't exist yet
DO $$
BEGIN
  -- Try to create the view with column detection
  BEGIN
    PERFORM create_service_requests_view();
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create view: %', SQLERRM;
      -- We'll rely on the fallback query mechanism in the app
  END;
END;
$$; 