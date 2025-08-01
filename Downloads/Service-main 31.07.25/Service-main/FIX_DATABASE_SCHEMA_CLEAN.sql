-- ============================================================================
-- FIX DATABASE SCHEMA - Clean version with no customer_id references
-- ============================================================================

-- 1. Fix transaction_details table - Add missing columns
DO $$
BEGIN
    -- Add transaction_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'transaction_amount'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN transaction_amount DECIMAL(12,2);
        
        RAISE NOTICE 'Added transaction_amount column to transaction_details table';
    END IF;
    
    -- Add currency column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';
        
        RAISE NOTICE 'Added currency column to transaction_details table';
    END IF;
    
    -- Add hdfc_order_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'hdfc_order_id'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN hdfc_order_id VARCHAR(100);
        
        RAISE NOTICE 'Added hdfc_order_id column to transaction_details table';
    END IF;
    
    -- Add hdfc_transaction_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'hdfc_transaction_id'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN hdfc_transaction_id VARCHAR(100);
        
        RAISE NOTICE 'Added hdfc_transaction_id column to transaction_details table';
    END IF;
    
    -- Add bank_ref_no column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'bank_ref_no'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN bank_ref_no VARCHAR(100);
        
        RAISE NOTICE 'Added bank_ref_no column to transaction_details table';
    END IF;
    
    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN payment_method VARCHAR(50);
        
        RAISE NOTICE 'Added payment_method column to transaction_details table';
    END IF;
    
    -- Add status_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'status_id'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN status_id VARCHAR(10);
        
        RAISE NOTICE 'Added status_id column to transaction_details table';
    END IF;
    
    -- Add computed_signature column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'computed_signature'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN computed_signature TEXT;
        
        RAISE NOTICE 'Added computed_signature column to transaction_details table';
    END IF;
    
    -- Add signature_algorithm column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'signature_algorithm'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN signature_algorithm VARCHAR(50);
        
        RAISE NOTICE 'Added signature_algorithm column to transaction_details table';
    END IF;
    
    -- Add gateway_response_code column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'gateway_response_code'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN gateway_response_code VARCHAR(10);
        
        RAISE NOTICE 'Added gateway_response_code column to transaction_details table';
    END IF;
    
    -- Add gateway_response_message column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'gateway_response_message'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN gateway_response_message TEXT;
        
        RAISE NOTICE 'Added gateway_response_message column to transaction_details table';
    END IF;
    
    -- Add gateway_reference_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'gateway_reference_number'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN gateway_reference_number VARCHAR(100);
        
        RAISE NOTICE 'Added gateway_reference_number column to transaction_details table';
    END IF;
    
    -- Add merchant_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'merchant_id'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN merchant_id VARCHAR(50);
        
        RAISE NOTICE 'Added merchant_id column to transaction_details table';
    END IF;
    
    -- Add merchant_reference column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'merchant_reference'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN merchant_reference VARCHAR(100);
        
        RAISE NOTICE 'Added merchant_reference column to transaction_details table';
    END IF;
    
    -- Add customer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN customer_id VARCHAR(50);
        
        RAISE NOTICE 'Added customer_id column to transaction_details table';
    END IF;
    
    -- Add customer_email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'customer_email'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN customer_email VARCHAR(255);
        
        RAISE NOTICE 'Added customer_email column to transaction_details table';
    END IF;
    
    -- Add vulnerability_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'vulnerability_notes'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN vulnerability_notes TEXT;
        
        RAISE NOTICE 'Added vulnerability_notes column to transaction_details table';
    END IF;
    
    -- Add testing_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'testing_status'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN testing_status VARCHAR(20) DEFAULT 'pending';
        
        RAISE NOTICE 'Added testing_status column to transaction_details table';
    END IF;
    
    -- Add hash_verification_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'hash_verification_status'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN hash_verification_status VARCHAR(20);
        
        RAISE NOTICE 'Added hash_verification_status column to transaction_details table';
    END IF;
    
    -- Add request_headers column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'request_headers'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN request_headers JSONB;
        
        RAISE NOTICE 'Added request_headers column to transaction_details table';
    END IF;
    
    -- Add response_headers column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_details' 
        AND column_name = 'response_headers'
    ) THEN
        ALTER TABLE transaction_details 
        ADD COLUMN response_headers JSONB;
        
        RAISE NOTICE 'Added response_headers column to transaction_details table';
    END IF;
    
END $$;

-- 2. Fix security_audit_log table - Add missing columns
DO $$
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'security_audit_log' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE security_audit_log 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added created_at column to security_audit_log table';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'security_audit_log' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE security_audit_log 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added updated_at column to security_audit_log table';
    END IF;
    
    -- Add bank_testing_phase column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'security_audit_log' 
        AND column_name = 'bank_testing_phase'
    ) THEN
        ALTER TABLE security_audit_log 
        ADD COLUMN bank_testing_phase VARCHAR(50) DEFAULT 'bank_testing';
        
        RAISE NOTICE 'Added bank_testing_phase column to security_audit_log table';
    END IF;
    
END $$;

-- 3. Create bank_test_cases table if it doesn't exist
CREATE TABLE IF NOT EXISTS bank_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id VARCHAR(50) UNIQUE NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_description TEXT,
    test_category VARCHAR(100),
    test_scenario TEXT,
    expected_result TEXT,
    actual_result TEXT,
    test_status VARCHAR(20) DEFAULT 'pending',
    execution_date TIMESTAMP WITH TIME ZONE,
    execution_duration INTERVAL,
    error_messages TEXT,
    vulnerabilities_found TEXT,
    test_output JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Check what columns exist in payment_sessions table
SELECT 
    'Payment Sessions Columns' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'payment_sessions'
ORDER BY ordinal_position;

-- 5. Update existing transaction details with data from payment sessions (SAFE VERSION)
DO $$
BEGIN
    -- Update transaction_amount if amount column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_sessions' AND column_name = 'amount'
    ) THEN
        UPDATE transaction_details 
        SET transaction_amount = ps.amount
        FROM payment_sessions ps
        WHERE transaction_details.order_id = ps.order_id
        AND transaction_details.transaction_amount IS NULL;
        
        RAISE NOTICE 'Updated transaction_amount from payment_sessions.amount';
    END IF;
    
    -- Update currency if currency column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_sessions' AND column_name = 'currency'
    ) THEN
        UPDATE transaction_details 
        SET currency = COALESCE(ps.currency, 'INR')
        FROM payment_sessions ps
        WHERE transaction_details.order_id = ps.order_id
        AND transaction_details.currency IS NULL;
        
        RAISE NOTICE 'Updated currency from payment_sessions.currency';
    END IF;
    
    -- Update customer_email if customer_email column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_sessions' AND column_name = 'customer_email'
    ) THEN
        UPDATE transaction_details 
        SET customer_email = ps.customer_email
        FROM payment_sessions ps
        WHERE transaction_details.order_id = ps.order_id
        AND transaction_details.customer_email IS NULL;
        
        RAISE NOTICE 'Updated customer_email from payment_sessions.customer_email';
    END IF;
    
    -- Set default merchant_id for all transactions
    UPDATE transaction_details 
    SET merchant_id = 'SG3095'
    WHERE merchant_id IS NULL;
    
    RAISE NOTICE 'Set default merchant_id for all transactions';
    
END $$;

-- 6. Update transaction details with HDFC response data
UPDATE transaction_details 
SET 
    hdfc_order_id = order_id,
    hdfc_transaction_id = transaction_id,
    status_id = (hdfc_response_raw->>'status_id'),
    signature_algorithm = (hdfc_response_raw->>'signature_algorithm'),
    gateway_response_code = '21', -- HDFC success code
    gateway_response_message = 'Payment successful',
    payment_method = 'HDFC_SMARTGATEWAY'
WHERE hdfc_response_raw IS NOT NULL
AND hdfc_order_id IS NULL;

-- 7. Verify the fix
SELECT 
    'Schema Fix Verification' as check_type,
    COUNT(*) as total_transaction_details,
    COUNT(CASE WHEN transaction_amount IS NOT NULL THEN 1 END) as with_amount,
    COUNT(CASE WHEN customer_email IS NOT NULL THEN 1 END) as with_email,
    COUNT(CASE WHEN hdfc_order_id IS NOT NULL THEN 1 END) as with_hdfc_data
FROM transaction_details
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- 8. Show all transaction details now
SELECT 
    'All Transaction Details' as info,
    order_id,
    transaction_id,
    status,
    transaction_amount,
    currency,
    customer_email,
    signature_verified,
    created_at
FROM transaction_details 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC; 