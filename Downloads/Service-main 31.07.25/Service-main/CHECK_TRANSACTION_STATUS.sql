-- ============================================================================
-- CHECK TRANSACTION STATUS - Verify database setup and find missing data
-- Run this to check why transaction details aren't updating
-- ============================================================================

-- 1. Check if tables exist
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE tablename IN ('payment_sessions', 'transaction_details', 'security_audit_log', 'bank_test_cases')
ORDER BY tablename;

-- 2. Check if functions exist
SELECT 
    proname as function_name,
    proowner::regrole as owner
FROM pg_proc 
WHERE proname IN ('create_tracked_payment_session', 'record_transaction_response', 'log_security_event');

-- 3. Check payment_sessions table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_sessions' 
ORDER BY ordinal_position;

-- 4. Check if there's any data in tables
SELECT 'payment_sessions' as table_name, COUNT(*) as row_count FROM payment_sessions
UNION ALL
SELECT 'transaction_details' as table_name, COUNT(*) as row_count FROM transaction_details
UNION ALL
SELECT 'security_audit_log' as table_name, COUNT(*) as row_count FROM security_audit_log
UNION ALL
SELECT 'bank_test_cases' as table_name, COUNT(*) as row_count FROM bank_test_cases;

-- 5. Check recent payment sessions (if any)
SELECT 
    order_id,
    customer_email,
    amount,
    session_status,
    created_at,
    test_case_id
FROM payment_sessions 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check recent transactions (if any)
SELECT 
    order_id,
    transaction_id,
    status,
    signature_verified,
    created_at
FROM transaction_details 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Check RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('payment_sessions', 'transaction_details', 'security_audit_log');

-- 8. Test if functions can be called (basic test)
SELECT 'Testing create_tracked_payment_session...' as test;
SELECT create_tracked_payment_session(
    'TEST001', 
    'CUST001', 
    'test@example.com', 
    '+91 9876543210',
    'Test',
    'User',
    100.00,
    'INR',
    'Test payment session',
    NULL,
    NULL,
    'TC001',
    'Database test scenario'
) as test_session_id;

-- 9. Check if test data was inserted
SELECT 'Test data check...' as check;
SELECT order_id, customer_email, amount, test_case_id 
FROM payment_sessions 
WHERE order_id = 'TEST001';

-- 10. Clean up test data
DELETE FROM payment_sessions WHERE order_id = 'TEST001';

SELECT 'Database status check completed!' as status; 