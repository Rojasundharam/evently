-- Comprehensive Payment Data Diagnostic
-- Run this to check all payment-related data for Order ID: ORD1753518841571869

-- 1. Check Payment Sessions
SELECT 'PAYMENT_SESSIONS' as table_name, * 
FROM payment_sessions 
WHERE order_id = 'ORD1753518841571869';

-- 2. Check Transaction Details  
SELECT 'TRANSACTION_DETAILS' as table_name, * 
FROM transaction_details 
WHERE order_id = 'ORD1753518841571869';

-- 3. Check Security Audit Logs
SELECT 'SECURITY_AUDIT_LOG' as table_name, * 
FROM security_audit_log 
WHERE order_id = 'ORD1753518841571869';

-- 4. Check Hash Verification (if exists)
SELECT 'HASH_VERIFICATION' as table_name, * 
FROM hash_verification 
WHERE order_id = 'ORD1753518841571869';

-- 5. Check Service Requests (if linked)
SELECT 'SERVICE_REQUESTS' as table_name, * 
FROM service_requests 
WHERE payment_order_id = 'ORD1753518841571869';

-- 6. Check if tables exist and their structure
SELECT 'TABLE_EXISTENCE' as table_name, 
       schemaname, tablename, tableowner 
FROM pg_tables 
WHERE tablename IN ('payment_sessions', 'transaction_details', 'security_audit_log', 'hash_verification');

-- 7. Check recent payment sessions (last 10)
SELECT 'RECENT_PAYMENTS' as table_name, 
       order_id, customer_email, amount, session_status, created_at
FROM payment_sessions 
ORDER BY created_at DESC 
LIMIT 10;

-- 8. Check recent transactions (last 10)  
SELECT 'RECENT_TRANSACTIONS' as table_name,
       order_id, transaction_id, status, transaction_amount, created_at
FROM transaction_details 
ORDER BY created_at DESC 
LIMIT 10;

-- 9. Check column names for transaction_details table
SELECT 'TRANSACTION_COLUMNS' as table_name,
       column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'transaction_details' 
ORDER BY ordinal_position;

-- 10. Check column names for payment_sessions table  
SELECT 'PAYMENT_SESSIONS_COLUMNS' as table_name,
       column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_sessions' 
ORDER BY ordinal_position; 