import { supabase } from '@/lib/supabase';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'user_action';

// Global flags to prevent multiple simultaneous requests
let isNotificationsFetching = false;
let isUnreadCountFetching = false;
let notificationsCache: Notification[] | null = null;
let unreadCountCache: number | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

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

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  userId?: string; // If not provided, uses current user
}

export class NotificationService {
  /**
   * Check if cache is valid
   */
  private static isCacheValid(): boolean {
    return Date.now() - lastCacheTime < CACHE_DURATION;
  }

  /**
   * Clear cache
   */
  private static clearCache(): void {
    notificationsCache = null;
    unreadCountCache = null;
    lastCacheTime = 0;
  }

  /**
   * Get all notifications for current user
   */
  static async getNotifications(): Promise<Notification[]> {
    // Return cached data if available and valid
    if (notificationsCache && this.isCacheValid()) {
      return notificationsCache;
    }

    // Prevent multiple simultaneous requests
    if (isNotificationsFetching) {
      // Wait for the current request to complete
      while (isNotificationsFetching) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (notificationsCache && this.isCacheValid()) {
        return notificationsCache;
      }
    }

    isNotificationsFetching = true;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        const mockData = this.getMockNotifications();
        notificationsCache = mockData;
        lastCacheTime = Date.now();
        return mockData;
      }

      // Check if table exists first by making a minimal query
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id', { head: true, count: 'exact' })
        .limit(1);

      if (tableCheckError) {
        if (tableCheckError.message.includes('does not exist') || 
            tableCheckError.message.includes('relation') || 
            tableCheckError.code === 'PGRST116') {
          console.debug('Notifications table not found, using mock data');
          const mockData = this.getMockNotifications();
          notificationsCache = mockData;
          lastCacheTime = Date.now();
          return mockData;
        }
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.debug('Error fetching notifications, using mock data:', error.message);
        const mockData = this.getMockNotifications();
        notificationsCache = mockData;
        lastCacheTime = Date.now();
        return mockData;
      }

      const notifications = (data || []).map(notification => ({
        id: notification.id,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        timestamp: new Date(notification.created_at),
        read: notification.read,
        actionUrl: notification.action_url,
        metadata: notification.metadata,
        userId: notification.user_id
      }));

      // Cache the result
      notificationsCache = notifications;
      lastCacheTime = Date.now();

      return notifications;
    } catch (error) {
      const mockData = this.getMockNotifications();
      notificationsCache = mockData;
      lastCacheTime = Date.now();
      return mockData;
    } finally {
      isNotificationsFetching = false;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<number> {
    // Return cached data if available and valid
    if (unreadCountCache !== null && this.isCacheValid()) {
      return unreadCountCache;
    }

    // Prevent multiple simultaneous requests
    if (isUnreadCountFetching) {
      // Wait for the current request to complete
      while (isUnreadCountFetching) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (unreadCountCache !== null && this.isCacheValid()) {
        return unreadCountCache;
      }
    }

    isUnreadCountFetching = true;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        const count = this.getMockNotifications().filter(n => !n.read).length;
        unreadCountCache = count;
        return count;
      }

      // Check if table exists first
      const { error: tableCheckError } = await supabase
        .from('notifications')
        .select('id', { head: true, count: 'exact' })
        .limit(1);

      if (tableCheckError) {
        if (tableCheckError.message.includes('does not exist') || 
            tableCheckError.message.includes('relation') || 
            tableCheckError.code === 'PGRST116') {
          console.debug('Notifications table not found for count, using mock data');
          const count = this.getMockNotifications().filter(n => !n.read).length;
          unreadCountCache = count;
          return count;
        }
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('read', false);

      if (error) {
        const count = this.getMockNotifications().filter(n => !n.read).length;
        unreadCountCache = count;
        return count;
      }

      const unreadCount = count || 0;
      unreadCountCache = unreadCount;
      return unreadCount;
    } catch (error) {
      const count = this.getMockNotifications().filter(n => !n.read).length;
      unreadCountCache = count;
      return count;
    } finally {
      isUnreadCountFetching = false;
    }
  }

  /**
   * Create new notification
   */
  static async createNotification(data: CreateNotificationData): Promise<Notification> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      const targetUserId = data.userId || session.user.id;

      const { data: result, error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: data.type,
          title: data.title,
          message: data.message,
          action_url: data.actionUrl,
          metadata: data.metadata
        })
        .select()
        .single();

      if (error) {
        // Check if it's a table not found error
        if (error.message.includes('does not exist') || error.message.includes('relation') || error.code === 'PGRST116') {
          console.warn('Notifications table not found. Cannot create notification. Please run database migrations.');
          // Return a mock notification
          return {
            id: `mock-${Date.now()}`,
            type: data.type,
            title: data.title,
            message: data.message,
            timestamp: new Date(),
            read: false,
            actionUrl: data.actionUrl,
            metadata: data.metadata,
            userId: targetUserId
          };
        }
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      return {
        id: result.id,
        type: result.type as NotificationType,
        title: result.title,
        message: result.message,
        timestamp: new Date(result.created_at),
        read: result.read,
        actionUrl: result.action_url,
        metadata: result.metadata,
        userId: result.user_id
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', session.user.id); // Ensure user can only update their own notifications

      if (error) {
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<number> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('read', false)
        .select('id');

      if (error) {
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', session.user.id); // Ensure user can only delete their own notifications

      if (error) {
        throw new Error(`Failed to delete notification: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<number> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', session.user.id)
        .select('id');

      if (error) {
        throw new Error(`Failed to clear all notifications: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  static subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void,
    onUpdate: (notification: Notification) => void,
    onDelete: (notificationId: string) => void
  ) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification: Notification = {
            id: payload.new.id,
            type: payload.new.type as NotificationType,
            title: payload.new.title,
            message: payload.new.message,
            timestamp: new Date(payload.new.created_at),
            read: payload.new.read,
            actionUrl: payload.new.action_url,
            metadata: payload.new.metadata,
            userId: payload.new.user_id
          };
          onNotification(notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification: Notification = {
            id: payload.new.id,
            type: payload.new.type as NotificationType,
            title: payload.new.title,
            message: payload.new.message,
            timestamp: new Date(payload.new.created_at),
            read: payload.new.read,
            actionUrl: payload.new.action_url,
            metadata: payload.new.metadata,
            userId: payload.new.user_id
          };
          onUpdate(notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();
  }

  /**
   * Send notification to specific user (admin only)
   */
  static async sendNotificationToUser(
    targetUserId: string,
    data: Omit<CreateNotificationData, 'userId'>
  ): Promise<Notification> {
    return this.createNotification({
      ...data,
      userId: targetUserId
    });
  }

  /**
   * Send notification to all users with specific role (admin only)
   */
  static async sendNotificationToRole(
    role: string,
    data: Omit<CreateNotificationData, 'userId'>
  ): Promise<Notification[]> {
    try {
      // Get all users with the specified role
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          roles!inner (name)
        `)
        .eq('roles.name', role);

      if (error) {
        throw new Error(`Failed to fetch users with role ${role}: ${error.message}`);
      }

      const userIds = userRoles?.map(ur => ur.user_id) || [];
      const notifications: Notification[] = [];

      // Send notification to each user
      for (const userId of userIds) {
        try {
          const notification = await this.createNotification({
            ...data,
            userId
          });
          notifications.push(notification);
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error sending notification to role:', error);
      throw error;
    }
  }

  /**
   * Get mock notifications (fallback)
   */
  private static getMockNotifications(): Notification[] {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'user_action',
        title: 'New User Registration',
        message: 'John Doe has registered as a student',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000),
        read: false,
        actionUrl: '/user-management',
        metadata: { userId: '123', userRole: 'student' },
        userId: 'current-user'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Service Request Pending',
        message: 'Service request #SR-001 requires approval',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000),
        read: false,
        actionUrl: '/service-requests',
        metadata: { requestId: 'SR-001' },
        userId: 'current-user'
      },
      {
        id: '3',
        type: 'success',
        title: 'Service Request Approved',
        message: 'Certificate request has been processed successfully',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        read: true,
        metadata: { requestId: 'SR-002' },
        userId: 'current-user'
      }
    ];
  }

  /**
   * Create system notification for service request events
   */
  static async notifyServiceRequestEvent(
    type: 'created' | 'approved' | 'rejected' | 'completed',
    requestId: string,
    requestType: string,
    userIds: string[]
  ): Promise<void> {
    const notifications = {
      created: {
        type: 'info' as NotificationType,
        title: 'New Service Request',
        message: `${requestType} request #${requestId} has been submitted`,
        actionUrl: `/service-requests/${requestId}`
      },
      approved: {
        type: 'success' as NotificationType,
        title: 'Request Approved',
        message: `Your ${requestType} request #${requestId} has been approved`,
        actionUrl: `/service-requests/${requestId}`
      },
      rejected: {
        type: 'error' as NotificationType,
        title: 'Request Rejected',
        message: `Your ${requestType} request #${requestId} has been rejected`,
        actionUrl: `/service-requests/${requestId}`
      },
      completed: {
        type: 'success' as NotificationType,
        title: 'Request Completed',
        message: `Your ${requestType} request #${requestId} has been completed`,
        actionUrl: `/service-requests/${requestId}`
      }
    };

    const notificationData = notifications[type];

    for (const userId of userIds) {
      try {
        await this.createNotification({
          ...notificationData,
          userId,
          metadata: { requestId, requestType, eventType: type }
        });
      } catch (error) {
        console.error(`Failed to send ${type} notification to user ${userId}:`, error);
      }
    }
  }

  /**
   * Create system notification for user management events
   */
  static async notifyUserEvent(
    type: 'created' | 'role_changed' | 'status_changed',
    targetUserId: string,
    details: Record<string, any>
  ): Promise<void> {
    const notifications = {
      created: {
        type: 'info' as NotificationType,
        title: 'Welcome to JKKN Service Management',
        message: 'Your account has been created. You can now submit service requests and track their progress.',
        actionUrl: '/student'
      },
      role_changed: {
        type: 'info' as NotificationType,
        title: 'Role Updated',
        message: `Your role has been updated to ${details.newRole}`,
        actionUrl: '/profile'
      },
      status_changed: {
        type: details.newStatus === 'active' ? 'success' as NotificationType : 'warning' as NotificationType,
        title: 'Account Status Updated',
        message: `Your account has been ${details.newStatus}`,
        actionUrl: '/profile'
      }
    };

    const notificationData = notifications[type];

    try {
      await this.createNotification({
        ...notificationData,
        userId: targetUserId,
        metadata: { eventType: type, ...details }
      });
    } catch (error) {
      console.error(`Failed to send ${type} notification to user ${targetUserId}:`, error);
    }
  }
}

export default NotificationService; 