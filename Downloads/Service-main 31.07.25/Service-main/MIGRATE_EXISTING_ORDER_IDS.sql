-- ============================================================================
-- MIGRATE EXISTING ORDER IDs - Optional migration script
-- Run this only if you want to convert existing order IDs to the new format
-- ============================================================================

-- 1. Function to migrate existing order IDs to new format
CREATE OR REPLACE FUNCTION migrate_order_ids_to_new_format()
RETURNS TABLE(migrated_count INTEGER, skipped_count INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    order_record RECORD;
    new_order_id VARCHAR(50);
    migrated INTEGER := 0;
    skipped INTEGER := 0;
BEGIN
    -- Process each order ID that doesn't match the new format
    FOR order_record IN 
        SELECT id, order_id
        FROM payment_sessions 
        WHERE order_id !~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$'
        ORDER BY created_at
    LOOP
        -- Generate new unique order ID
        new_order_id := generate_unique_order_id();
        
        -- Update the order ID
        UPDATE payment_sessions 
        SET order_id = new_order_id,
            updated_at = NOW()
        WHERE id = order_record.id;
        
        migrated := migrated + 1;
        
        -- Log the migration
        RAISE NOTICE 'Migrated order ID % to %', order_record.order_id, new_order_id;
    END LOOP;
    
    RETURN QUERY SELECT migrated, skipped;
END;
$$;

-- 2. Function to check which order IDs need migration
CREATE OR REPLACE FUNCTION check_order_ids_for_migration()
RETURNS TABLE(
    order_id VARCHAR(50),
    current_format TEXT,
    needs_migration BOOLEAN
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
        -- Determine the current format
        IF order_record.order_id ~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$' THEN
            RETURN QUERY SELECT 
                order_record.order_id,
                'New format (with UUID)'::TEXT,
                FALSE;
        ELSIF order_record.order_id ~ '^ORD[0-9]{13}[0-9]{1,4}$' THEN
            RETURN QUERY SELECT 
                order_record.order_id,
                'Old format (timestamp + random)'::TEXT,
                TRUE;
        ELSIF order_record.order_id ~ '^ORD[0-9]+$' THEN
            RETURN QUERY SELECT 
                order_record.order_id,
                'Basic format'::TEXT,
                TRUE;
        ELSE
            RETURN QUERY SELECT 
                order_record.order_id,
                'Unknown format'::TEXT,
                TRUE;
        END IF;
    END LOOP;
END;
$$;

-- 3. Function to safely add the format constraint after migration
CREATE OR REPLACE FUNCTION add_format_constraint_safely()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if all order IDs match the new format
    IF EXISTS (
        SELECT 1 FROM payment_sessions 
        WHERE order_id !~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$'
    ) THEN
        RAISE NOTICE 'Cannot add constraint: Some order IDs do not match the new format';
        RETURN FALSE;
    END IF;
    
    -- Add the constraint
    ALTER TABLE payment_sessions 
    ADD CONSTRAINT check_order_id_format 
    CHECK (order_id ~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$');
    
    RAISE NOTICE 'Format constraint added successfully';
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to add constraint: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION migrate_order_ids_to_new_format() TO service_role;
GRANT EXECUTE ON FUNCTION check_order_ids_for_migration() TO authenticated;
GRANT EXECUTE ON FUNCTION add_format_constraint_safely() TO service_role;

-- 5. Usage instructions
COMMENT ON FUNCTION migrate_order_ids_to_new_format() IS 'Migrates existing order IDs to the new format with UUID';
COMMENT ON FUNCTION check_order_ids_for_migration() IS 'Checks which order IDs need migration to new format';
COMMENT ON FUNCTION add_format_constraint_safely() IS 'Safely adds format constraint after all IDs are migrated';

-- ============================================================================
-- USAGE INSTRUCTIONS:
-- 
-- 1. First, check which order IDs need migration:
--    SELECT * FROM check_order_ids_for_migration();
--
-- 2. If you want to migrate existing order IDs to new format:
--    SELECT * FROM migrate_order_ids_to_new_format();
--
-- 3. After migration, you can safely add the format constraint:
--    SELECT add_format_constraint_safely();
--
-- 4. Verify the migration:
--    SELECT * FROM validate_all_order_ids();
-- ============================================================================ 