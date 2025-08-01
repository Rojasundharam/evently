-- Check what enum values are allowed for applicable_to column

-- Check the enum type definition
SELECT 
  t.typname,
  e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname LIKE '%applicable%'
ORDER BY e.enumsortorder;

-- Alternative: Check column definition
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND column_name = 'applicable_to';

-- Check existing values in the table
SELECT DISTINCT applicable_to, COUNT(*) 
FROM services 
GROUP BY applicable_to; 