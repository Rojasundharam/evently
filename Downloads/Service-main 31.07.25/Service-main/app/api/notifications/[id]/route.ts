import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NotificationService } from '@/lib/notifications-service';

// DELETE /api/notifications/[id] - Delete specific notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationId = params.id;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Missing notification ID' },
        { status: 400 }
      );
    }

    // Use the NotificationService to delete notification
    await NotificationService.deleteNotification(notificationId);

    return NextResponse.json({ 
      success: true, 
      message: 'Notification deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
} 