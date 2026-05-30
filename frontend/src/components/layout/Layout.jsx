import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import Logo from '../shared/Logo';
import api from '../../utils/api';
import { Bell, User, LogOut, Menu, X, Check, Heart, Shield, Landmark, MessageCircle, Home, ClipboardList } from 'lucide-react';

const Layout = () => {
  const { user, logout, isAuthenticated, oneblood_token } = useAuthStore();
  const { notifications, unreadCount, initSocket, disconnectSocket, fetchNotifications, markAsRead, markAllAsRead, socket } = useNotificationStore();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // V3 Chat Drawer States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [totalUnreadChats, setTotalUnreadChats] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const chatRef = useRef(null);

  const fetchChatRooms = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/chat/rooms');
      const rooms = res.data?.rooms || [];
      setChatRooms(rooms);
      const totalUnread = rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
      setTotalUnreadChats(totalUnread);
    } catch (err) {
      console.error('Failed to fetch chat rooms:', err.message);
    }
  };

  // Initialize socket connections on login
  useEffect(() => {
    if (isAuthenticated && user && oneblood_token) {
      initSocket(user.id, oneblood_token);
      fetchNotifications();
      fetchChatRooms();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, user, oneblood_token]);

  // Periodic poll + socket updates
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchChatRooms, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket) {
      socket.on('chat_notification', fetchChatRooms);
      socket.on('new_message', fetchChatRooms);
    }
    return () => {
      if (socket) {
        socket.off('chat_notification', fetchChatRooms);
        socket.off('new_message', fetchChatRooms);
      }
    };
  }, [socket]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsChatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    disconnectSocket();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/auth/login';
    if (user.role === 'donor') return '/dashboard/donor';
    if (user.role === 'blood_bank') return '/dashboard/bank';
    if (user.role === 'admin') return '/admin';
    return '/search';
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
      case 'blood_bank': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'donor': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default: return 'bg-red-500/20 text-red-400 border border-red-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-oneblood-midnight text-oneblood-white font-sans flex flex-col antialiased selection:bg-oneblood-crimson selection:text-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-oneblood-midnight/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Logo width={160} height={40} />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex space-x-8 text-sm font-medium">
              <Link 
                to="/" 
                className={`transition-colors duration-200 hover:text-oneblood-crimson ${location.pathname === '/' ? 'text-oneblood-crimson' : 'text-slate-300'}`}
              >
                Home
              </Link>
              <Link 
                to="/noticeboard" 
                className={`transition-colors duration-200 hover:text-oneblood-crimson ${location.pathname === '/noticeboard' ? 'text-oneblood-crimson' : 'text-slate-300'}`}
              >
                📋 Notice Board
              </Link>
              {!isAuthenticated && (
                <Link 
                  to="/how-it-works" 
                  className={`transition-colors duration-200 hover:text-oneblood-crimson ${location.pathname === '/how-it-works' ? 'text-oneblood-crimson' : 'text-slate-300'}`}
                >
                  How It Works
                </Link>
              )}
              {isAuthenticated && user?.role === 'donor' && (
                <>
                  <Link 
                    to="/search" 
                    className={`transition-colors duration-200 hover:text-oneblood-crimson ${location.pathname === '/search' ? 'text-oneblood-crimson' : 'text-slate-300'}`}
                  >
                    Find Requests
                  </Link>
                  <Link 
                    to="/dashboard/donor" 
                    className={`transition-colors duration-200 hover:text-oneblood-crimson ${location.pathname === '/dashboard/donor' ? 'text-oneblood-crimson' : 'text-slate-300'}`}
                  >
                    My Dashboard
                  </Link>
                </>
              )}
              {isAuthenticated && user?.role === 'patient' && (
                <>
                  <Link 
                    to="/search" 
                    className={`transition-colors duration-200 hover:text-oneblood-crimson ${location.pathname === '/search' ? 'text-oneblood-crimson' : 'text-slate-300'}`}
                  >
                    Search Blood
                  </Link>
                  <Link 
                    to="/home/seeker" 
                    className={`transition-colors duration-200 hover:text-oneblood-crimson ${location.pathname === '/home/seeker' ? 'text-oneblood-crimson' : 'text-slate-300'}`}
                  >
                    My Requests
                  </Link>
                </>
              )}
              {isAuthenticated && user?.role === 'blood_bank' && (
                <Link 
                  to="/dashboard/bank" 
                  className={`transition-colors duration-200 hover:text-oneblood-crimson ${location.pathname === '/dashboard/bank' ? 'text-oneblood-crimson' : 'text-slate-300'}`}
                >
                  My Dashboard
                </Link>
              )}
              {isAuthenticated && user?.role === 'admin' && (
                <>
                  <Link 
                    to="/admin" 
                    className={`transition-colors duration-200 hover:text-oneblood-crimson ${location.pathname === '/admin' ? 'text-oneblood-crimson' : 'text-slate-300'}`}
                  >
                    Admin Panel
                  </Link>
                  <Link 
                    to="/admin/monitoring" 
                    className={`transition-colors duration-200 hover:text-oneblood-crimson ${location.pathname === '/admin/monitoring' ? 'text-oneblood-crimson' : 'text-slate-300'}`}
                  >
                    Monitoring
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop Auth Controls */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Notifications Panel */}
                  <div className="relative" ref={notifRef}>
                    <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 relative group"
                    >
                      <Bell className="w-5 h-5 text-slate-300 group-hover:text-oneblood-white" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-5 h-5 bg-oneblood-crimson rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse text-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {isNotifOpen && (
                      <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                          <span className="font-semibold text-sm">Notifications</span>
                          {unreadCount > 0 && (
                            <button 
                              onClick={markAllAsRead}
                              className="text-xs text-oneblood-crimson hover:underline flex items-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark all read</span>
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs">
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div 
                                key={notif._id}
                                className={`p-4 transition-colors hover:bg-white/5 cursor-pointer relative ${!notif.isRead ? 'bg-oneblood-crimson/5' : ''}`}
                                onClick={() => markAsRead(notif._id)}
                              >
                                {!notif.isRead && (
                                  <span className="absolute top-4 right-4 w-2 h-2 bg-oneblood-crimson rounded-full" />
                                )}
                                <p className="text-xs font-semibold text-oneblood-gold leading-tight mb-1">
                                  {notif.title}
                                </p>
                                <p className="text-[11px] text-slate-300 leading-snug">
                                  {notif.message}
                                </p>
                                <span className="text-[9px] text-slate-500 block mt-2">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* V3 Chat Drawer Panel */}
                  <div className="relative" ref={chatRef}>
                    <button 
                      onClick={() => setIsChatOpen(!isChatOpen)}
                      className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 relative group"
                    >
                      <MessageCircle className="w-5 h-5 text-slate-300 group-hover:text-oneblood-white" />
                      {totalUnreadChats > 0 && (
                        <span className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse text-white">
                          {totalUnreadChats}
                        </span>
                      )}
                    </button>

                    {/* Chat Rooms Dropdown */}
                    {isChatOpen && (
                      <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="p-4 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                          <span className="font-semibold text-sm text-white">💬 Messages</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                            {chatRooms.length} active
                          </span>
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-white/5 bg-slate-900">
                          {chatRooms.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs italic">
                              No active chats. Complete requests to connect!
                            </div>
                          ) : (
                            chatRooms.map((room) => (
                              <Link
                                key={room.requestId}
                                to={`/chat/${room.requestId}`}
                                onClick={() => setIsChatOpen(false)}
                                className="block p-4 transition-colors hover:bg-white/5 relative text-left"
                              >
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-xs text-white">
                                    {room.otherPartyName}
                                  </span>
                                  {room.bloodGroup && (
                                    <span className="text-[9px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-black border border-red-500/25">
                                      {room.bloodGroup}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-1">
                                  {room.latestMessage ? room.latestMessage.text : 'Opened coordination channel...'}
                                </p>
                                <div className="flex justify-between items-center mt-2 text-[9px] text-slate-500">
                                  <span>
                                    {room.latestMessage ? new Date(room.latestMessage.createdAt).toLocaleDateString() : ''}
                                  </span>
                                  {room.unreadCount > 0 && (
                                    <span className="bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[8px] animate-pulse">
                                      🔴 {room.unreadCount} new
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Menu Dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-oneblood-crimson to-oneblood-gold flex items-center justify-center font-bold text-sm text-white">
                        {user.name.charAt(0)}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-xs font-semibold text-white truncate max-w-[100px]">{user.name}</p>
                        <p className="text-[9px] text-[#C0152A] font-mono font-bold tracking-wider">{user.onebloodId || user.role.replace('_', ' ')}</p>
                      </div>
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 p-2">
                        <div className="p-3 border-b border-white/5 mb-2">
                          <p className="text-xs font-semibold truncate text-white">{user.name}</p>
                          <span className={`text-[9px] mt-1 inline-block px-2 py-0.5 rounded-full capitalize font-semibold ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                          {user.onebloodId && (
                            <div className="mt-2 flex items-center gap-1.5 bg-black/30 border border-[#C0152A]/30 rounded-lg px-2.5 py-1.5">
                              <span className="font-mono text-[11px] font-bold text-[#C0152A] tracking-wider">{user.onebloodId}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(user.onebloodId);
                                }}
                                className="text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Copy ID"
                              >
                                📋
                              </button>
                            </div>
                          )}
                        </div>
                        <Link 
                          to="/profile"
                          className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>My Profile</span>
                        </Link>
                        <Link 
                          to="/home"
                          className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Home className="w-4 h-4 text-slate-400" />
                          <span>Home</span>
                        </Link>
                        {user.role === 'patient' && (
                          <Link 
                            to="/home/seeker"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                            <span>My Requests</span>
                          </Link>
                        )}
                        {user.role === 'donor' && (
                          <Link 
                            to="/dashboard/donor"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                            <span>My Dashboard</span>
                          </Link>
                        )}
                        {user.role === 'blood_bank' && (
                          <Link 
                            to="/dashboard/bank"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                            <span>My Dashboard</span>
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link 
                            to="/admin"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        <Link 
                          to="/notifications"
                          className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-white/5 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Bell className="w-4 h-4 text-slate-400" />
                          <span>Notifications</span>
                        </Link>
                        <button 
                          onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg text-oneblood-crimson hover:bg-oneblood-crimson/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/auth/login"
                    className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/auth/signup"
                    className="text-xs font-bold text-white bg-oneblood-crimson hover:bg-red-700 px-4 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-red-700/30"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-white/5 px-4 py-4 space-y-3 text-left">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/noticeboard" 
              className="block px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              📋 Notice Board
            </Link>
            {!isAuthenticated && (
              <Link 
                to="/how-it-works" 
                className="block px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
            )}
            {isAuthenticated && user?.role === 'donor' && (
              <>
                <Link 
                  to="/search" 
                  className="block px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Find Requests
                </Link>
                <Link 
                  to="/dashboard/donor" 
                  className="block px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Dashboard
                </Link>
              </>
            )}
            {isAuthenticated && user?.role === 'patient' && (
              <>
                <Link 
                  to="/search" 
                  className="block px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Search Blood
                </Link>
                <Link 
                  to="/home/seeker" 
                  className="block px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Requests
                </Link>
              </>
            )}
            {isAuthenticated && user?.role === 'blood_bank' && (
              <Link 
                to="/dashboard/bank" 
                className="block px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                My Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <Link 
                  to="/admin" 
                  className="block px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Panel
                </Link>
                <Link 
                  to="/admin/monitoring" 
                  className="block px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Monitoring
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Account ({user.name})
                </div>
                {user.onebloodId && (
                  <div className="mx-3 mb-1 flex items-center gap-1.5 bg-black/30 border border-[#C0152A]/30 rounded-lg px-2.5 py-1.5">
                    <span className="font-mono text-[11px] font-bold text-[#C0152A] tracking-wider">{user.onebloodId}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(user.onebloodId)}
                      className="text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy ID"
                    >
                      📋
                    </button>
                  </div>
                )}
                <Link 
                  to="/profile"
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>
                <Link 
                  to="/home"
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="w-4 h-4 text-slate-400" />
                  <span>Home</span>
                </Link>
                {user.role === 'patient' && (
                  <Link 
                    to="/home/seeker"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span>My Requests</span>
                  </Link>
                )}
                {user.role === 'donor' && (
                  <Link 
                    to="/dashboard/donor"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span>My Dashboard</span>
                  </Link>
                )}
                {user.role === 'blood_bank' && (
                  <Link 
                    to="/dashboard/bank"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span>My Dashboard</span>
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link 
                    to="/admin"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link 
                  to="/notifications"
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Notifications</span>
                </Link>
                <button 
                  onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-oneblood-crimson hover:bg-oneblood-crimson/10 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link 
                  to="/auth/login"
                  className="text-center px-4 py-2.5 border border-white/10 rounded-lg text-slate-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/auth/signup"
                  className="text-center px-4 py-2.5 bg-oneblood-crimson rounded-lg text-white font-bold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-oneblood-midnight border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 col-span-1 md:col-span-2">
              <Logo width={140} height={35} />
              <p className="text-xs text-slate-400 max-w-sm">
                OneBlood is a state-of-the-art real-time blood emergency platform connecting patients, individual donors, and local blood banks instantly.
              </p>
              <div className="flex space-x-3 items-center text-xs text-slate-400">
                <Shield className="w-4 h-4 text-oneblood-gold" />
                <span>AI-verified medical documentation protection</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/search" className="hover:text-oneblood-crimson">Find Donors & Banks</Link></li>
                <li><Link to="/request/new" className="hover:text-oneblood-crimson">Request Emergency Blood</Link></li>
                <li><Link to="/about" className="hover:text-oneblood-crimson">How It Works</Link></li>
                <li><Link to="/auth/signup" className="hover:text-oneblood-crimson">Become a Donor</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Contact & Support</h3>
              <p className="text-xs text-slate-400">
                Hubballi-Dharwad District,<br />
                Karnataka, India.<br />
                <span className="block mt-2 text-oneblood-crimson font-bold">Emergency Line: 108 / 1910</span>
              </p>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500">
            <p>&copy; {new Date().getFullYear()} OneBlood. All rights reserved.</p>
            <p className="flex items-center space-x-1 mt-2 md:mt-0">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-oneblood-crimson fill-oneblood-crimson" />
              <span>for medical emergency services.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
