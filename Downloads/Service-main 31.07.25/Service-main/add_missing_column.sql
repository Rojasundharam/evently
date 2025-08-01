-- Add missing last_sign_in_at column to profiles table
-- Run this in Supabase SQL Editor

SELECT 'Adding missing last_sign_in_at column...' as step;

-- Add the column if it doesn't exist
DO $block$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN last_sign_in_at TIMESTAMPTZ;
        RAISE NOTICE 'Added last_sign_in_at column to profiles table';
    ELSE
        RAISE NOTICE 'last_sign_in_at column already exists';
    END IF;
END $block$;

-- Update the trigger function to handle last_sign_in_at properly
CREATE OR REPLACE FUNCTION public.update_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        UPDATE public.profiles 
        SET last_sign_in_at = NEW.last_sign_in_at,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.update_last_sign_in();

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at';

SELECT 'Column addition completed!' as result; 