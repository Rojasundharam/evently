-- Fix streak tracking and ensure it updates correctly
-- This script ensures streak_days is properly tracked in user_stats

-- First, ensure the calculate_user_streak function exists
CREATE OR REPLACE FUNCTION calculate_user_streak(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    current_date_check DATE := CURRENT_DATE;
    has_activity BOOLEAN;
BEGIN
    -- Start from today and count backwards
    LOOP
        -- Check if user has any activity on this date
        SELECT EXISTS (
            SELECT 1 FROM activity_logs
            WHERE user_id = user_id_param
            AND DATE(created_at) = current_date_check
        ) INTO has_activity;
        
        -- If no activity found, exit loop
        IF NOT has_activity THEN
            -- Check if this is today - if yes, check yesterday too
            IF current_date_check = CURRENT_DATE AND streak_count = 0 THEN
                current_date_check := current_date_check - INTERVAL '1 day';
                CONTINUE;
            ELSE
                EXIT;
            END IF;
        END IF;
        
        -- Increment streak and move to previous day
        streak_count := streak_count + 1;
        current_date_check := current_date_check - INTERVAL '1 day';
        
        -- Safety limit to prevent infinite loops
        IF streak_count > 365 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ language 'plpgsql';

-- Function to update user's streak when they perform an activity
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's streak in user_stats
    UPDATE user_stats 
    SET streak_days = calculate_user_streak(NEW.user_id),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- If no row exists in user_stats, create one
    IF NOT FOUND THEN
        INSERT INTO user_stats (user_id, streak_days, updated_at)
        VALUES (NEW.user_id, calculate_user_streak(NEW.user_id), NOW());
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update streak on activity
DROP TRIGGER IF EXISTS update_streak_on_activity ON activity_logs;
CREATE TRIGGER update_streak_on_activity
AFTER INSERT ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();

-- Update all existing user streaks
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT DISTINCT user_id FROM activity_logs
    LOOP
        UPDATE user_stats 
        SET streak_days = calculate_user_streak(user_record.user_id)
        WHERE user_id = user_record.user_id;
        
        -- If no row exists, create one
        IF NOT FOUND THEN
            INSERT INTO user_stats (user_id, streak_days)
            VALUES (user_record.user_id, calculate_user_streak(user_record.user_id));
        END IF;
    END LOOP;
END $$;