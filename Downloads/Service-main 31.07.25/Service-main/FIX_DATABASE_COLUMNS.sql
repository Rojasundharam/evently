-- ============================================================================
-- FIX DATABASE COLUMNS - Add missing updated_at column and other issues
-- ============================================================================

-- 1. Add missing updated_at column to payment_sessions
ALTER TABLE payment_sessions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Create trigger for payment_sessions
DROP TRIGGER IF EXISTS update_payment_sessions_updated_at ON payment_sessions;
CREATE TRIGGER update_payment_sessions_updated_at
    BEFORE UPDATE ON payment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Create bank_test_cases table if it doesn't exist (fixing the error from logs)
CREATE TABLE IF NOT EXISTS bank_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id VARCHAR(50) UNIQUE NOT NULL,
    test_scenario VARCHAR(255) NOT NULL,
    test_description TEXT,
    test_amount DECIMAL(12,2),
    test_currency VARCHAR(3) DEFAULT 'INR',
    expected_result VARCHAR(50),
    actual_result VARCHAR(50),
    test_status VARCHAR(20) DEFAULT 'pending',
    error_messages TEXT,
    vulnerabilities_found TEXT,
    executed_by VARCHAR(100),
    execution_date TIMESTAMP WITH TIME ZONE,
    execution_duration INTEGER, -- in milliseconds
    testing_phase VARCHAR(50) DEFAULT 'initial',
    phase_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS for bank_test_cases
ALTER TABLE bank_test_cases ENABLE ROW LEVEL SECURITY;

-- 6. Create policy for bank_test_cases
CREATE POLICY "Service access" ON bank_test_cases FOR ALL USING (true);

-- 7. Insert sample bank test cases
INSERT INTO bank_test_cases (
    test_case_id, test_scenario, test_description, test_amount, expected_result, actual_result, test_status
) VALUES 
('TC001', 'Valid Payment - Small Amount', 'Test successful payment with amount less than 100', 50.00, 'CHARGED', 'CHARGED', 'passed'),
('TC002', 'Valid Payment - Medium Amount', 'Test successful payment with amount between 100-500', 150.00, 'CHARGED', 'CHARGED', 'passed'),
('TC003', 'Invalid Card Test', 'Test payment with invalid card details', 100.00, 'FAILED', 'FAILED', 'passed'),
('TC004', 'Insufficient Funds Test', 'Test payment with insufficient funds', 200.00, 'FAILED', 'FAILED', 'passed'),
('TC005', 'Network Timeout Test', 'Test payment with network timeout simulation', 100.00, 'PENDING', 'PENDING', 'running')
ON CONFLICT (test_case_id) DO NOTHING;

-- 8. Verify the fixes
SELECT 'Database columns fixed!' as status;

-- Check payment_sessions structure
SELECT 'payment_sessions columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_sessions' 
ORDER BY ordinal_position;

-- Check bank_test_cases was created
SELECT 'bank_test_cases created:' as info;
SELECT COUNT(*) as total_test_cases FROM bank_test_cases;

SELECT 'All database issues resolved!' as final_status; 