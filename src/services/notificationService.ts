import { supabase } from "@/integrations/supabase/client";

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
  order_id: string | null;
  notification_category?: string;
  priority?: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  notification_category?: string;
  priority?: string;
  metadata?: Record<string, any>;
  order_id?: string;
}

export const notificationService = {
  async getUserNotifications(userId: string, limit: number = 20): Promise<UserNotification[]> {
    const { data, error } = await supabase
      .from('customer_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return (data || []) as UserNotification[];
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('customer_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('customer_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('customer_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  async createNotification(data: CreateNotificationData): Promise<UserNotification> {
    const { data: notification, error } = await supabase
      .from('customer_notifications')
      .insert({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        notification_category: data.notification_category || 'general',
        priority: data.priority || 'normal',
        metadata: data.metadata || null,
        order_id: data.order_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    return notification as UserNotification;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('customer_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, onNotification: (notification: UserNotification) => void) {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNotification(payload.new as UserNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Get notification icon based on type
  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      appointment_reminder: '📅',
      health_alert: '⚠️',
      order_update: '📦',
      order_status: '🚚',
      marketing: '✨',
      health_tip: '💊',
      announcement: '📢',
      general: '🔔',
    };
    return icons[type] || '🔔';
  },

  // Get priority color class
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  },
};
