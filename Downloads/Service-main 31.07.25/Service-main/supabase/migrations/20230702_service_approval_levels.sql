-- Create service_approval_levels table
CREATE TABLE service_approval_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  level INT NOT NULL,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(service_id, level)
);

-- Add RLS policies
ALTER TABLE service_approval_levels ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_service_approval_levels_service_id ON service_approval_levels(service_id);
CREATE INDEX idx_service_approval_levels_staff_id ON service_approval_levels(staff_id);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_service_approval_levels
BEFORE UPDATE ON service_approval_levels
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Grant access to authenticated users
CREATE POLICY "Authenticated users can view all service approval levels"
  ON service_approval_levels
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create/update/delete approval levels
CREATE POLICY "Admins can manage service approval levels"
  ON service_approval_levels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Add required level column to service_requests table
ALTER TABLE service_requests
ADD COLUMN max_approval_level INT DEFAULT 1;

-- Create a new function for auto-forwarding through approval levels
CREATE OR REPLACE FUNCTION approve_and_forward_request(request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_level INT;
  max_level INT;
  next_level INT;
BEGIN
  -- Get the current level and max approval level
  SELECT sr.level, sr.max_approval_level
  INTO current_level, max_level
  FROM service_requests sr
  WHERE sr.id = request_id;
  
  -- Calculate the next level
  next_level := current_level + 1;
  
  -- Update status based on whether we've reached the maximum level
  IF next_level > max_level THEN
    -- Final approval
    UPDATE service_requests 
    SET 
      status = 'completed',
      level = next_level,
      updated_at = now()
    WHERE id = request_id;
  ELSE
    -- Forward to next level
    UPDATE service_requests 
    SET 
      status = 'approved',
      level = next_level,
      updated_at = now()
    WHERE id = request_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql; 