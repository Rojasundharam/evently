# Service Pricing Setup Instructions

## 🚨 **Error Explanation**

You're getting the error `column "amount" of relation "services" does not exist` because:

1. **Database Migration Not Run**: The `ADD_SERVICE_PRICING.sql` script hasn't been executed yet
2. **Missing Admin UI**: The services admin pages didn't have pricing fields

## ✅ **What I've Fixed**

I've already implemented:

1. **✅ SQL Migration**: `ADD_SERVICE_PRICING.sql` (adds amount & currency columns)
2. **✅ Service Creation Form**: Added pricing fields to `/services/new`
3. **✅ Service Edit Form**: Added pricing fields to `/services/edit/[id]`
4. **✅ Service List Display**: Shows payment method and amounts
5. **✅ Student Portal**: Dynamic pricing display and payment integration
6. **✅ TypeScript Types**: Updated Service interface with pricing fields

## 🛠️ **Setup Steps**

### **Step 1: Run Database Migration (CRITICAL)**

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the entire content of `ADD_SERVICE_PRICING.sql`**
4. **Click "Run"**

This will:
- Add `amount` and `currency` columns to services table
- Set default pricing based on payment method
- Add indexes for performance
- Set sample pricing for different service types

### **Step 2: Verify Database Changes**

Run this query in Supabase SQL editor to verify:
```sql
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
```

### **Step 3: Test Admin Interface**

1. **Navigate to**: `/services`
2. **Click "New Service"**
3. **Fill form** including pricing fields:
   - Payment Method: Prepaid/Postpaid/Free
   - Service Fee Amount: Enter amount (e.g., 150.00)
   - Currency: Select currency (default INR)
4. **Save service**

### **Step 4: Test Student Payment Flow**

1. **Navigate to**: `/student`
2. **Select prepaid service**
3. **See dynamic pricing** (no more hardcoded ₹100!)
4. **Click "Proceed to Payment"**
5. **Verify HDFC integration** with correct amount

## 📊 **Default Pricing Structure**

After running the migration, services will have:

- **Free Services**: ₹0.00
- **Prepaid Services**: ₹100.00 (customizable)
- **Postpaid Services**: ₹50.00 (customizable)

**Sample Service Pricing**:
- Certificate Services: ₹150.00
- Transcript Services: ₹200.00
- Application Services: ₹75.00

## 🎯 **Key Features Added**

### **Admin Control**:
- ✅ Set custom pricing per service
- ✅ Multi-currency support (INR, USD, EUR, GBP)
- ✅ Visual payment method indicators
- ✅ Amount validation and formatting

### **Student Experience**:
- ✅ Dynamic pricing display
- ✅ Clear fee information before payment
- ✅ Professional payment form
- ✅ Correct amounts sent to HDFC

### **Payment Integration**:
- ✅ Service-based amounts (no hardcoding)
- ✅ Fallback handling for missing amounts
- ✅ Currency support in payment gateway
- ✅ Amount stored with service requests

## 🔧 **Customizing Pricing**

After migration, update specific service pricing:

```sql
-- Update individual service
UPDATE services 
SET amount = 250.00, currency = 'INR'
WHERE name = 'Premium Certificate';

-- Bulk update by type
UPDATE services 
SET amount = 300.00 
WHERE name ILIKE '%transcript%' AND payment_method = 'prepaid';

-- Set different currencies
UPDATE services 
SET amount = 25.00, currency = 'USD'
WHERE name = 'International Verification';
```

## 🚀 **After Setup**

Once you run the database migration:

1. **✅ No more column errors**
2. **✅ Admin can set custom pricing**
3. **✅ Students see real pricing**
4. **✅ Payments use correct amounts**
5. **✅ Professional pricing management**

## ⚠️ **Important Notes**

- **Run database migration FIRST** before testing
- **Existing services** will get default amounts
- **Free services** automatically set to ₹0.00
- **Paid services** default to ₹100.00 (customizable)
- **Edit existing services** to set custom pricing

## 🎉 **Result**

After setup, you'll have:
- **Dynamic service pricing** instead of hardcoded amounts
- **Professional admin interface** for pricing management
- **Enhanced student experience** with clear pricing
- **Flexible payment system** supporting multiple currencies

**🚀 Run the SQL migration now and your pricing system will be fully functional!** 