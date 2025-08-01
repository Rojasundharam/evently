-- Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'user_action')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read/unread)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Only admins can create notifications for other users
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Add notification preferences table (for future enhancement)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  notification_types JSONB DEFAULT '["info", "success", "warning", "error", "user_action"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for notification preferences updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Function to create notification (can be called from other triggers)
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type VARCHAR(20),
  notification_title VARCHAR(255),
  notification_message TEXT,
  notification_action_url VARCHAR(500) DEFAULT NULL,
  notification_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    metadata
  ) VALUES (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    notification_action_url,
    notification_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET read = TRUE, updated_at = NOW()
  WHERE user_id = target_user_id AND read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = target_user_id AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some sample notifications for testing (optional)
-- These will be created when a user first logs in
INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
SELECT 
  id,
  'info',
  'Welcome to JKKN Service Management',
  'Welcome! You can now submit service requests and track their progress.',
  '/student',
  '{"welcome": true}'::jsonb
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notifications WHERE title = 'Welcome to JKKN Service Management')
ON CONFLICT DO NOTHING;

-- Create view for notification summary
CREATE OR REPLACE VIEW notification_summary AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN read = FALSE THEN 1 END) as unread_count,
  COUNT(CASE WHEN type = 'error' AND read = FALSE THEN 1 END) as unread_errors,
  COUNT(CASE WHEN type = 'warning' AND read = FALSE THEN 1 END) as unread_warnings,
  MAX(created_at) as latest_notification_at
FROM notifications
GROUP BY user_id; 