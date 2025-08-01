-- Fix RLS policy for service request creation after payment
-- This allows service requests to be created by the system after payment

-- Create a more permissive RLS policy for service request creation
DROP POLICY IF EXISTS "Users can create their own service requests" ON service_requests;

CREATE POLICY "Users can create their own service requests"
  ON service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if requester_id matches auth.uid() (normal case)
    requester_id = auth.uid()
    OR 
    -- Allow if this is a system-created request (when auth.uid() is null but requester_id is valid)
    (auth.uid() IS NULL AND requester_id IS NOT NULL)
    OR
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Alternative: Create a service account function that bypasses RLS
CREATE OR REPLACE FUNCTION create_service_request_system(
  p_service_id UUID,
  p_requester_id UUID,
  p_status service_request_status DEFAULT 'pending',
  p_level INT DEFAULT 1
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_request_id UUID;
BEGIN
  -- Insert the service request with elevated privileges
  INSERT INTO service_requests (service_id, requester_id, status, level)
  VALUES (p_service_id, p_requester_id, p_status, p_level)
  RETURNING id INTO new_request_id;
  
  RETURN new_request_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION create_service_request_system TO service_role;
GRANT EXECUTE ON FUNCTION create_service_request_system TO authenticated; 