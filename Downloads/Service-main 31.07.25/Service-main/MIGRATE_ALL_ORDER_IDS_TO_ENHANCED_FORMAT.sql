-- ============================================================================
-- MIGRATE ALL ORDER IDs TO ENHANCED FORMAT
-- This script updates ALL existing order IDs to use the enhanced format
-- with UUID for maximum uniqueness and security
-- ============================================================================

-- 1. Function to migrate ALL order IDs to enhanced format
CREATE OR REPLACE FUNCTION migrate_all_order_ids_to_enhanced_format()
RETURNS TABLE(
    total_processed INTEGER,
    migrated_count INTEGER,
    skipped_count INTEGER,
    error_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    order_record RECORD;
    new_order_id VARCHAR(50);
    total_processed INTEGER := 0;
    migrated INTEGER := 0;
    skipped INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    -- Process ALL order IDs, regardless of current format
    FOR order_record IN 
        SELECT id, order_id, created_at
        FROM payment_sessions 
        ORDER BY created_at
    LOOP
        total_processed := total_processed + 1;
        
        -- Check if already in enhanced format
        IF order_record.order_id ~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$' THEN
            skipped := skipped + 1;
            RAISE NOTICE 'Skipping order ID % (already in enhanced format)', order_record.order_id;
        ELSE
            BEGIN
                -- Generate new enhanced order ID
                new_order_id := generate_unique_order_id();
                
                -- Update the order ID
                UPDATE payment_sessions 
                SET order_id = new_order_id,
                    updated_at = NOW()
                WHERE id = order_record.id;
                
                migrated := migrated + 1;
                
                -- Log the migration
                RAISE NOTICE 'Migrated order ID % to enhanced format %', order_record.order_id, new_order_id;
                
            EXCEPTION
                WHEN OTHERS THEN
                    error_count := error_count + 1;
                    RAISE NOTICE 'Error migrating order ID %: %', order_record.order_id, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT total_processed, migrated, skipped, error_count;
END;
$$;

-- 2. Function to check migration readiness
CREATE OR REPLACE FUNCTION check_migration_readiness()
RETURNS TABLE(
    total_order_ids INTEGER,
    enhanced_format_count INTEGER,
    old_format_count INTEGER,
    basic_format_count INTEGER,
    invalid_format_count INTEGER,
    ready_for_migration BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    total_count INTEGER;
    enhanced_count INTEGER;
    old_count INTEGER;
    basic_count INTEGER;
    invalid_count INTEGER;
BEGIN
    -- Count total order IDs
    SELECT COUNT(*) INTO total_count FROM payment_sessions;
    
    -- Count by format
    SELECT COUNT(*) INTO enhanced_count 
    FROM payment_sessions 
    WHERE order_id ~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$';
    
    SELECT COUNT(*) INTO old_count 
    FROM payment_sessions 
    WHERE order_id ~ '^ORD[0-9]{13}[0-9]{1,4}$' 
    AND order_id !~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$';
    
    SELECT COUNT(*) INTO basic_count 
    FROM payment_sessions 
    WHERE order_id ~ '^ORD[0-9]+$' 
    AND order_id !~ '^ORD[0-9]{13}[0-9]{1,4}$';
    
    invalid_count := total_count - enhanced_count - old_count - basic_count;
    
    RETURN QUERY SELECT 
        total_count,
        enhanced_count,
        old_count,
        basic_count,
        invalid_count,
        (enhanced_count = total_count) as ready_for_migration;
END;
$$;

-- 3. Function to safely add format constraint after full migration
CREATE OR REPLACE FUNCTION add_enhanced_format_constraint()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if all order IDs are in enhanced format
    IF EXISTS (
        SELECT 1 FROM payment_sessions 
        WHERE order_id !~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$'
    ) THEN
        RAISE NOTICE 'Cannot add constraint: Some order IDs are not in enhanced format';
        RETURN FALSE;
    END IF;
    
    -- Remove old constraint if it exists
    ALTER TABLE payment_sessions DROP CONSTRAINT IF EXISTS check_order_id_format;
    
    -- Add the enhanced format constraint
    ALTER TABLE payment_sessions 
    ADD CONSTRAINT check_order_id_format 
    CHECK (order_id ~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$');
    
    RAISE NOTICE 'Enhanced format constraint added successfully';
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to add constraint: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- 4. Function to validate enhanced format migration
CREATE OR REPLACE FUNCTION validate_enhanced_format_migration()
RETURNS TABLE(
    order_id VARCHAR(50),
    old_format VARCHAR(50),
    new_format VARCHAR(50),
    migration_status TEXT,
    is_valid BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    order_record RECORD;
BEGIN
    FOR order_record IN 
        SELECT id, order_id, created_at
        FROM payment_sessions 
        ORDER BY created_at
    LOOP
        -- Check if in enhanced format
        IF order_record.order_id ~ '^ORD[0-9]{13}[0-9]{4}[a-f0-9]{16}$' THEN
            RETURN QUERY SELECT 
                order_record.order_id,
                'N/A'::VARCHAR(50),
                order_record.order_id,
                'Enhanced format (no migration needed)'::TEXT,
                TRUE;
        ELSE
            RETURN QUERY SELECT 
                order_record.order_id,
                order_record.order_id,
                'Needs migration'::VARCHAR(50),
                'Requires migration to enhanced format'::TEXT,
                FALSE;
        END IF;
    END LOOP;
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION migrate_all_order_ids_to_enhanced_format() TO service_role;
GRANT EXECUTE ON FUNCTION check_migration_readiness() TO authenticated;
GRANT EXECUTE ON FUNCTION add_enhanced_format_constraint() TO service_role;
GRANT EXECUTE ON FUNCTION validate_enhanced_format_migration() TO authenticated;

-- 6. Add comments
COMMENT ON FUNCTION migrate_all_order_ids_to_enhanced_format() IS 'Migrates ALL order IDs to enhanced format with UUID for maximum uniqueness';
COMMENT ON FUNCTION check_migration_readiness() IS 'Checks readiness for full migration to enhanced format';
COMMENT ON FUNCTION add_enhanced_format_constraint() IS 'Safely adds enhanced format constraint after migration';
COMMENT ON FUNCTION validate_enhanced_format_migration() IS 'Validates enhanced format migration status';

-- ============================================================================
-- USAGE INSTRUCTIONS:
-- 
-- 1. Check migration readiness:
--    SELECT * FROM check_migration_readiness();
--
-- 2. Validate current status:
--    SELECT * FROM validate_enhanced_format_migration();
--
-- 3. Migrate ALL order IDs to enhanced format:
--    SELECT * FROM migrate_all_order_ids_to_enhanced_format();
--
-- 4. After migration, add the enhanced format constraint:
--    SELECT add_enhanced_format_constraint();
--
-- 5. Verify the migration:
--    SELECT * FROM validate_enhanced_format_migration();
--    SELECT * FROM get_order_id_statistics();
-- ============================================================================ 