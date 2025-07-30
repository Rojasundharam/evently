-- Script to assign admin role to specific user
-- Run this after the user has logged in at least once

-- First, let's make sure the user exists in auth.users and profiles tables
-- Update the role for the specific email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'sroja@jkkn.ac.in';

-- If the profile doesn't exist yet, insert it
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
    id,
    email,
    'admin' as role,
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
    created_at,
    now() as updated_at
FROM auth.users 
WHERE email = 'sroja@jkkn.ac.in'
AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'sroja@jkkn.ac.in'
);

-- Verify the update
SELECT id, email, role, full_name, created_at, updated_at 
FROM profiles 
WHERE email = 'sroja@jkkn.ac.in'; 