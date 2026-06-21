import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import Logo from '../shared/Logo';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Bell, User, LogOut, Menu, X, Check, Heart, Shield, Landmark, MessageCircle, Home, ClipboardList, Activity, Sun, Moon, Copy } from 'lucide-react';
import { useTheme } from '../../store/themeContext';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated, oneblood_token, switchRole } = useAuthStore();
  const { notifications, unreadCount, initSocket, disconnectSocket, fetchNotifications, markAsRead, markAllAsRead, socket } = useNotificationStore();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Initialize socket connections on login
  useEffect(() => {
    if (isAuthenticated && user && oneblood_token) {
      initSocket(user.id, oneblood_token);
      fetchNotifications();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, user, oneblood_token]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
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

  const handleRoleToggle = async () => {
    const toastId = toast.loading('Switching perspective...');
    try {
      const updatedUser = await switchRole();
      toast.success(`Switched to ${updatedUser.role === 'donor' ? 'Donor' : 'Seeker'} mode!`, { id: toastId });
      if (updatedUser.role === 'donor') {
        navigate('/home/donor');
      } else {
        navigate('/home/seeker');
      }
    } catch (err) {
      toast.error('Failed to switch perspective.', { id: toastId });
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/auth/login';
    if (user.role === 'donor') return '/dashboard/donor';
    if (user.role === 'blood_bank') return '/dashboard/bank';
    if (user.role === 'hospital') return '/dashboard/hospital';
    if (user.role === 'admin') return '/admin';
    return '/search';
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
      case 'blood_bank': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'hospital': return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
      case 'donor': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default: return 'bg-red-500/20 text-red-400 border border-red-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07070A] text-slate-800 dark:text-white font-sans flex flex-col antialiased selection:bg-[#C0152A] selection:text-white transition-colors duration-300">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#07070A]/70 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.04] shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 transition-transform hover:scale-[1.02] duration-200">
              <Logo width={160} height={40} />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex space-x-8 text-sm font-semibold tracking-wide">
              {user?.role !== 'admin' && (
                <Link 
                  to="/" 
                  className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Home
                </Link>
              )}
              {isAuthenticated && user?.role === 'admin' ? (
                <>
                  <Link 
                    to="/admin-portal" 
                    className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/admin-portal' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Admin Console
                  </Link>
                  <Link 
                    to="/admin" 
                    className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname.startsWith('/admin') && location.pathname !== '/admin-portal' && location.pathname !== '/admin/monitoring' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Admin Panel
                  </Link>
                  <Link 
                    to="/admin/monitoring" 
                    className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/admin/monitoring' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Monitoring
                  </Link>
                </>
              ) : (
                isAuthenticated && (
                  <Link 
                    to="/noticeboard" 
                    className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/noticeboard' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4" />
                      <span>Requests Board</span>
                    </span>
                  </Link>
                )
              )}
              {!isAuthenticated && (
                <Link 
                  to="/how-it-works" 
                  className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/how-it-works' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  How It Works
                </Link>
              )}
              {isAuthenticated && user?.role === 'donor' && (
                <>
                  <Link 
                    to="/donor/find-requests" 
                    className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/donor/find-requests' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Find Requests
                  </Link>
                  <Link 
                    to="/dashboard/donor" 
                    className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/dashboard/donor' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    My Dashboard
                  </Link>
                </>
              )}
              {isAuthenticated && user?.role === 'seeker' && (
                <>
                  <Link 
                    to="/search" 
                    className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/search' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    Search Blood
                  </Link>
                  <Link 
                    to="/home/seeker" 
                    className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/home/seeker' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    My Requests
                  </Link>
                </>
              )}
              {isAuthenticated && user?.role === 'blood_bank' && (
                <Link 
                  to="/dashboard/bank" 
                  className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/dashboard/bank' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  My Dashboard
                </Link>
              )}
              {isAuthenticated && user?.role === 'hospital' && (
                <Link 
                  to="/dashboard/hospital" 
                  className={`transition-all duration-200 hover:text-[#C0152A] ${location.pathname === '/dashboard/hospital' ? 'text-[#C0152A]' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Hospital Dashboard
                </Link>
              )}
            </nav>

            {/* Desktop Auth Controls */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] dark:hover:bg-white/[0.08] dark:hover:border-white/[0.12] transition-all duration-200 cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-slate-300 hover:text-white" /> : <Moon className="w-5 h-5 text-slate-600 hover:text-slate-800" />}
              </button>
              {isAuthenticated ? (
                <>
                  {/* Role Toggle Switch */}
                  {(user?.role === 'donor' || user?.role === 'seeker') && (
                     <div 
                      onClick={handleRoleToggle}
                      className="relative border rounded-full p-1 flex items-center h-9 w-32 cursor-pointer select-none bg-slate-100/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-200 role-toggle-container"
                    >
                      {/* Active sliding background */}
                      <div 
                        className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-[#C0152A] to-[#FF4D6A] transition-all duration-300 ease-out shadow-sm shadow-[#C0152A]/25"
                        style={{
                          left: user.role === 'seeker' ? '4px' : 'calc(50% + 0px)',
                          width: 'calc(50% - 4px)',
                        }}
                      />
                      
                      {/* Seeker Option */}
                      <span className={`relative z-10 w-1/2 text-[10px] font-bold text-center transition-colors duration-300 ${
                        user.role === 'seeker' ? 'role-toggle-active' : 'role-toggle-inactive'
                      }`}>
                        Seeker
                      </span>

                      {/* Donor Option */}
                      <span className={`relative z-10 w-1/2 text-[10px] font-bold text-center transition-colors duration-300 ${
                        user.role === 'donor' ? 'role-toggle-active' : 'role-toggle-inactive'
                      }`}>
                        Donor
                      </span>
                    </div>
                  )}

                  {/* Notifications Panel */}
                  <div className="relative" ref={notifRef}>
                    <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="p-2.5 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] dark:hover:bg-white/[0.08] transition-all duration-200 relative group"
                    >
                      <Bell className="w-5 h-5 text-slate-500 dark:text-slate-300 group-hover:text-[#C0152A] transition-colors" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#C0152A] rounded-full flex items-center justify-center text-[9px] font-bold animate-pulse text-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {isNotifOpen && (
                      <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#0F0F1A] border border-slate-200 dark:border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden z-50 transition-all duration-300">
                        <div className="p-4 border-b border-slate-100 dark:border-white/[0.05] flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                          <span className="font-semibold text-sm text-slate-800 dark:text-white">Notifications</span>
                          {unreadCount > 0 && (
                            <button 
                              onClick={markAllAsRead}
                              className="text-xs text-[#C0152A] hover:underline flex items-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark all read</span>
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.03]">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs">
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div 
                                key={notif._id}
                                className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer relative ${!notif.isRead ? 'bg-[#C0152A]/5 dark:bg-[#C0152A]/[0.03]' : ''}`}
                                onClick={() => markAsRead(notif._id)}
                              >
                                {!notif.isRead && (
                                  <span className="absolute top-4 right-4 w-2 h-2 bg-[#C0152A] rounded-full" />
                                )}
                                <p className="text-xs font-semibold text-[#C0152A] dark:text-[#FF4D6A] leading-tight mb-1">
                                  {notif.title}
                                </p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                                  {notif.message}
                                </p>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-2">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </span>
                              </div>
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
                      className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] dark:hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C0152A] to-[#FF4D6A] flex items-center justify-center font-bold text-sm text-white shadow-sm shadow-[#C0152A]/20">
                        {user.name.charAt(0)}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[100px]">{user.name}</p>
                        <p className="text-[9px] text-[#C0152A] font-mono font-bold tracking-wider">{user.onebloodId || user.role.replace('_', ' ')}</p>
                      </div>
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#0F0F1A] border border-slate-200 dark:border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden z-50 p-2">
                        <div className="p-3 border-b border-slate-100 dark:border-white/[0.05] mb-2">
                          <p className="text-xs font-semibold truncate text-slate-800 dark:text-white">{user.name}</p>
                          <span className={`text-[9px] mt-1 inline-block px-2 py-0.5 rounded-full capitalize font-semibold ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                          {user.onebloodId && (
                            <div className="mt-2 flex items-center justify-between bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-[#C0152A]/30 rounded-lg px-2.5 py-1.5">
                              <span className="font-mono text-[11px] font-bold text-[#C0152A] tracking-wider">{user.onebloodId}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(user.onebloodId);
                                  toast.success('OneBlood ID copied!');
                                }}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                                title="Copy ID"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <Link 
                          to="/profile"
                          className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>My Profile</span>
                        </Link>
                        {user?.role !== 'admin' && (
                          <Link 
                            to="/home"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Home className="w-4 h-4 text-slate-400" />
                            <span>Home</span>
                          </Link>
                        )}
                        {user.role === 'seeker' && (
                          <Link 
                            to="/home/seeker"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                            <span>My Requests</span>
                          </Link>
                        )}
                        {user.role === 'donor' && (
                          <Link 
                            to="/dashboard/donor"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                            <span>My Dashboard</span>
                          </Link>
                        )}
                        {user.role === 'blood_bank' && (
                          <Link 
                            to="/dashboard/bank"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                            <span>My Dashboard</span>
                          </Link>
                        )}
                        {user.role === 'hospital' && (
                          <Link 
                            to="/dashboard/hospital"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                            <span>Hospital Dashboard</span>
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link 
                            to="/admin"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        <Link 
                          to="/notifications"
                          className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Bell className="w-4 h-4 text-slate-400" />
                          <span>Notifications</span>
                        </Link>
                        {(user.role === 'seeker' || user.role === 'donor' || user.role === 'hospital' || user.role === 'blood_bank') && (
                          <Link 
                            to="/active-donations"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span>Active Donations</span>
                          </Link>
                        )}
                        <button 
                          onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg text-[#C0152A] hover:bg-[#C0152A]/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="relative bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.05] rounded-full p-1 flex items-center h-10 w-44">
                  {/* Sliding active red background */}
                  <div 
                    className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-[#C0152A] to-[#FF4D6A] transition-all duration-300 ease-out shadow-sm"
                    style={{
                      left: location.pathname === '/auth/login' ? '4px' : '88px',
                      width: '84px',
                    }}
                  />
                  
                  {/* Login link */}
                  <Link 
                    to="/auth/login"
                    className={`relative z-10 w-[84px] text-center text-xs font-bold transition-colors duration-300 ${
                      location.pathname === '/auth/login' ? 'keep-white text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Login
                  </Link>

                  {/* Sign Up link */}
                  <Link 
                    to="/auth/signup"
                    className={`relative z-10 w-[84px] text-center text-xs font-bold transition-colors duration-300 ${
                      location.pathname === '/auth/signup' || (location.pathname !== '/auth/login' && location.pathname !== '/auth/signup') ? 'keep-white text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Theme Toggle for Mobile */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#07070A] border-b border-slate-200 dark:border-white/[0.05] px-4 py-4 space-y-3 text-left">
            {user?.role !== 'admin' && (
              <Link 
                to="/" 
                className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-[#C0152A] dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' ? (
              <>
                <Link 
                  to="/admin-portal" 
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Console
                </Link>
                <Link 
                  to="/admin" 
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Panel
                </Link>
                <Link 
                  to="/admin/monitoring" 
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Monitoring
                </Link>
              </>
            ) : (
              isAuthenticated && (
                <Link 
                  to="/noticeboard" 
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4" />
                    <span>Requests Board</span>
                  </span>
                </Link>
              )
            )}
            {!isAuthenticated && (
              <Link 
                to="/how-it-works" 
                className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-[#C0152A] dark:hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
            )}
            {isAuthenticated && user?.role === 'donor' && (
              <>
                <Link 
                  to="/donor/find-requests" 
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Find Requests
                </Link>
                <Link 
                  to="/dashboard/donor" 
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Dashboard
                </Link>
              </>
            )}
            {isAuthenticated && user?.role === 'seeker' && (
              <>
                <Link 
                  to="/search" 
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Search Blood
                </Link>
                <Link 
                  to="/home/seeker" 
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Requests
                </Link>
              </>
            )}
            {isAuthenticated && user?.role === 'blood_bank' && (
              <Link 
                to="/dashboard/bank" 
                className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                My Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'hospital' && (
              <Link 
                to="/dashboard/hospital" 
                className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Hospital Dashboard
              </Link>
            )}
            {isAuthenticated ? (
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/[0.05]">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Account ({user.name})
                </div>
                {/* Mobile Role Toggle Switch */}
                {(user?.role === 'donor' || user?.role === 'seeker') && (
                  <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.03] pb-3">
                    <span className="text-xs font-bold text-slate-400">View Mode</span>
                     <div 
                      onClick={handleRoleToggle}
                      className="relative border rounded-full p-1 flex items-center h-8 w-32 cursor-pointer select-none role-toggle-container"
                    >
                      {/* Active sliding background */}
                      <div 
                        className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-[#C0152A] to-[#FF4D6A] transition-all duration-300 ease-out"
                        style={{
                          left: user.role === 'seeker' ? '4px' : 'calc(50% + 0px)',
                          width: 'calc(50% - 4px)',
                        }}
                      />
                      
                      {/* Seeker Option */}
                      <span className={`relative z-10 w-1/2 text-[10px] font-bold text-center transition-colors duration-300 ${
                        user.role === 'seeker' ? 'role-toggle-active' : 'role-toggle-inactive'
                      }`}>
                        Seeker
                      </span>

                      {/* Donor Option */}
                      <span className={`relative z-10 w-1/2 text-[10px] font-bold text-center transition-colors duration-300 ${
                        user.role === 'donor' ? 'role-toggle-active' : 'role-toggle-inactive'
                      }`}>
                        Donor
                      </span>
                    </div>
                  </div>
                )}
                {user.onebloodId && (
                  <div className="mx-3 mb-1 flex items-center justify-between bg-slate-50 dark:bg-black/30 border border-slate-250 dark:border-[#C0152A]/30 rounded-lg px-2.5 py-1.5">
                    <span className="font-mono text-[11px] font-bold text-[#C0152A] tracking-wider">{user.onebloodId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(user.onebloodId);
                        toast.success('OneBlood ID copied!');
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                      title="Copy ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <Link 
                  to="/profile"
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>
                {user?.role !== 'admin' && (
                  <Link 
                    to="/home"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Home className="w-4 h-4 text-slate-400" />
                    <span>Home</span>
                  </Link>
                )}
                {user.role === 'seeker' && (
                  <Link 
                    to="/home/seeker"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span>My Requests</span>
                  </Link>
                )}
                {user.role === 'donor' && (
                  <Link 
                    to="/dashboard/donor"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span>My Dashboard</span>
                  </Link>
                )}
                {user.role === 'blood_bank' && (
                  <Link 
                    to="/dashboard/bank"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span>My Dashboard</span>
                  </Link>
                )}
                {user.role === 'hospital' && (
                  <Link 
                    to="/dashboard/hospital"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span>Hospital Dashboard</span>
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link 
                    to="/admin"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link 
                  to="/notifications"
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Notifications</span>
                </Link>
                {(user?.role === 'seeker' || user?.role === 'donor' || user?.role === 'hospital' || user?.role === 'blood_bank') && (
                  <Link 
                    to="/active-donations"
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Active Donations</span>
                  </Link>
                )}
                <button 
                  onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm text-[#C0152A] hover:bg-[#C0152A]/10 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link 
                  to="/auth/login"
                  className="text-center px-4 py-2.5 border border-slate-200 dark:border-white/[0.1] rounded-lg text-slate-600 dark:text-slate-350"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/auth/signup"
                  className="text-center px-4 py-2.5 bg-[#C0152A] rounded-lg text-white font-bold"
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
      <footer className="bg-slate-100 dark:bg-[#07070A] border-t border-slate-200 dark:border-white/[0.05] py-12 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 col-span-1 md:col-span-2 text-left">
              <Logo width={140} height={35} />
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                OneBlood is a state-of-the-art real-time blood emergency platform connecting patients, individual donors, and local blood banks instantly.
              </p>
              <div className="flex space-x-3 items-center text-xs text-slate-500 dark:text-slate-400">
                <Shield className="w-4 h-4 text-[#C0152A] dark:text-[#FF4D6A]" />
                <span>AI-verified medical documentation protection</span>
              </div>
            </div>
            
            <div className="text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link to="/search" className="hover:text-[#C0152A] transition-colors">Find Donors & Banks</Link></li>
                <li><Link to="/request/new" className="hover:text-[#C0152A] transition-colors">Request Emergency Blood</Link></li>
                <li><Link to="/how-it-works" className="hover:text-[#C0152A] transition-colors">How It Works</Link></li>
                <li><Link to="/auth/signup" className="hover:text-[#C0152A] transition-colors">Become a Donor</Link></li>
              </ul>
            </div>

            <div className="text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">Contact & Support</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hubballi-Dharwad District,<br />
                Karnataka, India.<br />
                <span className="block mt-2 text-[#C0152A] dark:text-[#FF4D6A] font-bold">Emergency Line: 108 / 1910</span>
              </p>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-white/[0.05] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-400 dark:text-slate-500">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p>&copy; {new Date().getFullYear()} OneBlood. All rights reserved.</p>
              <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-white/[0.02] border border-slate-300/40 dark:border-white/[0.04] px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Vitals Network: Online</span>
                <svg className="w-10 h-3 text-emerald-500 opacity-60 ml-1" viewBox="0 0 40 12" fill="none">
                  <path d="M0 6H15L17.5 1L20.5 11L23 6H40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-pulse" />
                </svg>
              </div>
            </div>
            <p className="flex items-center space-x-1 mt-2 md:mt-0">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-[#C0152A] fill-[#C0152A] animate-pulse" />
              <span>for medical emergency services.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
