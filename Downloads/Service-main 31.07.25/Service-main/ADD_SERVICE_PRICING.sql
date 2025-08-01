-- Add pricing fields to services table
-- This allows services to have dynamic pricing instead of hardcoded amounts

-- Add amount/price column to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';

-- Add comment for clarity
COMMENT ON COLUMN services.amount IS 'Service price/fee amount';
COMMENT ON COLUMN services.currency IS 'Currency code (INR, USD, etc.)';

-- Update existing services to have default amounts based on payment method
UPDATE services 
SET amount = CASE 
  WHEN payment_method = 'free' THEN 0.00
  WHEN payment_method = 'prepaid' THEN 100.00  -- Default amount, can be changed per service
  WHEN payment_method = 'postpaid' THEN 50.00  -- Default amount, can be changed per service
  ELSE 0.00
END
WHERE amount IS NULL OR amount = 0;

-- Create index for pricing queries
CREATE INDEX IF NOT EXISTS idx_services_amount ON services(amount);
CREATE INDEX IF NOT EXISTS idx_services_payment_method ON services(payment_method);

-- Sample pricing updates (you can modify these)
-- Update specific services with their actual pricing

-- Example: Certificate services
UPDATE services 
SET amount = 150.00 
WHERE name ILIKE '%certificate%' AND payment_method = 'prepaid';

-- Example: Transcript services  
UPDATE services 
SET amount = 200.00 
WHERE name ILIKE '%transcript%' AND payment_method = 'prepaid';

-- Example: Application services
UPDATE services 
SET amount = 75.00 
WHERE name ILIKE '%application%' AND payment_method = 'prepaid';

-- Display current pricing for verification
SELECT 
  name,
  payment_method,
  amount,
  currency,
  CASE 
    WHEN payment_method = 'free' THEN 'No payment required'
    ELSE CONCAT(currency, ' ', amount)
  END as display_price
FROM services 
ORDER BY payment_method, amount; 