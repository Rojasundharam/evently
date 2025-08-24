-- Quick admin role update for director@jkkn.ac.in
-- Run this in your Supabase SQL Editor

UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'director@jkkn.ac.in'
);

-- If the profile doesn't exist, create it
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  'admin',
  'Director',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'director@jkkn.ac.in'
  AND NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.users.id
  );

-- Verify the result
SELECT 
  u.email,
  p.role,
  p.full_name,
  'Admin role updated successfully' as status
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'director@jkkn.ac.in';
