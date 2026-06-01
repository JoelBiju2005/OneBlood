import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import NoticeBoardCard from '../components/shared/NoticeBoardCard';
import toast from 'react-hot-toast';

const URGENCY_ORDER = { critical: 0, urgent: 1, moderate: 2, planned: 3 };
const URGENCY_COLORS = { critical: '#dc2626', urgent: '#f97316', moderate: '#eab308', planned: '#22c55e' };

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
      // Live-update the specific notice in the list
      setNotices(prev =>
        sortNotices(
          prev.map(n => (n._id === noticeId ? { ...n, ...updatedNotice } : n))
        )
      );

      // Show toast only to the seeker who owns this notice
      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-slate-900 border border-oneblood-crimson/40 shadow-xl rounded-2xl p-4 flex items-start space-x-3`}
          >
            <span className="text-2xl">🩸</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">New response on your notice!</p>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="text-oneblood-crimson font-semibold">{responder?.name}</span>{' '}
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
    <div className="min-h-screen bg-slate-950 text-left py-12 px-4 sm:px-6 lg:px-8 relative font-sans">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-heading text-white flex items-center gap-3">
              <span>🩸 Requests Board</span>
            </h1>
            <p className="text-slate-400 font-body max-w-xl text-sm md:text-base leading-relaxed">
              Open emergency calls for blood from patients across the platform. Every post is pre-screened and prioritized.
            </p>
          </div>
          {user?.role === 'patient' && (
            <button
              className="px-6 py-3.5 bg-oneblood-crimson hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-red-700/20 hover:shadow-red-700/35 cursor-pointer"
              onClick={() => navigate('/noticeboard/post')}
            >
              + Post Your Need
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/40 p-4 border border-white/5 rounded-2xl backdrop-blur-md">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Blood Group</label>
            <select
              value={filters.bloodGroup}
              onChange={e => setFilters(f => ({ ...f, bloodGroup: e.target.value }))}
              className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
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
              className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
            >
              <option value="">All Urgencies</option>
              <option value="critical">🔴 Critical</option>
              <option value="urgent">🟠 Urgent</option>
              <option value="moderate">🟡 Moderate</option>
              <option value="planned">🟢 Planned</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">City</label>
            <input
              placeholder="Filter by city…"
              value={filters.city}
              onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
              className="bg-slate-950 border border-white/5 text-white text-xs font-semibold p-3 rounded-xl focus:border-oneblood-crimson/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Notices Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(n => (
              <div key={n} className="glass-card h-80 bg-white/5 rounded-2xl border border-white/10"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {notices.length === 0 ? (
              <div className="col-span-full py-16 text-center space-y-4">
                <span className="text-4xl block">📋</span>
                <p className="text-slate-400 font-medium font-body text-base">No open notices match your active filters.</p>
                <p className="text-slate-500 text-xs">Verify your search criteria or post a new request from your dashboard.</p>
              </div>
            ) : (
              notices.map(notice => (
                <NoticeBoardCard
                  key={notice._id}
                  notice={notice}
                  viewerId={user?.id}
                  viewerRole={user?.role}
                  onRespond={handleRespond}
                  urgencyColors={URGENCY_COLORS}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
