-- Clean profiles fix script
-- Run this in Supabase SQL Editor

-- First, check what we're working with
SELECT 'Checking profiles table structure...' as step;

SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check if role is an enum and what values it allows
SELECT 'Checking role enum values...' as step;

SELECT enumlabel as allowed_role_values
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'user_role'
);

-- Remove problematic constraints
SELECT 'Removing existing constraints...' as step;

DO $block$
BEGIN
    -- Drop role check constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_role_check' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
        RAISE NOTICE 'Dropped profiles_role_check constraint';
    END IF;
    
    -- Drop status check constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_status_check' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_status_check;
        RAISE NOTICE 'Dropped profiles_status_check constraint';
    END IF;
END $block$;

-- Add status column if missing
SELECT 'Adding status column if needed...' as step;

DO $block$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added status column';
    ELSE
        RAISE NOTICE 'Status column already exists';
    END IF;
END $block$;

-- Check current data issues
SELECT 'Checking for data issues...' as step;

SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as null_roles,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status
FROM public.profiles;

-- Fix NULL roles
SELECT 'Fixing NULL roles...' as step;

UPDATE public.profiles 
SET role = 'student'::user_role
WHERE role IS NULL;

-- Fix NULL status values  
SELECT 'Fixing NULL status values...' as step;

UPDATE public.profiles 
SET status = 'active'
WHERE status IS NULL;

-- Set constraints properly
SELECT 'Setting up constraints...' as step;

DO $block$
BEGIN
    -- Set status column NOT NULL if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;
        ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'active';
        
        -- Add status check constraint
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_status_check 
        CHECK (status IN ('active', 'inactive'));
        
        RAISE NOTICE 'Set up status column constraints';
    END IF;
END $block$;

-- Ensure admin user exists
SELECT 'Ensuring admin user exists...' as step;

DO $block$
BEGIN
    IF (SELECT COUNT(*) FROM public.profiles WHERE role::text = 'admin') = 0 THEN
        UPDATE public.profiles 
        SET role = 'admin'::user_role
        WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
        RAISE NOTICE 'Created admin user from first profile';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END $block$;

-- Final verification
SELECT 'Final verification...' as step;

SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role::text = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role::text = 'staff' THEN 1 END) as staff_count,
    COUNT(CASE WHEN role::text = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count
FROM public.profiles;

SELECT 'Profiles fix completed successfully!' as result; 