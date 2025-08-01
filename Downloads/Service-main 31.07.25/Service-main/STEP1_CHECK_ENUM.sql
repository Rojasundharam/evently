-- STEP 1: Check what enum values are allowed for applicable_to column
-- Run this first to see what values we can use

-- Check the enum type definition
SELECT 
  'Enum values for applicable_to:' as info,
  t.typname as enum_type,
  e.enumlabel as allowed_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname LIKE '%applicable%' OR t.typname LIKE '%service%'
ORDER BY t.typname, e.enumsortorder;

-- Check column definition
SELECT 
  'Column info:' as info,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND column_name = 'applicable_to';

-- Check existing values in the table
SELECT 
  'Current values in table:' as info,
  applicable_to, 
  COUNT(*) as count
FROM services 
GROUP BY applicable_to
ORDER BY applicable_to; 