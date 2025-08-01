-- ============================================================================
-- ENSURE UNIQUE ORDER IDs - Database-level uniqueness enforcement
-- This script adds additional safeguards to prevent order ID duplication
-- ============================================================================

-- 1. Create a function to generate unique order IDs at database level
CREATE OR REPLACE FUNCTION generate_unique_order_id()
RETURNS VARCHAR(50)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id VARCHAR(50);
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    LOOP
        -- Generate order ID with multiple entropy sources
        new_order_id := 'ORD' || 
                       EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || 
                       LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') ||
                       SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 16);
        
        -- Check if this order ID already exists
        IF NOT EXISTS (SELECT 1 FROM payment_sessions WHERE order_id = new_order_id) THEN
            RETURN new_order_id;
        END IF;
        
        -- Prevent infinite loops
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique order ID after % attempts', max_attempts;
        END IF;
        
        -- Small delay to ensure timestamp changes
        PERFORM pg_sleep(0.001);
    END LOOP;
END;
$$;

-- 2. Create a trigger function to validate order ID uniqueness
CREATE OR REPLACE FUNCTION validate_order_id_uniqueness()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if order_id already exists in payment_sessions
    IF EXISTS (SELECT 1 FROM payment_sessions WHERE order_id = NEW.order_id AND id != NEW.id) THEN
        RAISE EXCEPTION 'Order ID % already exists', NEW.order_id;
    END IF;
    
    -- Check if order_id already exists in transaction_details
    IF EXISTS (SELECT 1 FROM transaction_details WHERE order_id = NEW.order_id) THEN
        -- Allow if it's the same payment session
        IF NOT EXISTS (
            SELECT 1 FROM payment_sessions ps 
            WHERE ps.order_id = NEW.order_id 
            AND ps.id = NEW.id
        ) THEN
            RAISE EXCEPTION 'Order ID % already exists in transaction_details', NEW.order_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. Create trigger on payment_sessions table
DROP TRIGGER IF EXISTS ensure_order_id_uniqueness ON payment_sessions;
CREATE TRIGGER ensure_order_id_uniqueness
    BEFORE INSERT OR UPDATE ON payment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_id_uniqueness();

-- 4. Create a function to clean up duplicate order IDs (if any exist)
CREATE OR REPLACE FUNCTION cleanup_duplicate_order_ids()
RETURNS TABLE(cleaned_count INTEGER, duplicate_count INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    duplicate_records RECORD;
    new_order_id VARCHAR(50);
    cleaned INTEGER := 0;
    duplicates INTEGER := 0;
BEGIN
    -- Count duplicates
    SELECT COUNT(*) INTO duplicates
    FROM (
        SELECT order_id, COUNT(*) as cnt
        FROM payment_sessions
        GROUP BY order_id
        HAVING COUNT(*) > 1
    ) dupes;
    
    -- Clean up duplicates by generating new order IDs
    FOR duplicate_records IN 
        SELECT id, order_id
        FROM payment_sessions ps1
        WHERE EXISTS (
            SELECT 1 FROM payment_sessions ps2 
            WHERE ps2.order_id = ps1.order_id 
            AND ps2.id < ps1.id
        )
    LOOP
        -- Generate new unique order ID
        new_order_id := generate_unique_order_id();
        
        -- Update the duplicate record
        UPDATE payment_sessions 
        SET order_id = new_order_id,
            updated_at = NOW()
        WHERE id = duplicate_records.id;
        
        cleaned := cleaned + 1;
    END LOOP;
    
    RETURN QUERY SELECT cleaned, duplicates;
END;
$$;

-- 5. Create an index to improve order_id lookups
CREATE INDEX IF NOT EXISTS idx_payment_sessions_order_id ON payment_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_transaction_details_order_id ON transaction_details(order_id);

-- 6. Add a constraint to ensure order_id format (only for new records)
-- First check if constraint already exists, then add it only if it doesn't
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_order_id_format' 
        AND table_name = 'payment_sessions'
    ) THEN
        -- Add constraint only if it doesn't exist
        -- Updated to match HDFC-compatible format: ORD + timestamp + random + short uuid
        ALTER TABLE payment_sessions 
        ADD CONSTRAINT check_order_id_format 
        CHECK (order_id ~ '^ORD[0-9]{13}[0-9]{3}[a-f0-9]{8}$');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If constraint addition fails, log it but don't stop the script
        RAISE NOTICE 'Could not add order_id format constraint: %', SQLERRM;
END $$;

-- 7. Create a function to get order statistics
CREATE OR REPLACE FUNCTION get_order_id_statistics()
RETURNS TABLE(
    total_orders BIGINT,
    unique_order_ids BIGINT,
    duplicate_count BIGINT,
    latest_order_id VARCHAR(50),
    oldest_order_id VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_orders,
        COUNT(DISTINCT order_id) as unique_order_ids,
        COUNT(*) - COUNT(DISTINCT order_id) as duplicate_count,
        MAX(order_id) as latest_order_id,
        MIN(order_id) as oldest_order_id
    FROM payment_sessions;
END;
$$;

-- 8. Create a function to validate all existing order IDs
CREATE OR REPLACE FUNCTION validate_all_order_ids()
RETURNS TABLE(
    order_id VARCHAR(50),
    is_valid BOOLEAN,
    validation_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    order_record RECORD;
BEGIN
    FOR order_record IN 
        SELECT DISTINCT order_id 
        FROM payment_sessions 
        ORDER BY order_id
    LOOP
        -- Check HDFC-compatible format first (ORD + timestamp + random + short uuid)
        IF order_record.order_id ~ '^ORD[0-9]{13}[0-9]{3}[a-f0-9]{8}$' THEN
            RETURN QUERY SELECT 
                order_record.order_id,
                TRUE,
                'Valid HDFC-compatible order ID format'::TEXT;
        -- Check old enhanced format (ORD + timestamp + random + long uuid)
        ELSIF order_record.order_id ~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$' THEN
            RETURN QUERY SELECT 
                order_record.order_id,
                TRUE,
                'Valid old enhanced order ID format'::TEXT;
        -- Check old format (ORD + timestamp + random)
        ELSIF order_record.order_id ~ '^ORD[0-9]{13}[0-9]{1,4}$' THEN
            RETURN QUERY SELECT 
                order_record.order_id,
                TRUE,
                'Valid old order ID format'::TEXT;
        -- Check basic ORD format
        ELSIF order_record.order_id ~ '^ORD[0-9]+$' THEN
            RETURN QUERY SELECT 
                order_record.order_id,
                TRUE,
                'Valid basic order ID format'::TEXT;
        ELSE
            RETURN QUERY SELECT 
                order_record.order_id,
                FALSE,
                'Invalid order ID format'::TEXT;
        END IF;
    END LOOP;
END;
$$;

-- 9. Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_unique_order_id() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_duplicate_order_ids() TO service_role;
GRANT EXECUTE ON FUNCTION get_order_id_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_all_order_ids() TO authenticated;

-- 10. Create a comment for documentation
COMMENT ON FUNCTION generate_unique_order_id() IS 'Generates a unique order ID with guaranteed uniqueness using timestamp, random number, and UUID fragment';
COMMENT ON FUNCTION validate_order_id_uniqueness() IS 'Trigger function to validate order ID uniqueness before insert/update';
COMMENT ON FUNCTION cleanup_duplicate_order_ids() IS 'Cleans up any duplicate order IDs by generating new unique ones'; 