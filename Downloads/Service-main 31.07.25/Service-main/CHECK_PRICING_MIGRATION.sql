-- Check if the pricing migration has been run
-- Run this in Supabase SQL Editor to verify if amount and currency columns exist

-- Check if amount and currency columns exist in services table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND table_schema = 'public'
  AND column_name IN ('amount', 'currency')
ORDER BY column_name;

-- If no results, the migration hasn't been run yet
-- If you see 2 rows (amount and currency), the migration is complete

-- Also check a sample of services data
SELECT 
  name,
  payment_method,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'services' 
        AND column_name = 'amount'
    ) THEN 'Migration Complete'
    ELSE 'Migration Needed'
  END as migration_status
FROM services 
LIMIT 3; 