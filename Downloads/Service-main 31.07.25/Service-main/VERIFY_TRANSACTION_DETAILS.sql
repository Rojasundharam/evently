-- ============================================================================
-- VERIFY TRANSACTION DETAILS - Check current state after schema fix
-- ============================================================================

-- 1. Check all transaction details for the specific order IDs
SELECT 
    'Transaction Details Status' as info,
    order_id,
    transaction_id,
    status,
    signature_verified,
    created_at,
    CASE 
        WHEN transaction_amount IS NOT NULL THEN 'Has Amount'
        ELSE 'Missing Amount'
    END as amount_status,
    CASE 
        WHEN customer_email IS NOT NULL THEN 'Has Email'
        ELSE 'Missing Email'
    END as email_status
FROM transaction_details 
WHERE order_id IN (
    'ORD175395589444060943d5e505',
    'ORD1753955970934907b0fe0d28', 
    'ORD17539560766760142ad12028',
    'ORD1753956130124789512a4605'
)
ORDER BY created_at;

-- 2. Count total transaction details vs payment sessions
SELECT 
    'Summary' as info,
    COUNT(DISTINCT ps.order_id) as payment_sessions_count,
    COUNT(DISTINCT td.order_id) as transaction_details_count,
    COUNT(DISTINCT ps.order_id) - COUNT(DISTINCT td.order_id) as missing_transactions
FROM payment_sessions ps
LEFT JOIN transaction_details td ON ps.order_id = td.order_id
WHERE ps.order_id IN (
    'ORD175395589444060943d5e505',
    'ORD1753955970934907b0fe0d28', 
    'ORD17539560766760142ad12028',
    'ORD1753956130124789512a4605'
);

-- 3. Check recent transaction details (last hour)
SELECT 
    'Recent Transactions' as info,
    order_id,
    transaction_id,
    status,
    signature_verified,
    created_at
FROM transaction_details 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 4. Check if all required columns exist in transaction_details
SELECT 
    'Transaction Details Columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transaction_details'
ORDER BY ordinal_position; 