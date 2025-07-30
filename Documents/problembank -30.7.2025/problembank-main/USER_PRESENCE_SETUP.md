# Real-Time User Presence System

## Overview
Implemented a real-time user presence tracking system that shows actual online/offline status in the sidebar instead of hardcoded "Online" status.

## Features Implemented

### 1. **Real-Time Presence Tracking**
- Users are automatically marked as "Online" when they visit the app
- Status updates to "Offline" when they close the browser or become inactive
- Real-time updates across all connected users

### 2. **Smart Activity Detection**
- Tracks page visibility (tab switching)
- Heartbeat system (30-second intervals)
- Automatic cleanup of inactive users (5-minute timeout)
- Reliable offline detection using `navigator.sendBeacon`

### 3. **Visual Indicators**
- **Online**: Green dot with pulse animation + "Online" text
- **Offline**: Gray dot + "Offline" text
- Dynamic color changes based on real status

## Files Created/Modified

### **New Files:**
- `lib/hooks/useUserPresence.ts` - Main presence tracking hook
- `app/api/user-presence/route.ts` - API for presence updates
- `app/api/cleanup-presence/route.ts` - Cleanup endpoint for inactive users
- `user-presence-setup.sql` - Database setup script

### **Modified Files:**
- `app/components/layout/EnhancedSidebar.tsx` - Updated to show real presence
- `app/page.tsx` - Added presence tracking to dashboard

## Database Setup

### 1. **Run the SQL Script**
Execute the `user-presence-setup.sql` script in your Supabase SQL editor:

```sql
-- This creates:
-- - user_presence table
-- - Indexes for performance
-- - RLS policies
-- - Cleanup functions
-- - Real-time subscriptions
```

### 2. **Table Structure**
```sql
user_presence (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

## How It Works

### **1. User Goes Online**
- When user logs in or opens the app
- `useUserPresence` hook automatically sets `is_online = true`
- Updates `last_seen` timestamp

### **2. Activity Tracking**
- Heartbeat every 30 seconds updates `last_seen`
- Page visibility changes trigger status updates
- Real-time subscriptions notify all connected users

### **3. User Goes Offline**
- Browser close: `navigator.sendBeacon` API call
- Tab switch: Visibility API detection
- Inactivity: Automatic cleanup after 5 minutes

### **4. Real-Time Updates**
- Supabase real-time subscriptions
- All users see status changes immediately
- No page refresh required

## API Endpoints

### **POST /api/user-presence**
Update user presence status (used by `sendBeacon`)
```json
{
  "userId": "uuid",
  "isOnline": false
}
```

### **POST /api/cleanup-presence**
Clean up inactive users (can be automated with cron)
```json
{
  "success": true,
  "onlineUserCount": 5
}
```

## Usage

### **In Components:**
```tsx
import { useUserPresence } from '@/lib/hooks/useUserPresence'

const MyComponent = () => {
  const { userStatus, onlineUsers, currentUserOnlineCount } = useUserPresence()
  
  return (
    <div>
      <span>Status: {userStatus}</span>
      <span>Online Users: {currentUserOnlineCount}</span>
    </div>
  )
}
```

### **Available Properties:**
- `userStatus`: `'online' | 'offline'` - Current user's status
- `onlineUsers`: Array of all online users with details
- `currentUserOnlineCount`: Number of users currently online
- `updatePresence(isOnline)`: Manual status update function

## Performance Optimizations

### **1. Efficient Queries**
- Indexed queries on user_id, is_online, last_seen
- Optimized real-time subscriptions

### **2. Smart Updates**
- Only updates when status actually changes
- Batched real-time notifications
- Minimal database calls

### **3. Cleanup System**
- Automatic inactive user cleanup
- Configurable timeout periods
- Background maintenance tasks

## Production Considerations

### **1. Automated Cleanup**
Set up a cron job to call the cleanup endpoint:
```bash
# Every 2 minutes
*/2 * * * * curl -X POST https://your-domain.com/api/cleanup-presence
```

### **2. Monitoring**
- Track online user counts
- Monitor presence table size
- Set up alerts for cleanup failures

### **3. Scaling**
- Database connection pooling
- Redis caching for high-traffic scenarios
- CDN for real-time subscriptions

## Security

### **1. RLS Policies**
- Users can only update their own presence
- All users can view presence data (configurable)
- Automatic user_id validation

### **2. Rate Limiting**
- Heartbeat intervals prevent spam
- API endpoint protection
- User authentication required

## Testing

### **1. Online Status**
- Open app → Should show "Online"
- Switch tabs → Status should remain "Online"
- Close browser → Should go "Offline" within 5 minutes

### **2. Real-Time Updates**
- Open two browser windows
- Watch status changes propagate instantly
- Test with multiple users

## Troubleshooting

### **Common Issues:**

1. **Status Not Updating**
   - Check Supabase real-time is enabled
   - Verify RLS policies are correct
   - Check browser console for errors

2. **Users Stuck Online**
   - Run cleanup function manually
   - Check if cleanup cron job is running
   - Verify `last_seen` timestamps

3. **Performance Issues**
   - Check database indexes
   - Monitor real-time subscription load
   - Optimize cleanup frequency

## Next Steps

### **Potential Enhancements:**
- User activity status (typing, viewing, etc.)
- Presence in specific rooms/channels
- Last seen timestamps display
- Online user list component
- Mobile app presence sync 