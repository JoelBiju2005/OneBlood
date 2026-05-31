import { create } from 'zustand';
import { io } from 'socket.io-client';
import api, { ASSETS_URL } from '../utils/api';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ASSETS_URL;

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,

  initSocket: (userId, token) => {
    // If socket already active, return
    if (get().socket) return;

    if (!userId || !token) return;

    // Connect to WebSocket Server with JWT authentication
    const socket = io(SOCKET_URL, {
      auth: { token },
      query: { userId },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to OneBlood Socket Server');
      socket.emit('register_user', userId);
    });

    // Listen to unified server notifications
    socket.on('notification', (newNotif) => {
      const current = get().notifications;
      set({
        notifications: [newNotif, ...current],
        unreadCount: get().unreadCount + 1,
      });

      // Play subtle chime or trigger hot toast with both title and description message
      toast.success(
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-100 text-xs">{newNotif.title}</span>
          {newNotif.message && <span className="text-[10px] text-slate-300 mt-1 leading-snug">{newNotif.message}</span>}
        </div>,
        {
          duration: 7000,
          icon: '🚨',
          style: {
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px',
            color: '#f8fafc',
            borderRadius: '16px',
          }
        }
      );
    });

    // Listen to real-time donor matches responses
    socket.on('donor_responded', (response) => {
      toast.success(`❤️ Responder match! ${response.responderName} has accepted your request.`, {
        duration: 8000,
        icon: '💖'
      });
    });

    // Listen to inventory changes or low alerts
    socket.on('low_inventory_alert', (data) => {
      toast.error(`⚠️ Low Stock Alert: ${data.bankName} has critical stock levels.`, {
        duration: 7000,
        icon: '📊'
      });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      const { notifications } = res.data;
      const unread = notifications.filter((n) => !n.isRead).length;

      set({
        notifications,
        unreadCount: unread,
      });
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      const updated = get().notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      );
      set({
        notifications: updated,
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
      set({
        notifications: updated,
        unreadCount: 0,
      });
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const filtered = get().notifications.filter((n) => n._id !== id);
      const isUnread = !get().notifications.find((n) => n._id === id)?.isRead;
      
      set({
        notifications: filtered,
        unreadCount: isUnread ? Math.max(0, get().unreadCount - 1) : get().unreadCount,
      });
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
  },
}));

export default useNotificationStore;
