-- Add explicit relationship between service_requests and services
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_service_id_fkey;
ALTER TABLE service_requests ADD CONSTRAINT service_requests_service_id_fkey
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

-- Add any missing max_approval_level columns for old rows
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'service_requests' 
                AND column_name = 'max_approval_level') THEN
    ALTER TABLE service_requests ADD COLUMN max_approval_level INT DEFAULT 1;
  END IF;
END $$;

-- Update existing rows to have a max_approval_level if they don't already
UPDATE service_requests
SET max_approval_level = 1
WHERE max_approval_level IS NULL;

-- Create a view to make querying service requests with related data easier
CREATE OR REPLACE VIEW service_requests_view AS
SELECT
  sr.id,
  sr.service_id,
  s.name AS service_name,
  sr.requester_id,
  p.full_name AS requester_name,
  sr.status,
  sr.level,
  sr.max_approval_level,
  sr.created_at,
  sr.updated_at
FROM
  service_requests sr
LEFT JOIN
  services s ON sr.service_id = s.id
LEFT JOIN
  profiles p ON sr.requester_id = p.id; 