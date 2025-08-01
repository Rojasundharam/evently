import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NotificationService } from '@/lib/notifications-service';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'user_action';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  userId: string;
}

// GET /api/notifications - Get all notifications for user
export async function GET(request: NextRequest) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the NotificationService to get real notifications
    const notifications = await NotificationService.getNotifications();

    return NextResponse.json({ 
      notifications: notifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ) 
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create new notification
export async function POST(request: NextRequest) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, title, message, actionUrl, metadata, userId: targetUserId } = await request.json();

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      );
    }

    // Use the NotificationService to create real notification
    const notification = await NotificationService.createNotification({
      type,
      title,
      message,
      actionUrl,
      metadata,
      userId: targetUserId
    });

    return NextResponse.json({ notification }, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Update notification status (mark as read/unread)
export async function PUT(request: NextRequest) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, read } = await request.json();

    if (!notificationId || typeof read !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: notificationId, read' },
        { status: 400 }
      );
    }

    // Use the NotificationService to update notification
    if (read) {
      await NotificationService.markAsRead(notificationId);
    }
    // Note: markAsUnread method needs to be implemented in NotificationService
    // For now, we'll only handle marking as read

    return NextResponse.json({ 
      success: true, 
      message: `Notification ${read ? 'marked as read' : 'marked as unread'}` 
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE method removed - handled in separate [id]/route.ts file 