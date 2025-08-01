# 🔧 Environment Setup Instructions

## Stop API Configuration Prompts

To stop the repeated API configuration prompts, create a `.env.local` file in your project root with the following content:

## Create `.env.local` file

Create a new file called `.env.local` in the `Service-main` directory and add:

```env
# Supabase Configuration (already working)
NEXT_PUBLIC_SUPABASE_URL=https://bljczhlrjjzcsgmgtzcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsamN6aGxyamp6Y3NnbWd0emNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNjgxMzMsImV4cCI6MjA0OTc0NDEzM30.3vCm0sWOhNdPHBhGKAWLwRlMGWNGRhOPQT_jlF-YKJE

# MyJKKN API Configuration - SET THESE TO STOP CONFIGURATION PROMPTS
NEXT_PUBLIC_MYJKKN_API_KEY=jk_demo_12345
NEXT_PUBLIC_MYJKKN_BASE_URL=https://myadmin.jkkn.ac.in/api
NEXT_PUBLIC_MYJKKN_MOCK_MODE=true
NEXT_PUBLIC_MYJKKN_PROXY_MODE=false

# Development Settings
NODE_ENV=development
```

## 📋 Configuration Options

### For Development/Testing (Recommended):
```env
NEXT_PUBLIC_MYJKKN_MOCK_MODE=true
NEXT_PUBLIC_MYJKKN_API_KEY=jk_demo_12345
```
This will use mock data and stop asking for configuration.

### For Production with Real API:
```env
NEXT_PUBLIC_MYJKKN_MOCK_MODE=false
NEXT_PUBLIC_MYJKKN_API_KEY=your_real_api_key_here
NEXT_PUBLIC_MYJKKN_PROXY_MODE=true
```
Replace `your_real_api_key_here` with your actual MyJKKN API key.

## 🚀 Quick Setup Steps

1. **Create the file**:
   ```bash
   # In the Service-main directory
   touch .env.local
   ```

2. **Copy the configuration** from above into the file

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

4. **✅ Done!** No more configuration prompts!

## 🔍 Verification

After setting up the environment variables:
- The settings page should show "Configured via Environment"
- No more repeated configuration prompts
- Mock data will be available immediately
- All MyJKKN modules (Students, Staff, Programs) will work

## 🛠️ Troubleshooting

If you still see configuration prompts:
1. Make sure the `.env.local` file is in the correct directory (`Service-main/.env.local`)
2. Restart the development server completely
3. Check that the environment variables start with `NEXT_PUBLIC_`
4. Verify no syntax errors in the `.env.local` file 