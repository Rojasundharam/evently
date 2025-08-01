-- ============================================================================
-- INSERT SAMPLE TRANSACTION DATA - To test dashboard functionality
-- Run this to populate sample data for testing the transaction dashboard
-- ============================================================================

-- 1. Insert sample payment sessions
INSERT INTO payment_sessions (
    order_id, customer_email, customer_phone, amount, currency, 
    session_status, test_case_id, test_scenario, created_at
) VALUES 
('ORD1753435000001', 'student1@example.com', '+91 9876543210', 150.00, 'INR', 'completed', 'TC001', 'Valid Payment - Medium Amount', NOW() - INTERVAL '2 hours'),
('ORD1753435000002', 'student2@example.com', '+91 9876543211', 100.00, 'INR', 'completed', 'TC002', 'Valid Payment - Small Amount', NOW() - INTERVAL '1 hour'),
('ORD1753435000003', 'student3@example.com', '+91 9876543212', 50.00, 'INR', 'failed', 'TC003', 'Failed Payment Test', NOW() - INTERVAL '30 minutes'),
('ORD1753435000004', 'student4@example.com', '+91 9876543213', 200.00, 'INR', 'completed', 'TC004', 'Valid Payment - Large Amount', NOW() - INTERVAL '15 minutes'),
('ORD1753435000005', 'student5@example.com', '+91 9876543214', 75.00, 'INR', 'pending', 'TC005', 'Pending Payment Test', NOW() - INTERVAL '5 minutes')
ON CONFLICT (order_id) DO NOTHING;

-- 2. Insert corresponding transaction details
INSERT INTO transaction_details (
    order_id, transaction_id, status, signature_verified, 
    hdfc_response_raw, form_data_received, created_at
) VALUES 
('ORD1753435000001', 'TXN001', 'CHARGED', true, 
    '{"status": "CHARGED", "transaction_id": "TXN001", "amount": "150.00"}'::jsonb,
    '{"order_id": "ORD1753435000001", "status": "CHARGED", "signature": "valid"}'::jsonb,
    NOW() - INTERVAL '2 hours'),
('ORD1753435000002', 'TXN002', 'CHARGED', true,
    '{"status": "CHARGED", "transaction_id": "TXN002", "amount": "100.00"}'::jsonb,
    '{"order_id": "ORD1753435000002", "status": "CHARGED", "signature": "valid"}'::jsonb,
    NOW() - INTERVAL '1 hour'),
('ORD1753435000003', 'TXN003', 'FAILED', true,
    '{"status": "FAILED", "transaction_id": "TXN003", "amount": "50.00", "failure_reason": "Insufficient funds"}'::jsonb,
    '{"order_id": "ORD1753435000003", "status": "FAILED", "signature": "valid"}'::jsonb,
    NOW() - INTERVAL '30 minutes'),
('ORD1753435000004', 'TXN004', 'CHARGED', true,
    '{"status": "CHARGED", "transaction_id": "TXN004", "amount": "200.00"}'::jsonb,
    '{"order_id": "ORD1753435000004", "status": "CHARGED", "signature": "valid"}'::jsonb,
    NOW() - INTERVAL '15 minutes'),
('ORD1753435000005', 'TXN005', 'PENDING', true,
    '{"status": "PENDING", "transaction_id": "TXN005", "amount": "75.00"}'::jsonb,
    '{"order_id": "ORD1753435000005", "status": "PENDING", "signature": "valid"}'::jsonb,
    NOW() - INTERVAL '5 minutes')
ON CONFLICT DO NOTHING;

-- 3. Insert sample security audit logs
INSERT INTO security_audit_log (
    event_type, severity, event_description, order_id, detected_at
) VALUES 
('payment_success', 'low', 'Payment completed successfully for order ORD1753435000001', 'ORD1753435000001', NOW() - INTERVAL '2 hours'),
('signature_verification_success', 'low', 'HDFC signature verified successfully for order ORD1753435000001', 'ORD1753435000001', NOW() - INTERVAL '2 hours'),
('payment_success', 'low', 'Payment completed successfully for order ORD1753435000002', 'ORD1753435000002', NOW() - INTERVAL '1 hour'),
('signature_verification_success', 'low', 'HDFC signature verified successfully for order ORD1753435000002', 'ORD1753435000002', NOW() - INTERVAL '1 hour'),
('payment_failure', 'medium', 'Payment failed for order ORD1753435000003: Insufficient funds', 'ORD1753435000003', NOW() - INTERVAL '30 minutes'),
('signature_verification_success', 'low', 'HDFC signature verified successfully for order ORD1753435000003', 'ORD1753435000003', NOW() - INTERVAL '30 minutes'),
('payment_success', 'low', 'Payment completed successfully for order ORD1753435000004', 'ORD1753435000004', NOW() - INTERVAL '15 minutes'),
('signature_verification_success', 'low', 'HDFC signature verified successfully for order ORD1753435000004', 'ORD1753435000004', NOW() - INTERVAL '15 minutes'),
('payment_processing', 'low', 'Payment processing initiated for order ORD1753435000005', 'ORD1753435000005', NOW() - INTERVAL '5 minutes')
ON CONFLICT DO NOTHING;

-- 4. Update bank test cases with sample results
UPDATE bank_test_cases SET 
    actual_result = 'CHARGED',
    test_status = 'passed',
    execution_date = NOW() - INTERVAL '2 hours',
    executed_by = 'admin_user'
WHERE test_case_id = 'TC001';

UPDATE bank_test_cases SET 
    actual_result = 'CHARGED',
    test_status = 'passed',
    execution_date = NOW() - INTERVAL '1 hour',
    executed_by = 'admin_user'
WHERE test_case_id = 'TC002';

-- 5. Verify data was inserted
SELECT 'Data verification...' as status;

SELECT 'Payment Sessions:' as table_name, COUNT(*) as count FROM payment_sessions
UNION ALL
SELECT 'Transaction Details:', COUNT(*) FROM transaction_details
UNION ALL
SELECT 'Security Audit Log:', COUNT(*) FROM security_audit_log
UNION ALL
SELECT 'Bank Test Cases:', COUNT(*) FROM bank_test_cases WHERE actual_result IS NOT NULL;

-- 6. Show recent transactions
SELECT 
    'Recent Transactions:' as info,
    ps.order_id,
    ps.customer_email,
    ps.amount,
    td.status,
    td.signature_verified,
    ps.created_at
FROM payment_sessions ps
LEFT JOIN transaction_details td ON ps.order_id = td.order_id
ORDER BY ps.created_at DESC
LIMIT 5;

SELECT 'Sample transaction data inserted successfully!' as result;
SELECT 'Refresh your admin dashboard to see the data!' as next_step; 