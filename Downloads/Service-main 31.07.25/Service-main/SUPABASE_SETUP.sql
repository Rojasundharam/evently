-- COMPREHENSIVE SUPABASE SETUP FOR USER MANAGEMENT
-- Run this script in your Supabase SQL Editor

BEGIN;

-- Step 1: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'staff', 'student')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ
);

-- Step 2: Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop any existing problematic policies
DO $block$
BEGIN
    -- Drop existing policies that might cause issues
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admin users can update all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
    
    RAISE NOTICE 'Dropped existing policies';
END $block$;

-- Step 5: Create SIMPLE and SAFE RLS policies
-- Policy 1: Users can read their own profile
CREATE POLICY "profiles_read_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile  
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Admin users can read all profiles
CREATE POLICY "admin_read_all_profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 5: Admin users can update all profiles
CREATE POLICY "admin_update_all_profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Step 6: Create notification policies
CREATE POLICY "notifications_read_own" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Step 7: Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, status, created_at, updated_at, last_sign_in_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        'active',
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        last_sign_in_at = NOW(),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Create trigger for user sign-in
CREATE OR REPLACE FUNCTION public.handle_user_signin()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        UPDATE public.profiles 
        SET last_sign_in_at = NEW.last_sign_in_at, updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_signin ON auth.users;
CREATE TRIGGER on_auth_user_signin
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_signin();

-- Step 10: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Step 11: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Step 12: Insert current user profile if it doesn't exist
DO $block$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
BEGIN
    -- Try to get current user info from auth.users
    SELECT id, email INTO current_user_id, current_user_email 
    FROM auth.users 
    WHERE email IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF current_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, full_name, role, status, created_at, updated_at, last_sign_in_at)
        VALUES (
            current_user_id,
            current_user_email,
            'Admin User',
            'admin',
            'active',
            NOW(),
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            role = CASE 
                WHEN public.profiles.role = 'admin' THEN 'admin'
                ELSE EXCLUDED.role
            END,
            updated_at = NOW();
            
        RAISE NOTICE 'Created/updated profile for user: %', current_user_email;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $block$;

-- Step 13: Create some sample notifications
INSERT INTO public.notifications (user_id, title, message, type, read, created_at)
SELECT 
    p.id,
    'Welcome to the User Management System',
    'Your account has been set up successfully. You can now manage users and access all features.',
    'success',
    false,
    NOW()
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications n 
    WHERE n.user_id = p.id AND n.title LIKE 'Welcome%'
);

-- Step 14: Verify the setup
DO $block$
DECLARE
    profile_count INTEGER;
    notification_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO notification_count FROM public.notifications;
    
    RAISE NOTICE 'Setup completed successfully!';
    RAISE NOTICE 'Profiles created: %', profile_count;
    RAISE NOTICE 'Notifications created: %', notification_count;
    
    IF profile_count = 0 THEN
        RAISE WARNING 'No profiles found. Make sure you are logged in when running this script.';
    END IF;
END $block$;

COMMIT;

-- Final message
SELECT 'Database setup completed successfully! Refresh your application.' as result; 