import React, { useState, useEffect, useCallback } from 'react';
import api, { ASSETS_URL } from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Activity, CheckCircle, XCircle, Download, Clock, ArrowRight,
  User, Building2, HeartPulse, Loader2, Phone, Mail, FileText,
  ChevronDown, ChevronUp, History, AlertCircle, Landmark, Check
} from 'lucide-react';

const ActiveDonationsPage = () => {
  const { user } = useAuthStore();
  const [activeMatches, setActiveMatches] = useState([]);
  const [historyMatches, setHistoryMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'past'
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get('/donations/matches/in-progress'),
        api.get('/donations/matches/history'),
      ]);
      setActiveMatches(activeRes.data.matches || []);
      setHistoryMatches(historyRes.data.history || []);
    } catch (err) {
      console.error('Failed to fetch donation data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async (matchId) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    setActionLoading(matchId);
    try {
      await api.post(`/donations/matches/${matchId}/cancel`, { cancellationReason: reason });
      toast.success('Match cancelled successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel match');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (matchId) => {
    setActionLoading(matchId);
    try {
      await api.post(`/donations/matches/${matchId}/complete`, {});
      toast.success('Donation marked as completed!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark complete');
    } finally {
      setActionLoading(null);
    }
  };

  const canManage = user?.role === 'hospital' || user?.role === 'blood_bank' || user?.role === 'admin';

  const renderMatchCard = (match, isHistorical = false) => {
    const hospitalName = match.hospitalId?.hospitalName || 'N/A';
    const bloodBankName = match.bloodBankId?.name;
    const hasTransitBank = match.bloodBankId && match.destinationType === 'BloodBankAndHospital';

    const statusConfig = {
      in_progress: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', label: 'In Progress', icon: <Clock className="w-3 h-3" /> },
      completed: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'Completed', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-600 dark:text-red-400', label: 'Cancelled', icon: <XCircle className="w-3 h-3" /> },
    };
    const status = statusConfig[match.status] || statusConfig.in_progress;

    // Calculate progress percentage and active step label
    let progressPercent = 0;
    let progressLabel = '';
    if (match.status === 'completed') {
      progressPercent = 100;
      progressLabel = 'Completed — Donation Received at Hospital';
    } else if (match.status === 'cancelled') {
      progressPercent = 0;
      progressLabel = 'Cancelled';
    } else {
      if (hasTransitBank) {
        if (match.stage === 'at_blood_bank') {
          progressPercent = 25;
          progressLabel = 'Step 1 of 3: At Transit Blood Bank';
        } else if (match.stage === 'at_hospital') {
          progressPercent = 65;
          progressLabel = 'Step 2 of 3: Verified at Blood Bank -> En-Route to Hospital';
        }
      } else {
        progressPercent = 50;
        progressLabel = 'Step 1 of 2: En-Route to Hospital';
      }
    }

    // Role-based action check
    let showCompleteAction = false;
    let completeBtnLabel = 'Complete';
    if (match.status === 'in_progress') {
      if (user?.role === 'admin') {
        showCompleteAction = true;
        completeBtnLabel = match.stage === 'at_blood_bank' ? 'Verify Blood Bank Stage' : 'Verify Donation Received';
      } else if (user?.role === 'blood_bank' && match.stage === 'at_blood_bank') {
        showCompleteAction = true;
        completeBtnLabel = 'Confirm Blood Collection';
      } else if (user?.role === 'hospital' && match.stage === 'at_hospital') {
        showCompleteAction = true;
        completeBtnLabel = 'Confirm Donation Received';
      }
    }

    return (
      <div
        key={match._id}
        className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 space-y-5 transition-all duration-300 ${
          isHistorical
            ? 'border-slate-200 dark:border-white/5 opacity-75 hover:opacity-100 shadow-sm'
            : 'border-slate-200 dark:border-white/5 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5 shadow-md'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-[#C0152A]/10 border border-[#C0152A]/20 text-[#C0152A] dark:text-red-400 px-2.5 py-1 rounded-lg font-black tracking-wider font-mono">
                {match.matchObid}
              </span>
              <span className="text-[9px] bg-slate-105 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-bold uppercase">
                {match.requestType === 'NoticeBoard' ? 'Notice Board' : 'Emergency Request'}
              </span>
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-lg text-xs font-black">
                {match.bloodGroup}
              </span>
              {match.units} Unit(s)
            </h4>
          </div>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 ${status.bg} ${status.border} ${status.text} rounded-full text-[9px] font-bold uppercase border`}>
            {status.icon}
            {status.label}
          </span>
        </div>

        {/* Progress Bar Component */}
        {match.status !== 'cancelled' && (
          <div className="space-y-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-xl p-4 text-left">
            <div className="flex justify-between items-center text-[10px] text-slate-550 dark:text-slate-400">
              <span className="font-bold text-slate-600 dark:text-slate-300">Donation Journey Progress</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 block pt-1">
              📍 Current Stage: <span className="text-slate-900 dark:text-white font-bold">{progressLabel}</span>
            </span>
          </div>
        )}

        {/* People Details */}
        <div className="space-y-3">
          {/* Seeker info */}
          <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-2">
            <span className="text-[9px] font-black uppercase text-red-650 dark:text-red-400 tracking-widest flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span>Blood Seeker</span>
            </span>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{match.seekerId?.name || 'N/A'}</span>
              {match.seekerId?.phone && (
                <a
                  href={`tel:${match.seekerId.phone}`}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold hover:bg-emerald-600/20 transition-all"
                >
                  <Phone className="w-3 h-3" /> Call
                </a>
              )}
            </div>
            {match.seekerId?.email && (
              <a href={`mailto:${match.seekerId.email}`} className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center gap-1">
                <Mail className="w-3 h-3" /> {match.seekerId.email}
              </a>
            )}
          </div>

          {/* Donor info */}
          <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-2">
            <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest flex items-center gap-1.5">
              <HeartPulse className="w-3 h-3" />
              <span>Blood Donor</span>
            </span>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">{match.donorId?.name || 'N/A'}</span>
                {match.donorId?.onebloodId && (
                  <span className="text-[9px] text-[#C0152A] font-mono font-bold">{match.donorId.onebloodId}</span>
                )}
              </div>
              {match.donorId?.phone && (
                <a
                  href={`tel:${match.donorId.phone}`}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/15 border border-blue-500/25 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold hover:bg-blue-600/20 transition-all"
                >
                  <Phone className="w-3 h-3" /> Call
                </a>
              )}
            </div>
            {match.donorId?.email && (
              <a href={`mailto:${match.donorId.email}`} className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center gap-1">
                <Mail className="w-3 h-3" /> {match.donorId.email}
              </a>
            )}
          </div>
        </div>

        {/* Facility Route */}
        <div className="space-y-2">
          <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest flex items-center gap-1.5">
            <Building2 className="w-3 h-3" />
            <span>Facility Route</span>
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {hasTransitBank && (
              <>
                <div className={`border rounded-xl px-3 py-2 flex items-center gap-2 transition-all ${match.bloodBankStatus === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80' : 'bg-purple-500/10 border-purple-500/20'}`}>
                  {match.bloodBankStatus === 'completed' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Landmark className="w-3.5 h-3.5 text-purple-650 dark:text-purple-400" />
                  )}
                  <div>
                    <span className={`text-[9px] font-bold uppercase block ${match.bloodBankStatus === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>
                      {match.bloodBankStatus === 'completed' ? 'Transit Bank Complete' : 'Transit Blood Bank'}
                    </span>
                    <span className="text-xs text-slate-900 dark:text-white font-semibold">{bloodBankName}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
              </>
            )}

            <div className={`border rounded-xl px-3 py-2 flex items-center gap-2 flex-1 min-w-0 transition-all ${match.hospitalStatus === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
              {match.hospitalStatus === 'completed' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Building2 className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              )}
              <div className="min-w-0">
                <span className={`text-[9px] font-bold uppercase block ${match.hospitalStatus === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {match.hospitalStatus === 'completed' ? 'Destination Complete' : 'Destination Hospital'}
                </span>
                <span className="text-xs text-slate-900 dark:text-white font-semibold truncate block">{hospitalName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          <span>Created: <span className="text-slate-700 dark:text-slate-300">{new Date(match.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span></span>
          {match.completedAt && (
            <span>Completed: <span className="text-emerald-600 dark:text-emerald-400">{new Date(match.completedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span></span>
          )}
          {match.cancelledAt && (
            <span>Cancelled: <span className="text-red-500 dark:text-red-400">{new Date(match.cancelledAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span></span>
          )}
        </div>

        {/* Cancellation reason */}
        {match.status === 'cancelled' && match.cancellationReason && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-650 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-655 dark:text-red-400">
              <span className="font-bold">Reason:</span> {match.cancellationReason}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          {match._id && (
            <a
              href={`${ASSETS_URL}/api/donations/matches/${match._id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 bg-blue-600/10 border border-blue-550/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 hover:bg-blue-600/20 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Match Slip</span>
            </a>
          )}

          {/* Management buttons for facility/admin on active matches */}
          {showCompleteAction && (
            <>
              <button
                onClick={() => handleComplete(match._id)}
                disabled={actionLoading === match._id}
                className="flex-1 py-2.5 bg-emerald-650 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {actionLoading === match._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>{completeBtnLabel}</span>
              </button>
            </>
          )}

          {/* Cancel button for seekers/donors/facilities on active matches */}
          {match.status === 'in_progress' && (
            <button
              onClick={() => handleCancel(match._id)}
              disabled={actionLoading === match._id}
              className="py-2.5 px-4 bg-red-500/10 border border-red-500/15 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-sm"
            >
              {actionLoading === match._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{canManage ? 'Cancel' : 'Cancel Match'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-550 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading your donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 relative transition-colors duration-300">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[25vw] h-[25vw] rounded-full bg-emerald-600/3 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[20vw] h-[20vw] rounded-full bg-red-600/3 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 text-left relative">
        {/* Page Header */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Active Donations</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track your in-progress matches and download PDF match slips
              </p>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{activeMatches.length} Active</span>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'past'
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{historyMatches.length} Past</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'active' ? (
          activeMatches.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>In-Progress Donations</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeMatches.map((m) => renderMatchCard(m, false))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-12 text-center space-y-3 animate-fadeIn shadow-sm">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto">
                <HeartPulse className="w-6 h-6 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="text-base font-bold text-slate-650 dark:text-slate-400">No Active Donations</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When you get matched with a donor or seeker, your active donation details and PDF slips will appear here.
              </p>
            </div>
          )
        ) : (
          historyMatches.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-indigo-550 dark:text-indigo-400" />
                <span>Historical/Completed Donations</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {historyMatches.map((m) => renderMatchCard(m, true))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-12 text-center space-y-3 animate-fadeIn shadow-sm">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto">
                <History className="w-6 h-6 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="text-base font-bold text-slate-650 dark:text-slate-400">No Past Donations</h3>
              <p className="text-xs text-slate-555 dark:text-slate-500 max-w-sm mx-auto">
                Any fully completed or receipt-verified matches from the past will be archived here.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ActiveDonationsPage;
