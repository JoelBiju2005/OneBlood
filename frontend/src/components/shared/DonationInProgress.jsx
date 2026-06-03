import React, { useState, useEffect, useCallback } from 'react';
import api, { ASSETS_URL } from '../../utils/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  Activity, CheckCircle, XCircle, Download, Clock, ArrowRight,
  User, Building2, HeartPulse, Loader2, Phone, Mail, Landmark,
  Truck, FlaskConical
} from 'lucide-react';

/**
 * A shared "Donation In Progress" section used by Seekers, Donors, Blood Banks, and Hospitals
 * to view and manage their active DonationMatch records, including a progress bar.
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

  // Blood bank marks their stage complete (donation collected at bank)
  const handleBankComplete = async (matchId) => {
    setActionLoading(matchId + '_bank');
    try {
      await api.post(`/donations/matches/${matchId}/complete`, {});
      toast.success('Bank stage complete! Donation is now en-route to hospital. 🏥');
      fetchMatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update blood bank stage');
    } finally {
      setActionLoading(null);
    }
  };

  // Hospital marks donation fully received (final completion)
  const handleComplete = async (matchId) => {
    setActionLoading(matchId + '_hospital');
    try {
      await api.post(`/donations/matches/${matchId}/complete`, {});
      toast.success('Donation received and confirmed! Completion recorded. 🎉');
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

    setActionLoading(matchId + '_cancel');
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

  const isHospital = user?.role === 'hospital';
  const isBloodBank = user?.role === 'blood_bank';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSeeker = user?.role === 'patient';
  const isDonor = user?.role === 'donor';

  /**
   * Calculate progress for a match.
   * Steps:
   *   - Matched & Confirmed: always 1 (25%)
   *   - Blood Bank Stage (if detour): bloodBankStatus === 'completed' (50%)
   *   - En-route to Hospital: stage === 'at_hospital' (75%)
   *   - Donation Received at Hospital: status === 'completed' (100%)
   */
  const getProgress = (match) => {
    const hasBank = match.bloodBankId && match.destinationType === 'BloodBankAndHospital';

    if (match.status === 'completed') {
      return {
        percent: 100,
        steps: hasBank
          ? ['Match Confirmed', 'Collected at Bank', 'En-route to Hospital', 'Donation Received ✅']
          : ['Match Confirmed', 'En-route to Hospital', 'Donation Received ✅'],
        currentStep: hasBank ? 3 : 2,
        label: 'Donation fully received at hospital'
      };
    }

    if (match.status === 'cancelled') {
      return { percent: 0, steps: ['Cancelled'], currentStep: -1, label: 'Match cancelled' };
    }

    if (hasBank) {
      const steps = ['Match Confirmed', 'Collected at Bank', 'En-route to Hospital', 'Donation Received'];
      if (match.bloodBankStatus === 'completed' || match.stage === 'at_hospital') {
        return { percent: 65, steps, currentStep: 2, label: 'Verified at bank — en-route to hospital' };
      }
      return { percent: 25, steps, currentStep: 0, label: 'Awaiting collection at transit blood bank' };
    } else {
      const steps = ['Match Confirmed', 'En-route to Hospital', 'Donation Received'];
      return { percent: 50, steps, currentStep: 1, label: 'En-route to hospital for submission' };
    }
  };

  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <HeartPulse className="w-5 h-5 text-red-500" />
        <span>Active Donations ({matches.length})</span>
      </h3>

      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
        {matches.map((match) => {
          const facilityName = match.destinationType === 'Hospital'
            ? match.hospitalId?.hospitalName
            : match.bloodBankId?.name;

          const hasBank = match.bloodBankId && match.destinationType === 'BloodBankAndHospital';
          const progress = getProgress(match);
          const bankAlreadyDone = match.bloodBankStatus === 'completed' || match.stage === 'at_hospital';

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
                {match.status === 'completed' ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-bold uppercase">
                    <CheckCircle className="w-3 h-3" /> Completed
                  </span>
                ) : match.status === 'cancelled' ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[9px] font-bold uppercase">
                    <XCircle className="w-3 h-3" /> Cancelled
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[9px] font-bold uppercase">
                    <Clock className="w-3 h-3" />
                    In Progress
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold text-slate-300">Donation Journey Progress</span>
                  <span className="font-mono text-emerald-400 font-bold">{progress.percent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      match.status === 'completed'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : match.status === 'cancelled'
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400'
                    }`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {progress.steps.map((step, idx) => {
                    const done = idx < progress.currentStep || match.status === 'completed';
                    const active = idx === progress.currentStep && match.status !== 'completed' && match.status !== 'cancelled';
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[8px] font-black shrink-0 ${
                          done ? 'bg-emerald-500 border-emerald-400 text-white' :
                          active ? 'bg-amber-500 border-amber-400 text-white animate-pulse' :
                          'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
                          {done ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[8px] text-center leading-tight font-semibold truncate max-w-full ${
                          done ? 'text-emerald-400' : active ? 'text-amber-400' : 'text-slate-600'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[9px] text-slate-400 font-semibold pt-0.5">
                  📍 {progress.label}
                </p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-400">
                {!isSeeker && (
                  <>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> Seeker:</span>
                    <span className="text-white font-semibold">{match.seekerId?.name || 'N/A'}</span>
                  </>
                )}
                {!isDonor && (
                  <>
                    <span className="flex items-center gap-1"><HeartPulse className="w-3 h-3 text-red-400" /> Donor:</span>
                    <span className="text-white font-semibold">{match.donorId?.name || 'N/A'}</span>
                  </>
                )}
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-blue-400" /> Facility:</span>
                <span className="text-white font-semibold">{facilityName || 'N/A'} ({match.destinationType})</span>
                {hasBank && (
                  <>
                    <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3 text-purple-400" /> Transit Bank:</span>
                    <span className="text-white font-semibold">{match.bloodBankId?.name || 'N/A'}</span>
                  </>
                )}
                <span>Created:</span>
                <span className="text-white font-semibold">{new Date(match.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Contact info for seeker/donor */}
              {(isSeeker && match.donorId?.phone) && (
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
              {(isDonor && match.seekerId?.phone) && (
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

              {/* Action buttons — role-specific */}
              {match.status === 'in_progress' && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {/* Blood Bank action: Mark their stage as complete */}
                  {(isBloodBank || isAdmin) && hasBank && !bankAlreadyDone && (
                    <button
                      onClick={() => handleBankComplete(match._id)}
                      disabled={actionLoading === match._id + '_bank'}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === match._id + '_bank' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
                      Mark as Collected at Bank ✅
                    </button>
                  )}
                  {(isBloodBank || isAdmin) && hasBank && bankAlreadyDone && (
                    <div className="w-full py-2 bg-emerald-900/30 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold text-center">
                      ✅ Bank Stage Complete — Awaiting Hospital Confirmation
                    </div>
                  )}

                  {/* Hospital action: Mark as fully received */}
                  {(isHospital || isAdmin) && (
                    <button
                      onClick={() => handleComplete(match._id)}
                      disabled={actionLoading === match._id + '_hospital' || (hasBank && !bankAlreadyDone)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === match._id + '_hospital' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      {hasBank && !bankAlreadyDone
                        ? 'Awaiting Blood Bank Stage First...'
                        : 'Mark Donation Received at Hospital 🏥'}
                    </button>
                  )}

                  {/* Cancel — for admins and hospitals only */}
                  {(isAdmin || isHospital) && (
                    <button
                      onClick={() => handleCancel(match._id)}
                      disabled={actionLoading === match._id + '_cancel'}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Match
                    </button>
                  )}
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
