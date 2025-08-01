-- ============================================================================
-- DIAGNOSE TRANSACTION ISSUE - Check why transaction details are missing
-- ============================================================================

-- Check the specific order IDs mentioned by the user
SELECT 
    'Payment Sessions' as table_name,
    order_id,
    status,
    created_at,
    hdfc_session_response IS NOT NULL as has_session_response
FROM payment_sessions 
WHERE order_id IN (
    'ORD175395589444060943d5e505',
    'ORD1753955970934907b0fe0d28', 
    'ORD17539560766760142ad12028',
    'ORD1753956130124789512a4605'
)
ORDER BY created_at;

-- Check transaction details for the same order IDs
SELECT 
    'Transaction Details' as table_name,
    order_id,
    transaction_id,
    status,
    created_at,
    signature_verified,
    hdfc_response_raw IS NOT NULL as has_hdfc_response
FROM transaction_details 
WHERE order_id IN (
    'ORD175395589444060943d5e505',
    'ORD1753955970934907b0fe0d28', 
    'ORD17539560766760142ad12028',
    'ORD1753956130124789512a4605'
)
ORDER BY created_at;

-- Check if there are any failed transaction recordings
SELECT 
    'Recent Transaction Details' as table_name,
    order_id,
    transaction_id,
    status,
    created_at,
    signature_verified
FROM transaction_details 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- Check payment sessions vs transaction details count
SELECT 
    'Summary' as info,
    COUNT(DISTINCT ps.order_id) as payment_sessions_count,
    COUNT(DISTINCT td.order_id) as transaction_details_count,
    COUNT(DISTINCT ps.order_id) - COUNT(DISTINCT td.order_id) as missing_transactions
FROM payment_sessions ps
LEFT JOIN transaction_details td ON ps.order_id = td.order_id
WHERE ps.created_at >= NOW() - INTERVAL '1 hour';

-- Check for any errors in the logs (if you have a logs table)
-- SELECT * FROM your_logs_table WHERE created_at >= NOW() - INTERVAL '1 hour' AND message LIKE '%transaction%';

-- Check if the database functions exist and are working
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('record_transaction_response', 'create_tracked_payment_session')
AND routine_schema = 'public';

-- Test the record_transaction_response function manually
-- (Uncomment and run this if you want to test the function)
/*
SELECT record_transaction_response(
    'ORD175395589444060943d5e505'::VARCHAR,
    'TEST_TXN_001'::VARCHAR,
    NULL::UUID,
    'CHARGED'::VARCHAR,
    '{"test": "response"}'::JSONB,
    '{"test": "form"}'::JSONB,
    '{"signature": "test", "verified": true}'::JSONB,
    'TEST_CASE'::VARCHAR,
    '127.0.0.1'::INET,
    'Test User Agent'::TEXT
);
*/ 