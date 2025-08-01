-- ============================================================================
-- CHECK TRANSACTION_DETAILS TABLE SCHEMA
-- ============================================================================

-- Check what columns actually exist in transaction_details table
SELECT 
    'TRANSACTION_DETAILS SCHEMA' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transaction_details' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check the table structure
SELECT 
    'TABLE INFO' as info_type,
    table_name,
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_name = 'transaction_details';