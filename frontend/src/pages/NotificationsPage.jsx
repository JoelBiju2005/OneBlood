import React, { useEffect, useState } from 'react';
import useNotificationStore from '../store/notificationStore';
import { Bell, Check, Trash2, MailOpen, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '../store/authStore';

const NotificationsPage = () => {
  const { user } = useAuthStore();
  const { 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    unreadCount
  } = useNotificationStore();
  
  const [filter, setFilter] = useState('all'); // 'all', 'unread'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };
    if (user) {
      load();
    }
  }, [user]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case 'emergency':
      case 'critical':
      case 'request':
        return <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />;
      default:
        return <Bell className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-white py-12 px-4 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/5 blur-[130px] pointer-events-none" />

      <div className="max-w-2xl mx-auto space-y-6 relative z-10 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notification Center</h1>
            <p className="text-xs text-slate-400 mt-1">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${filter === 'all' ? 'bg-red-600 text-white shadow-lg shadow-red-700/10' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${filter === 'unread' ? 'bg-red-600 text-white shadow-lg shadow-red-700/10' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <p className="text-xs text-slate-500">Retrieving alert logs...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-white/5 rounded-full text-slate-500">
              <Bell className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-white">All caught up!</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              No notifications here. Active emergency warnings or matched contact requests will appear in this feed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div 
                key={notif._id}
                onClick={() => !notif.isRead && markAsRead(notif._id)}
                className={`group border rounded-2xl p-4 flex items-start gap-4 transition-all duration-200 cursor-pointer ${notif.isRead ? 'bg-slate-900/20 border-white/5' : 'bg-red-950/10 border-red-500/20 shadow-lg shadow-red-500/5'}`}
              >
                {/* Icon wrapper */}
                <div className={`p-2.5 rounded-xl ${notif.isRead ? 'bg-white/5 text-slate-400' : 'bg-red-500/10'}`}>
                  {getNotifIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1 text-left min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`text-xs font-bold truncate ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[9px] text-slate-500 whitespace-nowrap shrink-0">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed break-words">
                    {notif.message}
                  </p>
                  
                  {/* Action buttons (only show on hover or for unread) */}
                  <div className="flex gap-4 pt-2 text-[10px] text-slate-500 font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif._id);
                        }}
                        className="hover:text-red-400 flex items-center space-x-1"
                      >
                        <MailOpen className="w-3.5 h-3.5" />
                        <span>Mark read</span>
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif._id);
                      }}
                      className="hover:text-red-400 flex items-center space-x-1 ml-auto text-slate-600 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
