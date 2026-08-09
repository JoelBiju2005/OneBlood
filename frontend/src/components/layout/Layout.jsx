import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import Logo from '../shared/Logo';
import toast from 'react-hot-toast';
import { Bell, User, LogOut, Menu, X, Check, Heart, Shield, Phone, ClipboardList, Activity, Copy, Home, ChevronRight } from 'lucide-react';

const Layout = () => {
  const { user, logout, isAuthenticated, oneblood_token, switchRole } = useAuthStore();
  const { notifications, unreadCount, initSocket, disconnectSocket, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

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

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'blood_bank': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'hospital': return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
      case 'donor': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default: return 'bg-ob-red-700/20 text-ob-red-400 border border-ob-red-700/30';
    }
  };

  // Nav items based on role
  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { to: '/', label: 'Home' },
        { to: '/how-it-works', label: 'How It Works' },
        { to: '/search', label: 'Search' },
      ];
    }
    if (user?.role === 'admin') {
      return [
        { to: '/admin-portal', label: 'Console' },
        { to: '/admin', label: 'Panel' },
        { to: '/admin/monitoring', label: 'Monitoring' },
      ];
    }
    const items = [{ to: '/', label: 'Home' }];
    if (user?.role === 'donor') {
      items.push({ to: '/donor/find-requests', label: 'Find Requests' });
      items.push({ to: '/dashboard/donor', label: 'Dashboard' });
    }
    if (user?.role === 'seeker') {
      items.push({ to: '/search', label: 'Search Blood' });
      items.push({ to: '/home/seeker', label: 'My Requests' });
    }
    if (user?.role === 'blood_bank') {
      items.push({ to: '/dashboard/bank', label: 'Dashboard' });
    }
    if (user?.role === 'hospital') {
      items.push({ to: '/dashboard/hospital', label: 'Dashboard' });
    }
    if (user?.role !== 'admin') {
      items.push({ to: '/noticeboard', label: 'Board' });
    }
    return items;
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/admin') return location.pathname.startsWith('/admin') && location.pathname !== '/admin-portal' && location.pathname !== '/admin/monitoring';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-ob-ink text-ob-white font-sans flex flex-col antialiased selection:bg-ob-red-700 selection:text-white">
      {/* ━━━ NAVBAR ━━━ */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[60px] backdrop-blur-xl bg-ob-ink/80 border-b border-ob-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 transition-transform hover:scale-[1.02] duration-200 shrink-0">
              <Logo width={130} height={32} />
            </Link>

            {/* Desktop Navigation — center */}
            <nav className="hidden md:flex items-center space-x-1 mx-auto">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="relative px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200"
                >
                  <span className={isActive(item.to) ? 'text-ob-white' : 'text-ob-muted hover:text-ob-white'}>
                    {item.label}
                  </span>
                  {isActive(item.to) && (
                    <motion.div
                      layoutId="navUnderline"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-ob-red-700 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Controls — right */}
            <div className="hidden md:flex items-center space-x-3 shrink-0">
              <Link to="/donate" className="text-amber-400 hover:text-amber-300 text-sm font-medium transition mr-2 flex items-center">
                <span>Support Us</span>
              </Link>
              {isAuthenticated ? (
                <>
                  {/* Role Toggle */}
                  {(user?.role === 'donor' || user?.role === 'seeker') && (
                    <div 
                      onClick={handleRoleToggle}
                      className="relative border border-ob-glass-border rounded-full p-1 flex items-center h-8 w-[120px] cursor-pointer select-none bg-ob-ink-80 hover:border-ob-ink-20 transition-all duration-200"
                    >
                      <div 
                        className="absolute top-[3px] bottom-[3px] rounded-full bg-gradient-to-r from-ob-red-700 to-ob-red-500 transition-all duration-300 ease-out shadow-sm"
                        style={{
                          left: user.role === 'seeker' ? '3px' : 'calc(50%)',
                          width: 'calc(50% - 3px)',
                        }}
                      />
                      <span className={`relative z-10 w-1/2 text-[10px] font-bold text-center transition-colors duration-300 ${
                        user.role === 'seeker' ? 'text-white' : 'text-ob-muted'
                      }`}>
                        Seeker
                      </span>
                      <span className={`relative z-10 w-1/2 text-[10px] font-bold text-center transition-colors duration-300 ${
                        user.role === 'donor' ? 'text-white' : 'text-ob-muted'
                      }`}>
                        Donor
                      </span>
                    </div>
                  )}

                  {/* Notification Bell */}
                  <div className="relative" ref={notifRef}>
                    <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="p-2 rounded-xl bg-ob-glass border border-ob-glass-border hover:bg-ob-glass-hover transition-all duration-200 relative group cursor-pointer"
                    >
                      <Bell className="w-[18px] h-[18px] text-ob-muted group-hover:text-ob-white transition-colors" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-ob-red-700 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    <AnimatePresence>
                      {isNotifOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-80 bg-ob-ink-90 border border-ob-glass-border backdrop-blur-xl rounded-2xl shadow-float overflow-hidden z-50"
                        >
                          <div className="p-4 border-b border-ob-glass-border flex justify-between items-center">
                            <span className="font-semibold text-sm text-ob-white">Notifications</span>
                            {unreadCount > 0 && (
                              <button 
                                onClick={markAllAsRead}
                                className="text-xs text-ob-red-500 hover:text-ob-red-400 flex items-center space-x-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark all read</span>
                              </button>
                            )}
                          </div>

                          <div className="max-h-72 overflow-y-auto divide-y divide-ob-glass-border">
                            {notifications.length === 0 ? (
                              <div className="p-6 text-center text-ob-muted text-xs">
                                No notifications yet
                              </div>
                            ) : (
                              notifications.map((notif) => (
                                <div 
                                  key={notif._id}
                                  className={`p-4 transition-colors hover:bg-ob-glass-hover cursor-pointer relative ${!notif.isRead ? 'bg-ob-red-700/5' : ''}`}
                                  onClick={() => markAsRead(notif._id)}
                                >
                                  {!notif.isRead && (
                                    <span className="absolute top-4 right-4 w-2 h-2 bg-ob-red-700 rounded-full" />
                                  )}
                                  <p className="text-xs font-semibold text-ob-red-500 leading-tight mb-1">
                                    {notif.title}
                                  </p>
                                  <p className="text-[11px] text-ob-muted leading-snug">
                                    {notif.message}
                                  </p>
                                  <span className="text-[9px] text-ob-ink-20 block mt-2">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile Menu */}
                  <div className="relative" ref={profileRef}>
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-2 px-2 py-1 rounded-xl bg-ob-glass border border-ob-glass-border hover:bg-ob-glass-hover transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-ob-red-700 to-ob-red-400 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-xs font-semibold text-ob-white truncate max-w-[90px]">{user.name}</p>
                        <p className="text-[9px] text-ob-red-500 font-mono font-bold tracking-wider">{user.onebloodId || user.role.replace('_', ' ')}</p>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 bg-ob-ink-90 border border-ob-glass-border backdrop-blur-xl rounded-2xl shadow-float overflow-hidden z-50 p-2"
                        >
                          <div className="p-3 border-b border-ob-glass-border mb-2">
                            <p className="text-xs font-semibold truncate text-ob-white">{user.name}</p>
                            <span className={`text-[9px] mt-1 inline-block px-2 py-0.5 rounded-full capitalize font-semibold ${getRoleBadgeColor(user.role)}`}>
                              {user.role.replace('_', ' ')}
                            </span>
                            {user.onebloodId && (
                              <div className="mt-2 flex items-center justify-between bg-ob-ink/60 border border-ob-red-700/20 rounded-lg px-2.5 py-1.5">
                                <span className="font-mono text-[11px] font-bold text-ob-red-500 tracking-wider">{user.onebloodId}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(user.onebloodId);
                                    toast.success('OneBlood ID copied!');
                                  }}
                                  className="text-ob-muted hover:text-ob-white transition-colors cursor-pointer"
                                  title="Copy ID"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <Link 
                            to="/profile"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-ob-glass-hover transition-colors text-ob-muted hover:text-ob-white"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            <span>My Profile</span>
                          </Link>
                          {user?.role !== 'admin' && (
                            <Link 
                              to="/home"
                              className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-ob-glass-hover transition-colors text-ob-muted hover:text-ob-white"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Home className="w-4 h-4" />
                              <span>Home</span>
                            </Link>
                          )}
                          {user.role === 'seeker' && (
                            <Link 
                              to="/home/seeker"
                              className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-ob-glass-hover transition-colors text-ob-muted hover:text-ob-white"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <ClipboardList className="w-4 h-4" />
                              <span>My Requests</span>
                            </Link>
                          )}
                          {user.role === 'donor' && (
                            <Link 
                              to="/dashboard/donor"
                              className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-ob-glass-hover transition-colors text-ob-muted hover:text-ob-white"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <ClipboardList className="w-4 h-4" />
                              <span>My Dashboard</span>
                            </Link>
                          )}
                          {user.role === 'blood_bank' && (
                            <Link 
                              to="/dashboard/bank"
                              className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-ob-glass-hover transition-colors text-ob-muted hover:text-ob-white"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <ClipboardList className="w-4 h-4" />
                              <span>My Dashboard</span>
                            </Link>
                          )}
                          {user.role === 'hospital' && (
                            <Link 
                              to="/dashboard/hospital"
                              className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-ob-glass-hover transition-colors text-ob-muted hover:text-ob-white"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <ClipboardList className="w-4 h-4" />
                              <span>Hospital Dashboard</span>
                            </Link>
                          )}
                          {user.role === 'admin' && (
                            <Link 
                              to="/admin"
                              className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-ob-glass-hover transition-colors text-ob-muted hover:text-ob-white"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <ClipboardList className="w-4 h-4" />
                              <span>Admin Panel</span>
                            </Link>
                          )}
                          <Link 
                            to="/notifications"
                            className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-ob-glass-hover transition-colors text-ob-muted hover:text-ob-white"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Bell className="w-4 h-4" />
                            <span>Notifications</span>
                          </Link>
                          {(user.role === 'seeker' || user.role === 'donor' || user.role === 'hospital' || user.role === 'blood_bank') && (
                            <Link 
                              to="/active-donations"
                              className="flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg hover:bg-ob-glass-hover transition-colors text-ob-muted hover:text-ob-white"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Activity className="w-4 h-4 text-emerald-400" />
                              <span>Active Donations</span>
                            </Link>
                          )}
                          <button 
                            onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                            className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs rounded-lg text-ob-red-500 hover:bg-ob-red-700/10 transition-colors text-left cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign out</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/auth/login"
                    className="text-sm font-medium text-ob-muted hover:text-ob-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/auth/signup"
                    className="px-5 py-2 rounded-pill text-sm font-semibold bg-ob-red-700 text-white hover:bg-ob-red-600 transition-all duration-200 active:scale-[0.97] shadow-glow-red"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl text-ob-muted hover:text-ob-white hover:bg-ob-glass-hover transition-colors cursor-pointer"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ━━━ MOBILE OVERLAY ━━━ */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Slide-in panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[300px] bg-ob-ink-90 border-l border-ob-glass-border overflow-y-auto md:hidden"
            >
              {/* Close button */}
              <div className="flex items-center justify-between p-4 border-b border-ob-glass-border">
                <Logo width={100} height={24} />
                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-xl hover:bg-ob-glass-hover transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-ob-muted" />
                </button>
              </div>

              {/* Nav links */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
                className="p-4 space-y-1"
              >
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.to}
                    variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                  >
                    <Link
                      to={item.to}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive(item.to) 
                          ? 'bg-ob-red-700/10 text-ob-red-500 border border-ob-red-700/20' 
                          : 'text-ob-muted hover:text-ob-white hover:bg-ob-glass-hover'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Auth section */}
              <div className="p-4 border-t border-ob-glass-border">
                <Link to="/donate" className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm text-amber-400 hover:text-amber-300 hover:bg-ob-glass-hover transition-colors mb-2" onClick={() => setIsMenuOpen(false)}>
                  <span>Support Us</span>
                </Link>
                {isAuthenticated ? (
                  <div className="space-y-2">
                    {/* User info */}
                    <div className="flex items-center space-x-3 px-3 py-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ob-red-700 to-ob-red-400 flex items-center justify-center font-bold text-sm text-white">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ob-white">{user.name}</p>
                        <p className="text-[10px] text-ob-red-500 font-mono font-bold">{user.onebloodId || user.role.replace('_', ' ')}</p>
                      </div>
                    </div>

                    {/* Role toggle */}
                    {(user?.role === 'donor' || user?.role === 'seeker') && (
                      <div className="px-3 pb-3 mb-2 border-b border-ob-glass-border">
                        <div 
                          onClick={handleRoleToggle}
                          className="relative border border-ob-glass-border rounded-full p-1 flex items-center h-9 w-full cursor-pointer select-none bg-ob-ink-80"
                        >
                          <div 
                            className="absolute top-[3px] bottom-[3px] rounded-full bg-gradient-to-r from-ob-red-700 to-ob-red-500 transition-all duration-300 ease-out"
                            style={{
                              left: user.role === 'seeker' ? '3px' : 'calc(50%)',
                              width: 'calc(50% - 3px)',
                            }}
                          />
                          <span className={`relative z-10 w-1/2 text-xs font-bold text-center transition-colors duration-300 ${
                            user.role === 'seeker' ? 'text-white' : 'text-ob-muted'
                          }`}>
                            Seeker
                          </span>
                          <span className={`relative z-10 w-1/2 text-xs font-bold text-center transition-colors duration-300 ${
                            user.role === 'donor' ? 'text-white' : 'text-ob-muted'
                          }`}>
                            Donor
                          </span>
                        </div>
                      </div>
                    )}

                    <Link to="/profile" className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm text-ob-muted hover:text-ob-white hover:bg-ob-glass-hover transition-colors" onClick={() => setIsMenuOpen(false)}>
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link to="/notifications" className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm text-ob-muted hover:text-ob-white hover:bg-ob-glass-hover transition-colors" onClick={() => setIsMenuOpen(false)}>
                      <Bell className="w-4 h-4" />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto w-5 h-5 bg-ob-red-700 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    {(user.role === 'seeker' || user.role === 'donor' || user.role === 'hospital' || user.role === 'blood_bank') && (
                      <Link to="/active-donations" className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm text-ob-muted hover:text-ob-white hover:bg-ob-glass-hover transition-colors" onClick={() => setIsMenuOpen(false)}>
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>Active Donations</span>
                      </Link>
                    )}
                    <button 
                      onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-sm text-ob-red-500 hover:bg-ob-red-700/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link 
                      to="/auth/login"
                      className="block w-full text-center px-4 py-3 border border-ob-glass-border rounded-xl text-sm font-medium text-ob-muted hover:text-ob-white hover:border-ob-ink-20 transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/auth/signup"
                      className="block w-full text-center px-4 py-3 bg-ob-red-700 rounded-xl text-sm font-bold text-white hover:bg-ob-red-600 transition-all active:scale-[0.97]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ━━━ MAIN CONTENT ━━━ */}
      <main className="flex-grow pt-[60px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="bg-ob-ink border-t border-ob-glass-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Logo & tagline */}
            <div className="space-y-4 text-left md:col-span-1">
              <Logo width={120} height={30} />
              <p className="text-xs text-ob-muted max-w-xs leading-relaxed">
                Every second counts. OneBlood connects patients, donors, and blood banks in real-time for life-saving emergency response.
              </p>
              <div className="flex items-center space-x-2 text-xs text-ob-muted">
                <Shield className="w-4 h-4 text-ob-red-700" />
                <span>AI-verified medical documentation</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ob-ink-10 mb-4">Quick Links</h3>
              <ul className="space-y-2.5 text-xs text-ob-muted">
                <li><Link to="/search" className="hover:text-ob-red-500 transition-colors">Find Donors & Banks</Link></li>
                <li><Link to="/request/new" className="hover:text-ob-red-500 transition-colors">Emergency Blood Request</Link></li>
                <li><Link to="/how-it-works" className="hover:text-ob-red-500 transition-colors">How It Works</Link></li>
                <li><Link to="/auth/signup" className="hover:text-ob-red-500 transition-colors">Become a Donor</Link></li>
              </ul>
            </div>

            {/* Emergency Numbers */}
            <div className="text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ob-red-500 mb-4 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                Emergency
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-ob-muted uppercase tracking-wider mb-1">National Ambulance</p>
                  <a href="tel:108" className="text-2xl font-mono font-bold text-ob-white hover:text-ob-red-500 transition-colors">108</a>
                </div>
                <div>
                  <p className="text-[10px] text-ob-muted uppercase tracking-wider mb-1">Emergency Services</p>
                  <a href="tel:112" className="text-2xl font-mono font-bold text-ob-white hover:text-ob-red-500 transition-colors">112</a>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ob-ink-10 mb-4">Contact</h3>
              <p className="text-xs text-ob-muted leading-relaxed">
                Hubballi-Dharwad District,<br />
                Karnataka, India.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-ob-glass-border mt-10 pt-8 flex flex-col md:flex-row justify-between items-center text-[11px] text-ob-ink-20">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p>&copy; {new Date().getFullYear()} OneBlood. All rights reserved.</p>
              <div className="flex items-center gap-1.5 bg-ob-glass border border-ob-glass-border px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] text-ob-muted">Vitals Network: Online</span>
                <svg className="w-10 h-3 text-emerald-500 opacity-60 ml-1" viewBox="0 0 40 12" fill="none">
                  <path d="M0 6H15L17.5 1L20.5 11L23 6H40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-pulse" />
                </svg>
              </div>
            </div>
            <p className="flex items-center space-x-1 mt-3 md:mt-0">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-ob-red-700 fill-ob-red-700 animate-heartbeat" />
              <span>for medical emergency services.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
