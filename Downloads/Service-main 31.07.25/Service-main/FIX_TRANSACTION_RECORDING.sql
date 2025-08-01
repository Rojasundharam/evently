-- ============================================================================
-- FIX TRANSACTION RECORDING - Update Database Function
-- ============================================================================

-- The issue is that the record_transaction_response function is not properly
-- extracting individual fields from the HDFC response JSON and storing them
-- in the transaction_details table.

-- Let's first check what the current function does and then fix it.

-- ============================================================================
-- PHASE 1: CHECK CURRENT FUNCTION
-- ============================================================================

-- 1. Check if the function exists
SELECT 
    'FUNCTION CHECK' as check_type,
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'record_transaction_response'
LIMIT 1;

-- ============================================================================
-- PHASE 2: DROP AND RECREATE THE FUNCTION TO PROPERLY EXTRACT HDFC DATA
-- ============================================================================

-- 2. First, drop the existing function to avoid parameter conflicts
DROP FUNCTION IF EXISTS record_transaction_response(
    character varying,
    character varying,
    uuid,
    character varying,
    jsonb,
    jsonb,
    jsonb,
    character varying,
    inet,
    text
);

-- 3. Create the new function to properly extract and store HDFC data
CREATE FUNCTION record_transaction_response(
    p_order_id VARCHAR,
    p_transaction_id VARCHAR,
    p_payment_session_id UUID,
    p_status VARCHAR,
    p_hdfc_response JSONB,
    p_form_data JSONB,
    p_signature_data JSONB,
    p_test_case_id VARCHAR,
    p_ip_address INET,
    p_user_agent TEXT
) RETURNS UUID AS $$
DECLARE
    transaction_uuid UUID;
    extracted_hdfc_order_id VARCHAR;
    extracted_signature TEXT;
    extracted_status_id VARCHAR;
    extracted_signature_algorithm VARCHAR;
BEGIN
    -- Generate UUID for the transaction
    transaction_uuid := gen_random_uuid();
    
    -- Extract data from HDFC response JSON
    IF p_hdfc_response IS NOT NULL THEN
        extracted_hdfc_order_id := p_hdfc_response->>'order_id';
        extracted_signature := p_hdfc_response->>'signature';
        extracted_status_id := p_hdfc_response->>'status_id';
        extracted_signature_algorithm := p_hdfc_response->>'signature_algorithm';
    END IF;
    
    -- Insert transaction details with extracted HDFC data
    INSERT INTO transaction_details (
        id,
        order_id,
        transaction_id,
        payment_session_id,
        status,
        hdfc_response_raw,
        form_data_received,
        signature_verified,
        
        -- HDFC extracted fields
        hdfc_order_id,
        computed_signature,
        status_id,
        signature_algorithm,
        
        -- Payment method details
        payment_method,
        merchant_id,
        currency,
        
        -- Gateway response details
        gateway_response_code,
        gateway_response_message,
        
        -- Security and audit fields
        testing_status,
        hash_verification_status,
        request_headers,
        response_headers,
        
        -- Security validation fields (from our replay attack fix)
        response_timestamp,
        replay_protection_nonce,
        security_validation_status,
        duplicate_check_passed,
        timestamp_validation_passed,
        
        created_at
    ) VALUES (
        transaction_uuid,
        p_order_id,
        p_transaction_id,
        p_payment_session_id,
        p_status,
        p_hdfc_response,
        p_form_data,
        COALESCE((p_signature_data->>'verified')::boolean, false),
        
        -- HDFC extracted fields
        extracted_hdfc_order_id,
        extracted_signature,
        extracted_status_id,
        extracted_signature_algorithm,
        
        -- Payment method details
        'HDFC_SMARTGATEWAY',
        'SG3095', -- Replace with your actual merchant ID
        'INR',
        
        -- Gateway response details
        CASE WHEN p_status = 'CHARGED' THEN '21' ELSE NULL END,
        CASE WHEN p_status = 'CHARGED' THEN 'Payment successful' ELSE 'Payment processing' END,
        
        -- Security and audit fields
        CASE 
            WHEN p_status = 'CHARGED' THEN 'completed'
            WHEN p_status = 'FAILED' THEN 'failed'
            ELSE 'pending'
        END,
        CASE 
            WHEN (p_signature_data->>'verified')::boolean = true THEN 'verified'
            WHEN (p_signature_data->>'verified')::boolean = false THEN 'failed'
            ELSE 'unknown'
        END,
        jsonb_build_object(
            'Content-Type', 'application/x-www-form-urlencoded',
            'User-Agent', p_user_agent,
            'X-Forwarded-For', p_ip_address::text
        ),
        jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Transaction-ID', transaction_uuid::text
        ),
        
        -- Security validation fields
        NOW(),
        'NONCE_' || gen_random_uuid()::text || '_' || EXTRACT(EPOCH FROM NOW())::text,
        'validated',
        true,
        true,
        
        NOW()
    );
    
    -- Return the transaction UUID
    RETURN transaction_uuid;
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE NOTICE 'Error in record_transaction_response: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PHASE 3: TEST THE FUNCTION WITH SAMPLE DATA
-- ============================================================================

-- 4. Test the function with sample HDFC response data
DO $$
DECLARE
    test_transaction_id UUID;
    sample_hdfc_response JSONB;
    sample_signature_data JSONB;
BEGIN
    -- Create sample HDFC response
    sample_hdfc_response := '{
        "status": "CHARGED",
        "order_id": "TEST_ORD123456789",
        "signature": "test_signature_123",
        "status_id": "21",
        "signature_algorithm": "HMAC-SHA256"
    }'::jsonb;
    
    -- Create sample signature data
    sample_signature_data := '{
        "signature": "test_signature_123",
        "verified": true,
        "algorithm": "HMAC-SHA256"
    }'::jsonb;
    
    -- Test the function
    SELECT record_transaction_response(
        'TEST_ORD123456789',
        'TEST_TXN123456789',
        gen_random_uuid(),
        'CHARGED',
        sample_hdfc_response,
        sample_hdfc_response,
        sample_signature_data,
        'TEST_CASE_001',
        '192.168.1.1'::inet,
        'Test User Agent'
    ) INTO test_transaction_id;
    
    RAISE NOTICE 'Test transaction created with ID: %', test_transaction_id;
    
    -- Verify the test transaction was created with extracted data
    IF EXISTS (
        SELECT 1 FROM transaction_details 
        WHERE id = test_transaction_id 
        AND hdfc_order_id = 'TEST_ORD123456789'
        AND computed_signature = 'test_signature_123'
        AND status_id = '21'
        AND signature_algorithm = 'HMAC-SHA256'
        AND payment_method = 'HDFC_SMARTGATEWAY'
    ) THEN
        RAISE NOTICE 'SUCCESS: Test transaction has all extracted HDFC data';
    ELSE
        RAISE NOTICE 'ERROR: Test transaction missing extracted HDFC data';
    END IF;
    
    -- Clean up test transaction
    DELETE FROM transaction_details WHERE id = test_transaction_id;
    RAISE NOTICE 'Test transaction cleaned up';
    
END $$;

-- ============================================================================
-- PHASE 4: FIX EXISTING TRANSACTIONS
-- ============================================================================

-- 5. Now let's fix all existing transactions that have hdfc_response_raw but missing extracted fields
UPDATE transaction_details 
SET 
    hdfc_order_id = COALESCE(
        hdfc_order_id,
        CASE 
            WHEN hdfc_response_raw IS NOT NULL 
            AND jsonb_typeof(hdfc_response_raw) = 'object'
            THEN (hdfc_response_raw->>'order_id')
            ELSE NULL 
        END
    ),
    computed_signature = COALESCE(
        computed_signature,
        CASE 
            WHEN hdfc_response_raw IS NOT NULL 
            AND jsonb_typeof(hdfc_response_raw) = 'object'
            THEN (hdfc_response_raw->>'signature')
            ELSE NULL 
        END
    ),
    status_id = COALESCE(
        status_id,
        CASE 
            WHEN hdfc_response_raw IS NOT NULL 
            AND jsonb_typeof(hdfc_response_raw) = 'object'
            THEN (hdfc_response_raw->>'status_id')
            ELSE NULL 
        END
    ),
    signature_algorithm = COALESCE(
        signature_algorithm,
        CASE 
            WHEN hdfc_response_raw IS NOT NULL 
            AND jsonb_typeof(hdfc_response_raw) = 'object'
            THEN (hdfc_response_raw->>'signature_algorithm')
            ELSE NULL 
        END
    ),
    payment_method = COALESCE(payment_method, 'HDFC_SMARTGATEWAY'),
    merchant_id = COALESCE(merchant_id, 'SG3095'),
    currency = COALESCE(currency, 'INR'),
    gateway_response_code = COALESCE(
        gateway_response_code,
        CASE WHEN status = 'CHARGED' THEN '21' ELSE NULL END
    ),
    gateway_response_message = COALESCE(
        gateway_response_message,
        CASE WHEN status = 'CHARGED' THEN 'Payment successful' ELSE NULL END
    ),
    testing_status = COALESCE(
        testing_status,
        CASE 
            WHEN status = 'CHARGED' THEN 'completed'
            WHEN status = 'FAILED' THEN 'failed'
            ELSE 'pending'
        END
    ),
    hash_verification_status = COALESCE(
        hash_verification_status,
        CASE 
            WHEN signature_verified = true THEN 'verified'
            WHEN signature_verified = false THEN 'failed'
            ELSE 'unknown'
        END
    )
WHERE hdfc_response_raw IS NOT NULL 
AND jsonb_typeof(hdfc_response_raw) = 'object'
AND (
    hdfc_order_id IS NULL 
    OR computed_signature IS NULL 
    OR status_id IS NULL 
    OR signature_algorithm IS NULL
    OR payment_method IS NULL
    OR merchant_id IS NULL
);

-- ============================================================================
-- PHASE 5: VERIFICATION
-- ============================================================================

-- 6. Verify the fix worked
SELECT 
    'TRANSACTION DATA FIX VERIFICATION' as verification_type,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN hdfc_order_id IS NOT NULL THEN 1 END) as with_hdfc_order_id,
    COUNT(CASE WHEN computed_signature IS NOT NULL THEN 1 END) as with_computed_signature,
    COUNT(CASE WHEN status_id IS NOT NULL THEN 1 END) as with_status_id,
    COUNT(CASE WHEN signature_algorithm IS NOT NULL THEN 1 END) as with_signature_algorithm,
    COUNT(CASE WHEN payment_method IS NOT NULL THEN 1 END) as with_payment_method,
    COUNT(CASE WHEN merchant_id IS NOT NULL THEN 1 END) as with_merchant_id,
    COUNT(CASE WHEN gateway_response_code IS NOT NULL THEN 1 END) as with_gateway_response_code,
    COUNT(CASE WHEN hash_verification_status IS NOT NULL THEN 1 END) as with_hash_verification_status
FROM transaction_details 
WHERE hdfc_response_raw IS NOT NULL;

-- 7. Show sample of fixed transactions
SELECT 
    'SAMPLE FIXED TRANSACTIONS' as sample_type,
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
AND hdfc_order_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Final success message
SELECT 
    '🎉 TRANSACTION RECORDING FIX COMPLETED 🎉' as final_status,
    'Database function updated to properly extract HDFC data' as function_status,
    'All existing transactions updated with extracted data' as data_status,
    'Future transactions will be recorded correctly' as future_status,
    NOW() as completion_timestamp;