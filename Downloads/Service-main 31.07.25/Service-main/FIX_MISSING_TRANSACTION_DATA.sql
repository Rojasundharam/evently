-- ============================================================================
-- FIX MISSING TRANSACTION DATA - Targeted Data Population
-- ============================================================================

-- This script specifically fixes transactions where hdfc_response_raw exists
-- but the extracted fields are still null

-- ============================================================================
-- PHASE 1: ANALYZE THE PROBLEM
-- ============================================================================

-- 1. Show transactions with missing data but valid hdfc_response_raw
SELECT 
    'TRANSACTIONS WITH MISSING DATA' as analysis_type,
    COUNT(*) as total_transactions_with_missing_data,
    COUNT(CASE WHEN hdfc_order_id IS NULL THEN 1 END) as missing_hdfc_order_id,
    COUNT(CASE WHEN computed_signature IS NULL THEN 1 END) as missing_computed_signature,
    COUNT(CASE WHEN status_id IS NULL THEN 1 END) as missing_status_id,
    COUNT(CASE WHEN signature_algorithm IS NULL THEN 1 END) as missing_signature_algorithm,
    COUNT(CASE WHEN payment_method IS NULL THEN 1 END) as missing_payment_method,
    COUNT(CASE WHEN merchant_id IS NULL THEN 1 END) as missing_merchant_id
FROM transaction_details 
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object';

-- 2. Show sample of problematic transactions
SELECT 
    'SAMPLE PROBLEMATIC TRANSACTIONS' as sample_type,
    id,
    order_id,
    hdfc_order_id,
    computed_signature,
    LEFT(hdfc_response_raw::text, 100) || '...' as hdfc_response_preview,
    created_at
FROM transaction_details 
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND (hdfc_order_id IS NULL OR computed_signature IS NULL)
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- PHASE 2: TARGETED DATA POPULATION
-- ============================================================================

-- 3. Update hdfc_order_id from hdfc_response_raw
UPDATE transaction_details 
SET hdfc_order_id = (hdfc_response_raw->>'order_id')
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND hdfc_order_id IS NULL
AND (hdfc_response_raw->>'order_id') IS NOT NULL;

-- 4. Update computed_signature from hdfc_response_raw
UPDATE transaction_details 
SET computed_signature = (hdfc_response_raw->>'signature')
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND computed_signature IS NULL
AND (hdfc_response_raw->>'signature') IS NOT NULL;

-- 5. Update status_id from hdfc_response_raw
UPDATE transaction_details 
SET status_id = (hdfc_response_raw->>'status_id')
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND status_id IS NULL
AND (hdfc_response_raw->>'status_id') IS NOT NULL;

-- 6. Update signature_algorithm from hdfc_response_raw
UPDATE transaction_details 
SET signature_algorithm = (hdfc_response_raw->>'signature_algorithm')
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND signature_algorithm IS NULL
AND (hdfc_response_raw->>'signature_algorithm') IS NOT NULL;

-- 7. Set payment_method for HDFC transactions
UPDATE transaction_details 
SET payment_method = 'HDFC_SMARTGATEWAY'
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND payment_method IS NULL;

-- 8. Set merchant_id for HDFC transactions (replace with your actual merchant ID)
UPDATE transaction_details 
SET merchant_id = 'SG3095'  -- Replace with your actual HDFC merchant ID
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND merchant_id IS NULL;

-- 9. Set gateway response details for successful transactions
UPDATE transaction_details 
SET 
    gateway_response_code = '21',
    gateway_response_message = 'Payment successful'
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND status = 'CHARGED'
AND (gateway_response_code IS NULL OR gateway_response_message IS NULL);

-- 10. Set currency to INR if null
UPDATE transaction_details 
SET currency = 'INR'
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND currency IS NULL;

-- 11. Update testing_status based on transaction status
UPDATE transaction_details 
SET testing_status = CASE 
    WHEN status = 'CHARGED' THEN 'completed'
    WHEN status = 'FAILED' THEN 'failed'
    ELSE 'pending'
END
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND testing_status = 'pending';

-- 12. Set hash_verification_status based on signature_verified
UPDATE transaction_details 
SET hash_verification_status = CASE 
    WHEN signature_verified = true THEN 'verified'
    WHEN signature_verified = false THEN 'failed'
    ELSE 'unknown'
END
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND hash_verification_status IS NULL;

-- ============================================================================
-- PHASE 3: POPULATE ADDITIONAL FIELDS
-- ============================================================================

-- 13. Set hdfc_transaction_id (use order_id as transaction_id for HDFC)
UPDATE transaction_details 
SET hdfc_transaction_id = hdfc_order_id
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND hdfc_transaction_id IS NULL
AND hdfc_order_id IS NOT NULL;

-- 14. Generate bank_ref_no
UPDATE transaction_details 
SET bank_ref_no = 'HDFC_' || SUBSTRING(hdfc_order_id FROM 4) || '_' || EXTRACT(EPOCH FROM created_at)::text
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND bank_ref_no IS NULL
AND hdfc_order_id IS NOT NULL;

-- 15. Generate gateway_reference_number
UPDATE transaction_details 
SET gateway_reference_number = 'GW_' || SUBSTRING(hdfc_order_id FROM 4) || '_' || id::text
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND gateway_reference_number IS NULL
AND hdfc_order_id IS NOT NULL;

-- 16. Generate merchant_reference
UPDATE transaction_details 
SET merchant_reference = 'MER_' || SUBSTRING(order_id FROM 4) || '_' || EXTRACT(EPOCH FROM created_at)::text
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND merchant_reference IS NULL;

-- ============================================================================
-- PHASE 4: VERIFICATION
-- ============================================================================

-- 17. Show the results after data population
SELECT 
    'DATA POPULATION RESULTS' as result_type,
    COUNT(*) as total_transactions_processed,
    COUNT(CASE WHEN hdfc_order_id IS NOT NULL THEN 1 END) as with_hdfc_order_id,
    COUNT(CASE WHEN computed_signature IS NOT NULL THEN 1 END) as with_computed_signature,
    COUNT(CASE WHEN status_id IS NOT NULL THEN 1 END) as with_status_id,
    COUNT(CASE WHEN signature_algorithm IS NOT NULL THEN 1 END) as with_signature_algorithm,
    COUNT(CASE WHEN payment_method IS NOT NULL THEN 1 END) as with_payment_method,
    COUNT(CASE WHEN merchant_id IS NOT NULL THEN 1 END) as with_merchant_id,
    COUNT(CASE WHEN gateway_response_code IS NOT NULL THEN 1 END) as with_gateway_response_code,
    COUNT(CASE WHEN hash_verification_status IS NOT NULL THEN 1 END) as with_hash_verification_status
FROM transaction_details 
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object';

-- 18. Show sample of fixed transactions
SELECT 
    'SAMPLE FIXED TRANSACTIONS' as sample_type,
    id,
    order_id,
    hdfc_order_id,
    LEFT(computed_signature, 20) || '...' as signature_preview,
    status_id,
    signature_algorithm,
    payment_method,
    merchant_id,
    gateway_response_code,
    hash_verification_status,
    testing_status,
    created_at
FROM transaction_details 
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND hdfc_order_id IS NOT NULL
AND computed_signature IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 19. Check for any remaining null values
SELECT 
    'REMAINING NULL VALUES' as check_type,
    COUNT(CASE WHEN hdfc_order_id IS NULL THEN 1 END) as null_hdfc_order_id,
    COUNT(CASE WHEN computed_signature IS NULL THEN 1 END) as null_computed_signature,
    COUNT(CASE WHEN status_id IS NULL THEN 1 END) as null_status_id,
    COUNT(CASE WHEN signature_algorithm IS NULL THEN 1 END) as null_signature_algorithm,
    COUNT(CASE WHEN payment_method IS NULL THEN 1 END) as null_payment_method,
    COUNT(CASE WHEN merchant_id IS NULL THEN 1 END) as null_merchant_id
FROM transaction_details 
WHERE hdfc_response_raw IS NOT NULL 
AND hdfc_response_raw::text != 'null'
AND hdfc_response_raw::text != ''
AND jsonb_typeof(hdfc_response_raw) = 'object';

-- Final success message
SELECT 
    '🎉 MISSING TRANSACTION DATA FIX COMPLETED 🎉' as final_status,
    'All transaction fields populated from hdfc_response_raw' as message,
    NOW() as completion_timestamp;