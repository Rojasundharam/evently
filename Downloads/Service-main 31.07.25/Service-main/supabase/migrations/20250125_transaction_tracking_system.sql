-- ============================================================================
-- HDFC Transaction Tracking System for Bank Testing
-- Created: 2025-01-25
-- Purpose: Store all transaction details required for bank testing process
-- ============================================================================

-- 1. Payment Sessions Table
-- Stores initial payment session creation details
CREATE TABLE IF NOT EXISTS payment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) UNIQUE NOT NULL,
    session_id VARCHAR(100),
    customer_id VARCHAR(50) NOT NULL,
    
    -- Customer Information
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Payment Details
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    description TEXT,
    
    -- HDFC Session Response
    payment_link_web TEXT,
    payment_link_mobile TEXT,
    hdfc_session_response JSONB,
    
    -- Status Tracking
    session_status VARCHAR(20) DEFAULT 'created',
    
    -- Service Request Link
    service_id UUID REFERENCES services(id),
    user_id UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Testing Fields
    test_case_id VARCHAR(50),
    test_scenario VARCHAR(255),
    testing_notes TEXT
);

-- 2. Transaction Details Table
-- Stores complete transaction lifecycle and HDFC responses
CREATE TABLE IF NOT EXISTS transaction_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100),
    
    -- Payment Session Reference
    payment_session_id UUID REFERENCES payment_sessions(id),
    
    -- HDFC Transaction Data
    hdfc_order_id VARCHAR(100),
    hdfc_transaction_id VARCHAR(100),
    bank_ref_no VARCHAR(100),
    payment_method VARCHAR(50),
    
    -- Transaction Status
    status VARCHAR(20) NOT NULL, -- CHARGED, FAILED, PENDING, DECLINED
    status_id VARCHAR(10),
    
    -- Amount Details
    transaction_amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Signature Verification
    received_signature TEXT,
    computed_signature TEXT,
    signature_verified BOOLEAN DEFAULT FALSE,
    signature_algorithm VARCHAR(50),
    
    -- HDFC Raw Response Data
    hdfc_response_raw JSONB,
    form_data_received JSONB,
    
    -- Gateway Information
    gateway_response_code VARCHAR(10),
    gateway_response_message TEXT,
    gateway_reference_number VARCHAR(100),
    
    -- Merchant Information
    merchant_id VARCHAR(50),
    merchant_reference VARCHAR(100),
    
    -- Customer Information
    customer_id VARCHAR(50),
    customer_email VARCHAR(255),
    
    -- Timestamps
    transaction_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Bank Testing Requirements
    test_case_id VARCHAR(50),
    vulnerability_notes TEXT,
    testing_status VARCHAR(20) DEFAULT 'pending',
    hash_verification_status VARCHAR(20),
    
    -- Security Audit Trail
    ip_address INET,
    user_agent TEXT,
    request_headers JSONB,
    response_headers JSONB
);

-- 3. Payment Status History Table
-- Track all status changes for complete audit trail
CREATE TABLE IF NOT EXISTS payment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transaction_details(id),
    order_id VARCHAR(50) NOT NULL,
    
    -- Status Change Details
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    status_change_reason TEXT,
    
    -- HDFC Status Response
    hdfc_status_response JSONB,
    
    -- Change Tracking
    changed_by VARCHAR(50), -- system, user, hdfc_callback, manual_update
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Testing Information
    test_case_reference VARCHAR(50),
    testing_notes TEXT
);

-- 4. Refund Transactions Table
-- Store refund details and tracking
CREATE TABLE IF NOT EXISTS refund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_transaction_id UUID REFERENCES transaction_details(id),
    refund_reference_number VARCHAR(100) UNIQUE NOT NULL,
    
    -- Refund Details
    refund_amount DECIMAL(12,2) NOT NULL,
    refund_reason TEXT,
    refund_type VARCHAR(20), -- full, partial
    
    -- HDFC Refund Response
    hdfc_refund_id VARCHAR(100),
    hdfc_refund_status VARCHAR(20),
    hdfc_refund_response JSONB,
    
    -- Status Tracking
    refund_status VARCHAR(20) DEFAULT 'initiated',
    
    -- Processing Information
    processed_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Testing Fields
    test_refund_case VARCHAR(50),
    testing_notes TEXT
);

-- 5. Security Audit Log Table
-- Track all security-related events and vulnerabilities
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL, -- signature_verification, authentication, authorization, vulnerability
    severity VARCHAR(10) NOT NULL, -- low, medium, high, critical
    
    -- Event Details
    event_description TEXT NOT NULL,
    event_data JSONB,
    
    -- Transaction Reference
    order_id VARCHAR(50),
    transaction_id UUID REFERENCES transaction_details(id),
    
    -- Security Information
    vulnerability_type VARCHAR(100),
    vulnerability_status VARCHAR(20), -- reported, investigating, fixed, verified
    fix_applied TEXT,
    
    -- Request Information
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    
    -- Resolution Tracking
    reported_by VARCHAR(100),
    assigned_to VARCHAR(100),
    resolved_by VARCHAR(100),
    resolution_notes TEXT,
    
    -- Timestamps
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reported_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Testing Information
    test_case_id VARCHAR(50),
    bank_testing_phase VARCHAR(50)
);

-- 6. Test Cases Table
-- Store bank testing scenarios and results
CREATE TABLE IF NOT EXISTS bank_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id VARCHAR(50) UNIQUE NOT NULL,
    test_scenario VARCHAR(255) NOT NULL,
    test_description TEXT,
    
    -- Test Details
    test_amount DECIMAL(12,2),
    test_currency VARCHAR(3) DEFAULT 'INR',
    expected_result VARCHAR(100),
    actual_result VARCHAR(100),
    
    -- Test Status
    test_status VARCHAR(20) DEFAULT 'pending', -- pending, running, passed, failed, blocked
    
    -- Pre-filled Form Data
    test_customer_data JSONB,
    test_credentials JSONB,
    
    -- Results
    test_output JSONB,
    error_messages TEXT,
    vulnerabilities_found TEXT,
    
    -- Execution Information
    executed_by VARCHAR(100),
    execution_date TIMESTAMP WITH TIME ZONE,
    execution_duration INTERVAL,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Bank Testing Phase
    testing_phase VARCHAR(50), -- step1, step2, step3, step4
    phase_notes TEXT
);

-- 7. Hash Verification Table
-- Store hash values and verification results (Step 4 requirement)
CREATE TABLE IF NOT EXISTS hash_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transaction_details(id),
    order_id VARCHAR(50) NOT NULL,
    
    -- Hash Details
    hash_type VARCHAR(50) NOT NULL, -- hmac_sha256, md5, sha1, etc.
    original_data TEXT NOT NULL,
    computed_hash TEXT NOT NULL,
    received_hash TEXT,
    
    -- Verification Results
    hash_verified BOOLEAN DEFAULT FALSE,
    verification_algorithm TEXT,
    verification_steps JSONB,
    
    -- Testing Information
    test_case_reference VARCHAR(50),
    verification_notes TEXT,
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Bank Verification
    bank_hash_request_id VARCHAR(100),
    bank_verification_status VARCHAR(20),
    sign_off_status VARCHAR(20) DEFAULT 'pending'
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Payment Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_payment_sessions_order_id ON payment_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_customer_id ON payment_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON payment_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_test_case ON payment_sessions(test_case_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_created_at ON payment_sessions(created_at);

-- Transaction Details Indexes
CREATE INDEX IF NOT EXISTS idx_transaction_details_order_id ON transaction_details(order_id);
CREATE INDEX IF NOT EXISTS idx_transaction_details_transaction_id ON transaction_details(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_details_status ON transaction_details(status);
CREATE INDEX IF NOT EXISTS idx_transaction_details_hdfc_transaction_id ON transaction_details(hdfc_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_details_test_case ON transaction_details(test_case_id);
CREATE INDEX IF NOT EXISTS idx_transaction_details_created_at ON transaction_details(created_at);

-- Payment Status History Indexes
CREATE INDEX IF NOT EXISTS idx_payment_status_history_transaction_id ON payment_status_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_history_order_id ON payment_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_history_changed_at ON payment_status_history(changed_at);

-- Security Audit Log Indexes
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_severity ON security_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_order_id ON security_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_detected_at ON security_audit_log(detected_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_vulnerability_status ON security_audit_log(vulnerability_status);

-- Test Cases Indexes
CREATE INDEX IF NOT EXISTS idx_bank_test_cases_test_case_id ON bank_test_cases(test_case_id);
CREATE INDEX IF NOT EXISTS idx_bank_test_cases_status ON bank_test_cases(test_status);
CREATE INDEX IF NOT EXISTS idx_bank_test_cases_testing_phase ON bank_test_cases(testing_phase);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hash_verification ENABLE ROW LEVEL SECURITY;

-- Admin users can access everything
CREATE POLICY "Admins can manage all payment sessions" ON payment_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all transaction details" ON transaction_details
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- System/Service role can insert for payment processing
CREATE POLICY "System can insert payment sessions" ON payment_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert transaction details" ON transaction_details
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert status history" ON payment_status_history
    FOR INSERT WITH CHECK (true);

-- Users can view their own transactions
CREATE POLICY "Users can view their own payment sessions" ON payment_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own transaction details" ON transaction_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payment_sessions 
            WHERE payment_sessions.id = transaction_details.payment_session_id 
            AND payment_sessions.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FUNCTIONS FOR TRANSACTION TRACKING
-- ============================================================================

-- Function to create payment session with full tracking
CREATE OR REPLACE FUNCTION create_tracked_payment_session(
    p_order_id VARCHAR,
    p_customer_id VARCHAR,
    p_customer_email VARCHAR,
    p_customer_phone VARCHAR DEFAULT NULL,
    p_first_name VARCHAR DEFAULT NULL,
    p_last_name VARCHAR DEFAULT NULL,
    p_amount DECIMAL DEFAULT NULL,
    p_currency VARCHAR DEFAULT 'INR',
    p_description TEXT DEFAULT NULL,
    p_service_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_test_case_id VARCHAR DEFAULT NULL,
    p_test_scenario VARCHAR DEFAULT NULL
) RETURNS UUID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    session_uuid UUID;
BEGIN
    INSERT INTO payment_sessions (
        order_id, customer_id, customer_email, customer_phone,
        first_name, last_name, amount, currency, description,
        service_id, user_id, test_case_id, test_scenario
    ) VALUES (
        p_order_id, p_customer_id, p_customer_email, p_customer_phone,
        p_first_name, p_last_name, p_amount, p_currency, p_description,
        p_service_id, p_user_id, p_test_case_id, p_test_scenario
    ) RETURNING id INTO session_uuid;
    
    RETURN session_uuid;
END;
$$;

-- Function to record transaction response with full details
CREATE OR REPLACE FUNCTION record_transaction_response(
    p_order_id VARCHAR,
    p_transaction_id VARCHAR DEFAULT NULL,
    p_payment_session_id UUID DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_hdfc_response JSONB DEFAULT NULL,
    p_form_data JSONB DEFAULT NULL,
    p_signature_data JSONB DEFAULT NULL,
    p_test_case_id VARCHAR DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    transaction_uuid UUID;
    session_uuid UUID;
BEGIN
    -- Get session ID if not provided
    IF p_payment_session_id IS NULL THEN
        SELECT id INTO session_uuid FROM payment_sessions WHERE order_id = p_order_id LIMIT 1;
    ELSE
        session_uuid := p_payment_session_id;
    END IF;
    
    INSERT INTO transaction_details (
        order_id, transaction_id, payment_session_id, status,
        hdfc_response_raw, form_data_received, test_case_id,
        ip_address, user_agent,
        received_signature, signature_verified,
        created_at, transaction_date
    ) VALUES (
        p_order_id, p_transaction_id, session_uuid, p_status,
        p_hdfc_response, p_form_data, p_test_case_id,
        p_ip_address, p_user_agent,
        (p_signature_data->>'signature'), 
        COALESCE((p_signature_data->>'verified')::boolean, false),
        NOW(), NOW()
    ) RETURNING id INTO transaction_uuid;
    
    -- Record status change
    INSERT INTO payment_status_history (
        transaction_id, order_id, new_status, changed_by, test_case_reference
    ) VALUES (
        transaction_uuid, p_order_id, p_status, 'hdfc_callback', p_test_case_id
    );
    
    RETURN transaction_uuid;
END;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR,
    p_severity VARCHAR,
    p_description TEXT,
    p_order_id VARCHAR DEFAULT NULL,
    p_vulnerability_type VARCHAR DEFAULT NULL,
    p_event_data JSONB DEFAULT NULL,
    p_test_case_id VARCHAR DEFAULT NULL
) RETURNS UUID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    log_uuid UUID;
BEGIN
    INSERT INTO security_audit_log (
        event_type, severity, event_description, order_id,
        vulnerability_type, event_data, test_case_id, bank_testing_phase
    ) VALUES (
        p_event_type, p_severity, p_description, p_order_id,
        p_vulnerability_type, p_event_data, p_test_case_id, 'bank_testing'
    ) RETURNING id INTO log_uuid;
    
    RETURN log_uuid;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_tracked_payment_session TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_transaction_response TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated, service_role;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample test cases for bank testing
INSERT INTO bank_test_cases (test_case_id, test_scenario, test_description, test_amount, expected_result, testing_phase) VALUES
('TC001', 'Valid Payment - Small Amount', 'Test successful payment with amount INR 10', 10.00, 'CHARGED', 'step1'),
('TC002', 'Valid Payment - Medium Amount', 'Test successful payment with amount INR 100', 100.00, 'CHARGED', 'step1'),
('TC003', 'Valid Payment - Large Amount', 'Test successful payment with amount INR 1000', 1000.00, 'CHARGED', 'step1'),
('TC004', 'Invalid Card Details', 'Test payment with invalid card details', 50.00, 'FAILED', 'step1'),
('TC005', 'Insufficient Funds', 'Test payment with insufficient card balance', 75.00, 'FAILED', 'step1'),
('TC006', 'Signature Verification', 'Test signature verification process', 25.00, 'CHARGED', 'step2'),
('TC007', 'Timeout Scenario', 'Test payment timeout handling', 30.00, 'PENDING', 'step1'),
('TC008', 'Refund Processing', 'Test full refund functionality', 40.00, 'CHARGED', 'step3'),
('TC009', 'Partial Refund', 'Test partial refund functionality', 60.00, 'CHARGED', 'step3'),
('TC010', 'Hash Verification', 'Test hash value generation and verification', 15.00, 'CHARGED', 'step4')
ON CONFLICT (test_case_id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Transaction tracking system created successfully!';
    RAISE NOTICE 'Tables created: payment_sessions, transaction_details, payment_status_history, refund_transactions, security_audit_log, bank_test_cases, hash_verification';
    RAISE NOTICE 'Functions created: create_tracked_payment_session, record_transaction_response, log_security_event';
    RAISE NOTICE 'Sample test cases inserted for bank testing process';
    RAISE NOTICE 'Database is ready for HDFC bank testing with complete audit trail';
END $$; 