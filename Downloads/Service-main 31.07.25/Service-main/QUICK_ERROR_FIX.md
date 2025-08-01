# Quick Fix for Service Creation Error

## 🚨 **Most Likely Issue**

You're getting an error when creating a service because the database migration hasn't been run yet. The pricing fields (`amount` and `currency`) don't exist in the services table.

## 🔧 **Quick Fix Steps**

### **Step 1: Check Database Migration Status**
Run this in Supabase SQL Editor:
```sql
-- Copy and run: CHECK_PRICING_MIGRATION.sql
```

If you see **no results** or **Migration Needed**, proceed to Step 2.

### **Step 2: Run Database Migration**
Run this in Supabase SQL Editor:
```sql
-- Copy and run entire content of: ADD_SERVICE_PRICING.sql
```

### **Step 3: Verify Migration Success**
Run the check script again:
```sql
-- Should now show 2 rows: amount and currency columns
-- Should show "Migration Complete" status
```

### **Step 4: Test Service Creation**
1. Go to `/services/new`
2. Fill out the form
3. Set pricing fields:
   - **Payment Method**: Prepaid/Postpaid/Free
   - **Service Fee Amount**: Enter amount (e.g., 150.00)
   - **Currency**: Select currency (default INR)
4. Click "Create Service"

## 🆘 **Alternative Fixes**

### **If Still Getting Errors**:

1. **Authentication Error**: Make sure you're logged in
2. **Duplicate Request Number**: Change the service name
3. **Missing Required Fields**: Fill all required (*) fields
4. **Browser Cache**: Hard refresh (Ctrl+F5)

### **Common Error Messages**:

- `column "amount" does not exist` → Run migration
- `Authentication required` → Log in first  
- `already exists` → Change service name
- `Failed to create service` → Check form validation

## 🎯 **Expected Result After Fix**

Once migration is complete:
- ✅ Service creation works without errors
- ✅ Pricing fields are saved properly
- ✅ Student portal shows dynamic pricing
- ✅ Payment integration uses correct amounts

## 📞 **If Problems Persist**

1. **Check browser console** for detailed error messages
2. **Verify Supabase connection** in network tab
3. **Check user permissions** in Supabase auth
4. **Run migration script again** if needed

**🚀 Most issues are resolved by running the database migration first!** 