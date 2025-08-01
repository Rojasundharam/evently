-- ============================================================================
-- FIX MISSING TRANSACTION DETAILS - Manual fix for specific order IDs
-- ============================================================================

-- Fix for the specific order IDs mentioned by the user
-- This will create transaction details for payment sessions that don't have them

-- 1. Fix ORD175395589444060943d5e505
INSERT INTO transaction_details (
    order_id,
    transaction_id,
    payment_session_id,
    status,
    hdfc_response_raw,
    form_data_received,
    signature_verified,
    created_at,
    transaction_date
) 
SELECT 
    'ORD175395589444060943d5e505',
    'ORD175395589444060943d5e505',
    ps.id,
    'CHARGED',
    '{"order_id": "ORD175395589444060943d5e505", "status": "CHARGED", "manual_fix": true, "fix_reason": "Missing transaction details"}'::JSONB,
    '{"order_id": "ORD175395589444060943d5e505", "manual_fix": true}'::JSONB,
    true,
    NOW(),
    NOW()
FROM payment_sessions ps
WHERE ps.order_id = 'ORD175395589444060943d5e505'
AND NOT EXISTS (
    SELECT 1 FROM transaction_details td 
    WHERE td.order_id = 'ORD175395589444060943d5e505'
);

-- 2. Fix ORD1753955970934907b0fe0d28
INSERT INTO transaction_details (
    order_id,
    transaction_id,
    payment_session_id,
    status,
    hdfc_response_raw,
    form_data_received,
    signature_verified,
    created_at,
    transaction_date
) 
SELECT 
    'ORD1753955970934907b0fe0d28',
    'ORD1753955970934907b0fe0d28',
    ps.id,
    'CHARGED',
    '{"order_id": "ORD1753955970934907b0fe0d28", "status": "CHARGED", "manual_fix": true, "fix_reason": "Missing transaction details"}'::JSONB,
    '{"order_id": "ORD1753955970934907b0fe0d28", "manual_fix": true}'::JSONB,
    true,
    NOW(),
    NOW()
FROM payment_sessions ps
WHERE ps.order_id = 'ORD1753955970934907b0fe0d28'
AND NOT EXISTS (
    SELECT 1 FROM transaction_details td 
    WHERE td.order_id = 'ORD1753955970934907b0fe0d28'
);

-- 3. Fix ORD17539560766760142ad12028
INSERT INTO transaction_details (
    order_id,
    transaction_id,
    payment_session_id,
    status,
    hdfc_response_raw,
    form_data_received,
    signature_verified,
    created_at,
    transaction_date
) 
SELECT 
    'ORD17539560766760142ad12028',
    'ORD17539560766760142ad12028',
    ps.id,
    'CHARGED',
    '{"order_id": "ORD17539560766760142ad12028", "status": "CHARGED", "manual_fix": true, "fix_reason": "Missing transaction details"}'::JSONB,
    '{"order_id": "ORD17539560766760142ad12028", "manual_fix": true}'::JSONB,
    true,
    NOW(),
    NOW()
FROM payment_sessions ps
WHERE ps.order_id = 'ORD17539560766760142ad12028'
AND NOT EXISTS (
    SELECT 1 FROM transaction_details td 
    WHERE td.order_id = 'ORD17539560766760142ad12028'
);

-- 4. Verify the fix
SELECT 
    'Verification' as check_type,
    ps.order_id,
    ps.status as session_status,
    CASE WHEN td.order_id IS NOT NULL THEN 'FIXED' ELSE 'STILL MISSING' END as transaction_status,
    td.created_at as transaction_created
FROM payment_sessions ps
LEFT JOIN transaction_details td ON ps.order_id = td.order_id
WHERE ps.order_id IN (
    'ORD175395589444060943d5e505',
    'ORD1753955970934907b0fe0d28', 
    'ORD17539560766760142ad12028',
    'ORD1753956130124789512a4605'
)
ORDER BY ps.created_at;

-- 5. Summary after fix
SELECT 
    'Summary' as info,
    COUNT(DISTINCT ps.order_id) as total_payment_sessions,
    COUNT(DISTINCT td.order_id) as total_transaction_details,
    COUNT(DISTINCT ps.order_id) - COUNT(DISTINCT td.order_id) as still_missing
FROM payment_sessions ps
LEFT JOIN transaction_details td ON ps.order_id = td.order_id
WHERE ps.order_id IN (
    'ORD175395589444060943d5e505',
    'ORD1753955970934907b0fe0d28', 
    'ORD17539560766760142ad12028',
    'ORD1753956130124789512a4605'
); 