-- Quick fix for profiles constraint violations
-- Run this directly in your Supabase SQL editor

-- Step 1: First, let's check what columns exist and their types
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 2: Remove existing constraints that are causing issues
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'profiles_role_check' 
               AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'profiles_status_check' 
               AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_status_check;
    END IF;
END $$;

-- Step 3: Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Step 4: Check what role enum values are allowed
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'user_role'
);

-- Step 5: Check current data (handle role as enum, not text)
SELECT 
    id, 
    email, 
    role::text as role_value,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'profiles' AND column_name = 'status') 
        THEN status 
        ELSE 'N/A' 
    END as status_value
FROM public.profiles 
WHERE role IS NULL;

-- Step 6: Fix any NULL roles (set to a valid enum value)
UPDATE public.profiles 
SET 
    role = 'student'::user_role,
    updated_at = NOW()
WHERE role IS NULL;

-- Step 7: Set up status column properly
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'status') THEN
        -- Update any NULL status values
        UPDATE public.profiles SET status = 'active' WHERE status IS NULL;
        -- Set NOT NULL constraint
        ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;
        ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'active';
    END IF;
END $$;

-- Step 8: Add constraints only for status (role is enum so doesn't need CHECK constraint)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_status_check 
        CHECK (status IN ('active', 'inactive'));
    END IF;
END $$;

-- Step 9: Ensure there's at least one admin user
DO $$
BEGIN
    -- If no admin users exist, make the first user an admin
    IF (SELECT COUNT(*) FROM public.profiles WHERE role::text = 'admin') = 0 THEN
        UPDATE public.profiles 
        SET role = 'admin'::user_role, updated_at = NOW()
        WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
    END IF;
END $$;

-- Step 10: Verify the fix worked
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role::text = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role::text = 'staff' THEN 1 END) as staff_count,
    COUNT(CASE WHEN role::text = 'student' THEN 1 END) as student_count,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'profiles' AND column_name = 'status') 
        THEN (SELECT COUNT(CASE WHEN status = 'active' THEN 1 END) FROM public.profiles)
        ELSE 0 
    END as active_count,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'profiles' AND column_name = 'status') 
        THEN (SELECT COUNT(CASE WHEN status = 'inactive' THEN 1 END) FROM public.profiles)
        ELSE 0 
    END as inactive_count
FROM public.profiles;

SELECT 'Fix completed successfully!' as status; 