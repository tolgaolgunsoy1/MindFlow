// src/store/notificationStore.ts

import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  type: 'due_date' | 'collaboration' | 'comment' | 'assignment' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  relatedNodeId?: string;
  relatedMapId?: string;
  actionUrl?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  actions: {
    addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    removeNotification: (notificationId: string) => void;
    clearAll: () => void;
  };
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  actions: {
    addNotification: (notificationData) => {
      const notification: NotificationItem = {
        ...notificationData,
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
      };

      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));

      // Show local notification (would integrate with device notifications)
      console.log('New notification:', notification.title);
    },

    markAsRead: (notificationId) => {
      set((state) => ({
        notifications: state.notifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    },

    markAllAsRead: () => {
      set((state) => ({
        notifications: state.notifications.map(notif => ({ ...notif, read: true })),
        unreadCount: 0,
      }));
    },

    removeNotification: (notificationId) => {
      set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const newNotifications = state.notifications.filter(n => n.id !== notificationId);
        return {
          notifications: newNotifications,
          unreadCount: notification && !notification.read
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    },

    clearAll: () => {
      set({ notifications: [], unreadCount: 0 });
    },
  },
}));

export default useNotificationStore;