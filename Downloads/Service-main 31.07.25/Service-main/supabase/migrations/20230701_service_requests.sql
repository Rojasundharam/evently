-- Create service_request_status enum
CREATE TYPE service_request_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'completed'
);

-- Create service_requests table
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status service_request_status NOT NULL DEFAULT 'pending',
  level INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies to service_requests table
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_service_requests_service_id ON service_requests(service_id);
CREATE INDEX idx_service_requests_requester_id ON service_requests(requester_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);

-- Grant access to authenticated users
CREATE POLICY "Authenticated users can view all service requests"
  ON service_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own service requests"
  ON service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their own service requests if pending"
  ON service_requests
  FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() AND status = 'pending')
  WITH CHECK (requester_id = auth.uid() AND status = 'pending');

-- Add admin policies
CREATE POLICY "Admins can perform all operations on service requests"
  ON service_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Add function to approve a request and increase its level
CREATE OR REPLACE FUNCTION approve_service_request(request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_level INT;
BEGIN
  -- Get the current level
  SELECT level INTO current_level FROM service_requests WHERE id = request_id;
  
  -- Update the request
  UPDATE service_requests 
  SET 
    status = 'approved',
    level = current_level + 1,
    updated_at = now()
  WHERE id = request_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql; 