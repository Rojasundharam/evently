-- Fix any existing rows with NULL applicable_to values
-- First, let's find out what enum values are allowed

-- Check the enum type definition
SELECT 
  t.typname,
  e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname LIKE '%applicable%'
ORDER BY e.enumsortorder;

-- Check existing values in the table
SELECT DISTINCT applicable_to, COUNT(*) 
FROM services 
GROUP BY applicable_to;

-- Based on the results above, update with a valid enum value
-- Common enum values might be: 'students', 'staff', 'faculty', 'everyone', etc.
-- Let's try the most common ones:

-- Try updating with 'students' first (most likely for a student portal)
DO $$
BEGIN
  BEGIN
    UPDATE services SET applicable_to = 'students' WHERE applicable_to IS NULL;
    RAISE NOTICE 'Updated NULL values to students';
  EXCEPTION WHEN invalid_text_representation THEN
    BEGIN
      UPDATE services SET applicable_to = 'everyone' WHERE applicable_to IS NULL;
      RAISE NOTICE 'Updated NULL values to everyone';
    EXCEPTION WHEN invalid_text_representation THEN
      BEGIN
        UPDATE services SET applicable_to = 'all_users' WHERE applicable_to IS NULL;
        RAISE NOTICE 'Updated NULL values to all_users';
      EXCEPTION WHEN invalid_text_representation THEN
        RAISE NOTICE 'Could not find valid enum value. Please check the enum definition first.';
      END;
    END;
  END;
END $$;

-- Verify the fix
SELECT 
  id, 
  name, 
  applicable_to,
  CASE 
    WHEN applicable_to IS NULL THEN 'NULL (needs fixing)'
    ELSE 'OK'
  END as status
FROM services; 