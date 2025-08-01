import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { NotificationService, type Notification } from '@/lib/notifications-service';
import { supabase } from '@/lib/supabase';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load notifications with throttling
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [notificationsData, unreadCountData] = await Promise.all([
        NotificationService.getNotifications(),
        NotificationService.getUnreadCount()
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.debug('Error loading notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to load notifications');
      
      // Only show error toast for non-database-related errors
      if (error instanceof Error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        toast({
          title: "Error",
          description: "Failed to load notifications. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const updatedCount = await NotificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
      
      if (updatedCount > 0) {
        toast({
          title: "Success",
          description: `Marked ${updatedCount} notifications as read.`,
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    }
  }, [notifications, toast]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const deletedCount = await NotificationService.clearAllNotifications();
      
      setNotifications([]);
      setUnreadCount(0);
      
      if (deletedCount > 0) {
        toast({
          title: "Success",
          description: `Cleared ${deletedCount} notifications.`,
        });
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      toast({
        title: "Error",
        description: "Failed to clear all notifications.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }, [markAsRead]);

  // Set up real-time subscription (disabled to reduce API calls)
  useEffect(() => {
    // Real-time subscriptions disabled for now to reduce database load
    // Will be re-enabled once database tables are properly set up
    return () => {};
  }, []);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Refresh notifications periodically (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if there are no errors and notifications are being used
      if (!error && notifications.length >= 0) {
        loadNotifications();
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes (reduced from 5)

    return () => clearInterval(interval);
  }, [loadNotifications, error, notifications.length]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    handleNotificationClick
  };
}

export default useNotifications; 