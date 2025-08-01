-- ============================================================================
-- VERIFY SAMPLE DATA - Check if sample data exists and matches API expectations
-- ============================================================================

-- 1. Check if sample data exists
SELECT 'Sample Data Check:' as check;

SELECT 
    'payment_sessions' as table_name, 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN order_id LIKE 'SAMPLE%' THEN 1 END) as sample_rows
FROM payment_sessions
UNION ALL
SELECT 
    'transaction_details', 
    COUNT(*), 
    COUNT(CASE WHEN order_id LIKE 'SAMPLE%' THEN 1 END)
FROM transaction_details
UNION ALL
SELECT 
    'security_audit_log', 
    COUNT(*), 
    COUNT(CASE WHEN order_id LIKE 'SAMPLE%' THEN 1 END)
FROM security_audit_log;

-- 2. Show actual payment_sessions structure vs API expectations
SELECT 'Payment Sessions Data:' as check;
SELECT 
    order_id,
    customer_email,
    customer_phone,
    amount,
    currency,
    session_status,
    test_scenario,
    created_at
FROM payment_sessions 
WHERE order_id LIKE 'SAMPLE%'
ORDER BY created_at DESC;

-- 3. Show transaction_details structure
SELECT 'Transaction Details Data:' as check;
SELECT 
    order_id,
    transaction_id,
    status,
    signature_verified,
    created_at
FROM transaction_details 
WHERE order_id LIKE 'SAMPLE%'
ORDER BY created_at DESC;

-- 4. Show security_audit_log structure
SELECT 'Security Audit Log Data:' as check;
SELECT 
    event_type,
    severity,
    event_description,
    order_id,
    detected_at
FROM security_audit_log 
WHERE order_id LIKE 'SAMPLE%'
ORDER BY detected_at DESC;

-- 5. Check what columns exist in each table (to match with API expectations)
SELECT 'payment_sessions columns:' as check;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_sessions' 
ORDER BY ordinal_position;

SELECT 'transaction_details columns:' as check;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transaction_details' 
ORDER BY ordinal_position;

-- 6. Test a simple query that mimics what the API should do
SELECT 'API Test Query - Payment Sessions:' as test;
SELECT 
    id,
    order_id,
    customer_email,
    customer_phone,
    amount,
    currency,
    session_status,
    test_case_id,
    test_scenario,
    created_at
FROM payment_sessions 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'API Test Query - Transaction Details:' as test;
SELECT 
    id,
    order_id,
    transaction_id,
    status,
    signature_verified,
    created_at
FROM transaction_details 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Verification complete!' as status; 