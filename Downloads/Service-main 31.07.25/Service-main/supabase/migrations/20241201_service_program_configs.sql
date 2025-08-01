-- Create service_program_configs table for program-specific service access
CREATE TABLE IF NOT EXISTS service_program_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  program_id varchar(255) NOT NULL,
  program_name text NOT NULL,
  admission_year varchar(20) NOT NULL,
  intake varchar(100) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique combinations of service, program, year, and intake
  UNIQUE(service_id, program_id, admission_year, intake)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_program_configs_service_id ON service_program_configs(service_id);
CREATE INDEX IF NOT EXISTS idx_service_program_configs_program_id ON service_program_configs(program_id);
CREATE INDEX IF NOT EXISTS idx_service_program_configs_status ON service_program_configs(status);
CREATE INDEX IF NOT EXISTS idx_service_program_configs_admission_year ON service_program_configs(admission_year);

-- Add RLS (Row Level Security) policies
ALTER TABLE service_program_configs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all service program configs
CREATE POLICY "Enable read access for authenticated users" ON service_program_configs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert service program configs
CREATE POLICY "Enable insert access for authenticated users" ON service_program_configs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update service program configs
CREATE POLICY "Enable update access for authenticated users" ON service_program_configs
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete service program configs
CREATE POLICY "Enable delete access for authenticated users" ON service_program_configs
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_program_configs_updated_at 
  BEFORE UPDATE ON service_program_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 