# Problem Bank II

A modern problem-solving platform with Google OAuth authentication, real-time discussions, and role-based access control.

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the project root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** If you don't have Supabase set up yet, the app will automatically detect this and run in fallback mode using localStorage.

### 2. Development Server

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- 🔐 **Google OAuth Authentication** - One-click sign-in with Google
- 💬 **Discussion System** - Categorized discussions with real-time updates
- 👥 **Role-based Access Control** - Student, Industry Expert, and Admin roles
- 📊 **Admin Dashboard** - User management and analytics
- 📝 **Problem Submission** - Submit and track problems
- 🏆 **Leaderboard** - Community engagement tracking
- 📱 **Responsive Design** - Works on all devices

## Authentication

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

### Supabase Setup

1. Create a Supabase project
2. Enable Google provider in Authentication
3. Add your Google OAuth credentials
4. Run the SQL scripts in the project:
   - `database-setup.sql` - Basic schema
   - `auth-setup.sql` - Authentication tables
   - `fix-rls-policies.sql` - Security policies

## Troubleshooting

### "Error fetching profile" Issues

This error typically occurs when:
1. Supabase is not configured (environment variables missing)
2. Database tables don't exist yet
3. RLS policies are too restrictive

**Solution:** The app automatically detects these issues and falls back to localStorage mode. To fix permanently:
1. Set up environment variables
2. Run the SQL setup scripts
3. Configure Google OAuth

### Authentication Not Working

1. Check environment variables are set correctly
2. Verify Google OAuth is configured in Supabase
3. Ensure redirect URLs match exactly
4. Check browser console for detailed errors

## File Structure

```
my-app/
├── app/
│   ├── auth/          # Authentication pages
│   ├── admin/         # Admin dashboard
│   ├── discussions/   # Discussion system
│   ├── problems/      # Problem management
│   └── components/    # Reusable components
├── lib/
│   ├── auth.tsx       # Authentication context
│   └── supabase.ts    # Database client
└── *.sql              # Database setup scripts
```
