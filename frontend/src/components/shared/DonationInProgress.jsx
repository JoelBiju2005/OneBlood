import React, { useState, useEffect, useCallback } from 'react';
import api, { ASSETS_URL } from '../../utils/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  Activity, CheckCircle, XCircle, Download, Clock, ArrowRight,
  User, Building2, HeartPulse, Loader2, Phone, Mail
} from 'lucide-react';

/**
 * A shared "Donation In Progress" section used by Seekers, Donors, and Facilities
 * to view and manage their active DonationMatch records.
 */
const DonationInProgress = ({ compact = false }) => {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await api.get('/donations/matches/in-progress');
      setMatches(res.data.matches || []);
    } catch (err) {
      console.error('Failed to fetch in-progress matches:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleComplete = async (matchId) => {
    setActionLoading(matchId);
    try {
      await api.post(`/donations/matches/${matchId}/complete`, {});
      toast.success('Donation marked as completed! 🎉');
      fetchMatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark complete');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (matchId) => {
    const reason = prompt('Reason for cancellation:');
    if (!reason) return;

    setActionLoading(matchId);
    try {
      await api.post(`/donations/matches/${matchId}/cancel`, { cancellationReason: reason });
      toast.success('Match cancelled');
      fetchMatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500 text-xs">
        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2" />
        Loading active matches...
      </div>
    );
  }

  if (matches.length === 0) return null;

  // Determine if the current user can manage (complete/cancel) matches
  const canManage = user?.role === 'hospital' || user?.role === 'blood_bank' || user?.role === 'admin';

  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <HeartPulse className="w-5 h-5 text-red-500" />
        <span>Donation In Progress ({matches.length})</span>
      </h3>

      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
        {matches.map((match) => {
          const facilityName = match.destinationType === 'Hospital'
            ? match.hospitalId?.hospitalName
            : match.bloodBankId?.name;

          return (
            <div
              key={match._id}
              className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-4 hover:border-emerald-500/20 transition-all"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                    {match.matchObid}
                  </span>
                  <h4 className="font-bold text-sm text-white mt-2 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[10px] font-black">
                      {match.bloodGroup}
                    </span>
                    {match.units} Unit(s)
                  </h4>
                </div>
                <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[9px] font-bold uppercase">
                  <Clock className="w-3 h-3" />
                  In Progress
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-400">
                {user?.role !== 'patient' && (
                  <>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> Seeker:</span>
                    <span className="text-white font-semibold">{match.seekerId?.name || 'N/A'}</span>
                  </>
                )}
                {user?.role !== 'donor' && (
                  <>
                    <span className="flex items-center gap-1"><HeartPulse className="w-3 h-3 text-red-400" /> Donor:</span>
                    <span className="text-white font-semibold">{match.donorId?.name || 'N/A'}</span>
                  </>
                )}
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-blue-400" /> Facility:</span>
                <span className="text-white font-semibold">{facilityName || 'N/A'} ({match.destinationType})</span>
                <span>Created:</span>
                <span className="text-white font-semibold">{new Date(match.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Contact info for seeker/donor */}
              {(user?.role === 'patient' && match.donorId?.phone) && (
                <div className="flex gap-2">
                  <a href={`tel:${match.donorId.phone}`} className="flex-1 py-1.5 bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1 hover:bg-emerald-600/30 transition-all">
                    <Phone className="w-3 h-3" /> Call Donor
                  </a>
                  {match.donorId?.email && (
                    <a href={`mailto:${match.donorId.email}`} className="flex-1 py-1.5 border border-white/10 text-slate-400 rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1 hover:bg-white/5 transition-all">
                      <Mail className="w-3 h-3" /> Email
                    </a>
                  )}
                </div>
              )}
              {(user?.role === 'donor' && match.seekerId?.phone) && (
                <div className="flex gap-2">
                  <a href={`tel:${match.seekerId.phone}`} className="flex-1 py-1.5 bg-blue-600/20 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1 hover:bg-blue-600/30 transition-all">
                    <Phone className="w-3 h-3" /> Call Seeker
                  </a>
                </div>
              )}

              {/* PDF Download */}
              {match.pdfPath && (
                <a
                  href={match.pdfPath.startsWith('http') ? match.pdfPath : `${ASSETS_URL}${match.pdfPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Match Slip (PDF)
                </a>
              )}

              {/* Action buttons — only for facilities and admins */}
              {canManage && (
                <div className="flex gap-3 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleComplete(match._id)}
                    disabled={actionLoading === match._id}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {actionLoading === match._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Mark Completed
                  </button>
                  <button
                    onClick={() => handleCancel(match._id)}
                    disabled={actionLoading === match._id}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonationInProgress;
