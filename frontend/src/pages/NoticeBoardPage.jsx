import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import NoticeBoardCard from '../components/shared/NoticeBoardCard';
import toast from 'react-hot-toast';
import { ClipboardList, HeartPulse, AlertCircle, Sparkles } from 'lucide-react';

const URGENCY_ORDER = { critical: 0, urgent: 1, moderate: 2, planned: 3 };
const URGENCY_COLORS = { critical: '#C0152A', urgent: '#f97316', moderate: '#eab308', planned: '#10b981' };

export default function NoticeBoardPage() {
  const { user } = useAuthStore();
  const { socket } = useNotificationStore();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [filters, setFilters] = useState({ bloodGroup: '', urgency: '', city: '' });
  const [loading, setLoading] = useState(true);

  const sortNotices = (arr) =>
    [...arr].sort((a, b) => {
      const diff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
      if (diff !== 0) return diff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.bloodGroup) params.set('bloodGroup', filters.bloodGroup);
      if (filters.urgency) params.set('urgency', filters.urgency);
      if (filters.city) params.set('city', filters.city);
      const { data } = await api.get(`/noticeboard?${params}`);
      setNotices(sortNotices(data));
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [filters]);

  // ── Real-time socket: update notice card when a donor responds ──
  useEffect(() => {
    if (!socket || !user) return;

    const handleNoticeBoardResponse = ({ noticeId, updatedNotice, responder }) => {
      setNotices(prev =>
        sortNotices(
          prev.map(n => (n._id === noticeId ? { ...n, ...updatedNotice } : n))
        )
      );

      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-oneblood-crimson/30 shadow-2xl rounded-2xl p-4 flex items-start space-x-3 backdrop-blur-md`}
          >
            <HeartPulse className="w-5 h-5 text-oneblood-crimson shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Live response received!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="text-oneblood-crimson font-bold">{responder?.name}</span>{' '}
                responded: {responder?.actionLabel}
              </p>
            </div>
          </div>
        ),
        { duration: 6000, position: 'top-right' }
      );
    };

    socket.on('notice_board_response', handleNoticeBoardResponse);
    return () => socket.off('notice_board_response', handleNoticeBoardResponse);
  }, [socket, user]);

  const handleRespond = async (noticeId, action, note = '', referralData = null) => {
    try {
      if (action === 'close') {
        await api.patch(`/noticeboard/${noticeId}/close`);
        toast.success('Notice marked as fulfilled.');
        fetchNotices();
      } else {
        const payload = { action, note };
        if (referralData) {
          payload.referralName = referralData.referralName;
          payload.referralPhone = referralData.referralPhone;
          payload.referralBloodGroup = referralData.referralBloodGroup;
        }
        await api.post(`/noticeboard/${noticeId}/respond`, payload);
        navigate(`/noticeboard/response-confirm`, { state: { action, noticeId } });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to perform action.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07070A] text-left py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[45vw] h-[45vw] rounded-full bg-oneblood-crimson/5 dark:bg-oneblood-crimson/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[35vw] h-[35vw] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200 dark:border-white/5"
        >
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <ClipboardList className="w-9 h-9 text-oneblood-crimson" />
              <span>Requests Board</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-body max-w-xl text-sm md:text-base leading-relaxed">
              Open emergency calls for blood from patients across the platform. Every post is pre-screened and prioritized.
            </p>
          </div>
          {user?.role === 'seeker' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center gap-2 cursor-pointer keep-white"
              onClick={() => navigate('/noticeboard/post')}
            >
              <Sparkles className="w-4 h-4 keep-white" />
              <span>Post Your Need</span>
            </motion.button>
          )}
        </motion.div>

        {/* Filter bar */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/60 dark:bg-slate-900/40 p-5 border border-slate-200 dark:border-white/5 rounded-2xl backdrop-blur-md shadow-sm"
        >
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Blood Group</label>
            <select
              value={filters.bloodGroup}
              onChange={e => setFilters(f => ({ ...f, bloodGroup: e.target.value }))}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white text-xs font-semibold p-3 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
            >
              <option value="">All Blood Groups</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Urgency Level</label>
            <select
              value={filters.urgency}
              onChange={e => setFilters(f => ({ ...f, urgency: e.target.value }))}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white text-xs font-semibold p-3 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
            >
              <option value="">All Urgencies</option>
              <option value="critical">Critical</option>
              <option value="urgent">Urgent</option>
              <option value="moderate">Moderate</option>
              <option value="planned">Planned</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">City</label>
            <input
              placeholder="Filter by city…"
              value={filters.city}
              onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white text-xs font-semibold p-3 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
            />
          </div>
        </motion.div>

        {/* Notices Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="glass-card h-80 animate-pulse bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {notices.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center space-y-4 glass-card p-10 bg-white/40 dark:bg-[#07070A]/30"
                >
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto animate-bounce" />
                  <p className="text-slate-700 dark:text-slate-350 font-bold font-body text-base">No open requests match your active filters.</p>
                  <p className="text-slate-500 text-xs">Verify your search criteria or post a new request from your dashboard.</p>
                </motion.div>
              ) : (
                notices.map((notice, idx) => {
                  const isOwner = !!(
                    user?.id &&
                    notice.seekerId &&
                    String(notice.seekerId) === String(user.id)
                  );
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, delay: idx * 0.05 }}
                      key={notice._id}
                    >
                      <NoticeBoardCard
                        notice={notice}
                        viewerId={user?.id}
                        viewerRole={user?.role}
                        onRespond={handleRespond}
                        urgencyColors={URGENCY_COLORS}
                        isOwner={isOwner}
                      />
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
