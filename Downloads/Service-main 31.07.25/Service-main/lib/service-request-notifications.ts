import { supabase } from '@/lib/supabase';
import { NotificationService } from '@/lib/notifications-service';

export interface ServiceRequestNotificationData {
  requestId: string;
  requestType: string;
  studentId: string;
  staffIds?: string[];
  adminIds?: string[];
  details?: Record<string, any>;
}

export class ServiceRequestNotificationService {
  /**
   * Send notification when a new service request is created
   */
  static async notifyRequestCreated(data: ServiceRequestNotificationData): Promise<void> {
    try {
      // Notify the student that their request was submitted
      await NotificationService.createNotification({
        type: 'info',
        title: 'Service Request Submitted',
        message: `Your ${data.requestType} request has been submitted successfully and is pending review.`,
        actionUrl: `/service-requests/${data.requestId}`,
        userId: data.studentId,
        metadata: {
          requestId: data.requestId,
          eventType: 'created',
          requestType: data.requestType
        }
      });

      // Notify relevant staff members
      if (data.staffIds && data.staffIds.length > 0) {
        for (const staffId of data.staffIds) {
          await NotificationService.createNotification({
            type: 'user_action',
            title: 'New Service Request',
            message: `A new ${data.requestType} request requires your review.`,
            actionUrl: `/service-requests/${data.requestId}`,
            userId: staffId,
            metadata: {
              requestId: data.requestId,
              eventType: 'created',
              requestType: data.requestType,
              studentId: data.studentId
            }
          });
        }
      }

      // Notify admins
      if (data.adminIds && data.adminIds.length > 0) {
        for (const adminId of data.adminIds) {
          await NotificationService.createNotification({
            type: 'user_action',
            title: 'New Service Request',
            message: `A new ${data.requestType} request has been submitted.`,
            actionUrl: `/service-requests/${data.requestId}`,
            userId: adminId,
            metadata: {
              requestId: data.requestId,
              eventType: 'created',
              requestType: data.requestType,
              studentId: data.studentId
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending request created notifications:', error);
    }
  }

  /**
   * Send notification when a service request is approved
   */
  static async notifyRequestApproved(data: ServiceRequestNotificationData): Promise<void> {
    try {
      // Notify the student
      await NotificationService.createNotification({
        type: 'success',
        title: 'Request Approved',
        message: `Great news! Your ${data.requestType} request has been approved and is being processed.`,
        actionUrl: `/service-requests/${data.requestId}`,
        userId: data.studentId,
        metadata: {
          requestId: data.requestId,
          eventType: 'approved',
          requestType: data.requestType
        }
      });

      // Notify relevant staff/admins about the approval
      const notifyIds = [...(data.staffIds || []), ...(data.adminIds || [])];
      for (const userId of notifyIds) {
        await NotificationService.createNotification({
          type: 'info',
          title: 'Request Approved',
          message: `${data.requestType} request #${data.requestId} has been approved.`,
          actionUrl: `/service-requests/${data.requestId}`,
          userId,
          metadata: {
            requestId: data.requestId,
            eventType: 'approved',
            requestType: data.requestType,
            studentId: data.studentId
          }
        });
      }
    } catch (error) {
      console.error('Error sending request approved notifications:', error);
    }
  }

  /**
   * Send notification when a service request is rejected
   */
  static async notifyRequestRejected(data: ServiceRequestNotificationData & { reason?: string }): Promise<void> {
    try {
      // Notify the student
      await NotificationService.createNotification({
        type: 'error',
        title: 'Request Rejected',
        message: `Your ${data.requestType} request has been rejected. ${data.reason ? `Reason: ${data.reason}` : 'Please contact support for more information.'}`,
        actionUrl: `/service-requests/${data.requestId}`,
        userId: data.studentId,
        metadata: {
          requestId: data.requestId,
          eventType: 'rejected',
          requestType: data.requestType,
          reason: data.reason
        }
      });

      // Notify relevant staff/admins about the rejection
      const notifyIds = [...(data.staffIds || []), ...(data.adminIds || [])];
      for (const userId of notifyIds) {
        await NotificationService.createNotification({
          type: 'info',
          title: 'Request Rejected',
          message: `${data.requestType} request #${data.requestId} has been rejected.`,
          actionUrl: `/service-requests/${data.requestId}`,
          userId,
          metadata: {
            requestId: data.requestId,
            eventType: 'rejected',
            requestType: data.requestType,
            studentId: data.studentId,
            reason: data.reason
          }
        });
      }
    } catch (error) {
      console.error('Error sending request rejected notifications:', error);
    }
  }

  /**
   * Send notification when a service request is completed
   */
  static async notifyRequestCompleted(data: ServiceRequestNotificationData): Promise<void> {
    try {
      // Notify the student
      await NotificationService.createNotification({
        type: 'success',
        title: 'Request Completed',
        message: `Your ${data.requestType} request has been completed successfully. You can now download or collect your documents.`,
        actionUrl: `/service-requests/${data.requestId}`,
        userId: data.studentId,
        metadata: {
          requestId: data.requestId,
          eventType: 'completed',
          requestType: data.requestType
        }
      });

      // Notify relevant staff/admins about the completion
      const notifyIds = [...(data.staffIds || []), ...(data.adminIds || [])];
      for (const userId of notifyIds) {
        await NotificationService.createNotification({
          type: 'info',
          title: 'Request Completed',
          message: `${data.requestType} request #${data.requestId} has been completed.`,
          actionUrl: `/service-requests/${data.requestId}`,
          userId,
          metadata: {
            requestId: data.requestId,
            eventType: 'completed',
            requestType: data.requestType,
            studentId: data.studentId
          }
        });
      }
    } catch (error) {
      console.error('Error sending request completed notifications:', error);
    }
  }

  /**
   * Send notification when a service request requires additional information
   */
  static async notifyRequestNeedsInfo(data: ServiceRequestNotificationData & { message: string }): Promise<void> {
    try {
      // Notify the student
      await NotificationService.createNotification({
        type: 'warning',
        title: 'Additional Information Required',
        message: `Your ${data.requestType} request requires additional information: ${data.message}`,
        actionUrl: `/service-requests/${data.requestId}`,
        userId: data.studentId,
        metadata: {
          requestId: data.requestId,
          eventType: 'needs_info',
          requestType: data.requestType,
          additionalMessage: data.message
        }
      });
    } catch (error) {
      console.error('Error sending request needs info notifications:', error);
    }
  }

  /**
   * Get staff and admin IDs for a specific service category
   */
  static async getRelevantStaffForCategory(categoryId: string): Promise<{ staffIds: string[], adminIds: string[] }> {
    try {
      // Get staff members who handle this category
      const { data: staffRoles, error: staffError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          roles!inner (name)
        `)
        .eq('roles.name', 'staff');

      if (staffError) {
        console.error('Error fetching staff:', staffError);
      }

      // Get admin users
      const { data: adminRoles, error: adminError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          roles!inner (name)
        `)
        .eq('roles.name', 'admin');

      if (adminError) {
        console.error('Error fetching admins:', adminError);
      }

      return {
        staffIds: staffRoles?.map(sr => sr.user_id) || [],
        adminIds: adminRoles?.map(ar => ar.user_id) || []
      };
    } catch (error) {
      console.error('Error getting relevant staff for category:', error);
      return { staffIds: [], adminIds: [] };
    }
  }

  /**
   * Auto-trigger notifications based on service request status changes
   */
  static async handleServiceRequestStatusChange(
    requestId: string,
    oldStatus: string,
    newStatus: string,
    requestData: {
      type: string;
      studentId: string;
      categoryId?: string;
      details?: Record<string, any>;
    },
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get relevant staff for this request
      const { staffIds, adminIds } = requestData.categoryId 
        ? await this.getRelevantStaffForCategory(requestData.categoryId)
        : { staffIds: [], adminIds: [] };

      const notificationData: ServiceRequestNotificationData = {
        requestId,
        requestType: requestData.type,
        studentId: requestData.studentId,
        staffIds,
        adminIds,
        details: requestData.details
      };

      // Handle different status transitions
      switch (newStatus) {
        case 'pending':
          if (oldStatus === 'draft' || !oldStatus) {
            await this.notifyRequestCreated(notificationData);
          }
          break;

        case 'approved':
          await this.notifyRequestApproved(notificationData);
          break;

        case 'rejected':
          await this.notifyRequestRejected({
            ...notificationData,
            reason: metadata?.reason
          });
          break;

        case 'completed':
          await this.notifyRequestCompleted(notificationData);
          break;

        case 'needs_info':
          await this.notifyRequestNeedsInfo({
            ...notificationData,
            message: metadata?.message || 'Please provide additional information.'
          });
          break;

        default:
          console.log(`No notification handler for status: ${newStatus}`);
      }
    } catch (error) {
      console.error('Error handling service request status change:', error);
    }
  }

  /**
   * Send bulk notifications to users with specific roles
   */
  static async sendBulkNotificationToRole(
    role: 'admin' | 'staff' | 'student',
    notification: {
      type: 'info' | 'success' | 'warning' | 'error';
      title: string;
      message: string;
      actionUrl?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<number> {
    try {
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
      let sentCount = 0;

      for (const userId of userIds) {
        try {
          await NotificationService.createNotification({
            ...notification,
            userId
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
        }
      }

      return sentCount;
    } catch (error) {
      console.error('Error sending bulk notification to role:', error);
      return 0;
    }
  }

  /**
   * Send system-wide announcement
   */
  static async sendSystemAnnouncement(announcement: {
    title: string;
    message: string;
    actionUrl?: string;
    targetRoles?: ('admin' | 'staff' | 'student')[];
  }): Promise<{ total: number; sent: number }> {
    try {
      const targetRoles = announcement.targetRoles || ['admin', 'staff', 'student'];
      let totalUsers = 0;
      let sentCount = 0;

      for (const role of targetRoles) {
        const sent = await this.sendBulkNotificationToRole(role, {
          type: 'info',
          title: announcement.title,
          message: announcement.message,
          actionUrl: announcement.actionUrl,
          metadata: {
            type: 'system_announcement',
            targetRoles: announcement.targetRoles
          }
        });

        sentCount += sent;
        
        // Count total users for this role
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('roles.name', role);
        
        totalUsers += count || 0;
      }

      return { total: totalUsers, sent: sentCount };
    } catch (error) {
      console.error('Error sending system announcement:', error);
      return { total: 0, sent: 0 };
    }
  }
}

export default ServiceRequestNotificationService; 