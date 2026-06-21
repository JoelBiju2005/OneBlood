import React, { useState, useEffect, useCallback } from 'react';
import api, { ASSETS_URL } from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ShieldCheck, ShieldAlert, Clock, CheckCircle, XCircle,
  Upload, FileText, Activity, Users, AlertTriangle, ChevronDown, ChevronUp,
  Phone, MapPin, Globe, ArrowRight, Loader2, Download
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'amber', label: 'Pending Review', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  approved: { icon: ShieldCheck, color: 'emerald', label: 'Approved & Verified', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  rejected: { icon: XCircle, color: 'red', label: 'Rejected', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' }
};

const HospitalDashboard = () => {
  const { user } = useAuthStore();
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState({ verificationStatus: 'pending', matchesInProgress: 0, matchesCompleted: 0 });
  const [activeMatches, setActiveMatches] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [completingMatch, setCompletingMatch] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, statsRes, matchesRes, historyRes] = await Promise.all([
        api.get('/hospitals/profile'),
        api.get('/hospitals/dashboard'),
        api.get('/donations/matches/in-progress'),
        api.get('/donations/matches/history')
      ]);
      setHospital(profileRes.data.hospital);
      setStats(statsRes.data.stats);
      setActiveMatches(matchesRes.data.matches || []);
      setMatchHistory(historyRes.data.history || []);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load hospital dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDocUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10 MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(docType, file);
      await api.post('/hospitals/upload-docs', formData);
      toast.success(`${docType === 'registrationCertificate' ? 'Registration Certificate' : 'Government Approval'} uploaded successfully`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleMarkComplete = async (matchId) => {
    setCompletingMatch(matchId);
    try {
      await api.post(`/donations/matches/${matchId}/complete`, {});
      toast.success('Donation marked as completed!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark complete');
    } finally {
      setCompletingMatch(null);
    }
  };

  const handleCancelMatch = async (matchId) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      await api.post(`/donations/matches/${matchId}/cancel`, { cancellationReason: reason });
      toast.success('Match cancelled successfully');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel match');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 dark:bg-[#07070A] text-slate-500 dark:text-slate-450 transition-colors duration-300">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="font-semibold text-xs tracking-wider uppercase font-mono">Loading Hospital Profile...</span>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#07070A] text-slate-500 dark:text-slate-400 space-y-4 transition-colors duration-300 px-4">
        <div className="w-full max-w-md p-8 bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] rounded-3xl text-center space-y-4 shadow-xl">
          <Building2 className="w-12 h-12 text-blue-500 mx-auto animate-bounce" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white font-display">Hospital Profile Not Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-body">
            Your hospital profile has not been set up yet. Please contact support or re-register.
          </p>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[stats.verificationStatus] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07070A] py-8 px-4 sm:px-6 lg:px-8 space-y-8 relative overflow-hidden transition-colors duration-300">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-blue-600/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] rounded-full bg-gradient-to-bl from-[#C0152A]/3 to-transparent blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 text-left relative z-10">
        {/* Section 1 — Hospital Profile & Verification Status */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 relative overflow-hidden group"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-tr from-blue-500/5 to-[#C0152A]/5 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
            <div className="space-y-3 text-left flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black font-mono px-3 py-1.5 rounded-lg">
                  HOSPITAL
                </span>
                <span className={`text-[10px] ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text} font-black font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5 border`}>
                  <StatusIcon className="w-3.5 h-3.5 animate-pulse" />
                  {statusCfg.label}
                </span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white font-display">{hospital.hospitalName}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400 font-body">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  {hospital.address}, {hospital.city}, {hospital.state} - {hospital.pincode}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  {hospital.emergencyContact}
                </span>
                {hospital.website && (
                  <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    Website
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-450 dark:text-slate-500 font-body">
                Authorized: {hospital.authorizedPersonName} ({hospital.designation}) • Reg: {hospital.registrationNumber}
              </p>
            </div>

            {/* Stat cards */}
            <div className="flex gap-4">
              <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 text-center min-w-[120px] shadow-inner">
                <Activity className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <span className="text-2xl font-black text-slate-900 dark:text-white block font-display">{stats.matchesInProgress}</span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase font-bold tracking-wider font-body">In Progress</span>
              </div>
              <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 text-center min-w-[120px] shadow-inner">
                <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <span className="text-2xl font-black text-slate-900 dark:text-white block font-display">{stats.matchesCompleted}</span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase font-bold tracking-wider font-body">Completed</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 2 — Verification Documents */}
        {stats.verificationStatus !== 'approved' && (
          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">Verification Documents</h3>
            </div>

            {stats.verificationStatus === 'rejected' && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-[#C0152A] dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#C0152A] dark:text-red-400 font-body">Verification was rejected</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-body">
                    Please re-upload your documents or contact admin support for clarification.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registration Certificate */}
              <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-body">Registration Certificate</span>
                  {hospital.documents?.registrationCertificate && (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-black font-mono">UPLOADED</span>
                  )}
                </div>
                {hospital.documents?.registrationCertificate ? (
                  <a
                    href={hospital.documents.registrationCertificate.startsWith('http') ? hospital.documents.registrationCertificate : `${ASSETS_URL}${hospital.documents.registrationCertificate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold font-body"
                  >
                    <FileText className="w-4 h-4" />
                    View Uploaded Document ↗
                  </a>
                ) : (
                  <p className="text-xs text-slate-450 dark:text-slate-555 italic font-body">No document uploaded yet</p>
                )}
                <label className={`w-full py-3 border border-dashed border-slate-300 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-white/[0.15] rounded-xl text-xs font-bold text-slate-555 dark:text-slate-400 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''} font-body`}>
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload / Replace'}
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload(e, 'registrationCertificate')} disabled={uploading} />
                </label>
              </div>

              {/* Government Approval */}
              <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-body">Government Approval</span>
                  {hospital.documents?.govApproval && (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-black font-mono">UPLOADED</span>
                  )}
                </div>
                {hospital.documents?.govApproval ? (
                  <a
                    href={hospital.documents.govApproval.startsWith('http') ? hospital.documents.govApproval : `${ASSETS_URL}${hospital.documents.govApproval}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold font-body"
                  >
                    <FileText className="w-4 h-4" />
                    View Uploaded Document ↗
                  </a>
                ) : (
                  <p className="text-xs text-slate-455 dark:text-slate-555 italic font-body">No document uploaded yet</p>
                )}
                <label className={`w-full py-3 border border-dashed border-slate-300 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-white/[0.15] rounded-xl text-xs font-bold text-slate-555 dark:text-slate-400 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''} font-body`}>
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload / Replace'}
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload(e, 'govApproval')} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Section 3 — Active Matches (Donations In Progress) */}
        <div className="space-y-4 text-left">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>Donations In Progress ({activeMatches.length})</span>
          </h3>

          {activeMatches.length === 0 ? (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] rounded-full text-slate-400">
                <Activity className="w-8 h-8 text-[#C0152A] dark:text-[#FF4D6A]" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white font-body">No active donation matches.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm font-body">
                When a seeker selects your facility as the donation point, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeMatches.map((match) => (
                <div key={match._id} className="glass-card glass-card-hover p-6 space-y-5 relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent blur-xl pointer-events-none" />
                  <div className="flex justify-between items-start gap-4 relative z-10">
                    <div>
                      <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-450 px-2.5 py-1 rounded-lg font-black font-mono tracking-wider">
                        {match.matchObid}
                      </span>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white mt-3 font-display">{match.bloodGroup} • {match.units} Unit(s)</h4>
                    </div>
                    <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider font-mono">
                      In Progress
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] p-4 rounded-2xl relative z-10 font-body">
                    <span>Seeker:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{match.seekerId?.name || 'N/A'}</span>
                    <span>Donor:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{match.donorId?.name || 'N/A'} ({match.donorId?.onebloodId || ''})</span>
                    <span>Donor Phone:</span>
                    <span className="text-slate-900 dark:text-white font-bold font-mono">{match.donorId?.phone || 'N/A'}</span>
                    <span>Created:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{new Date(match.createdAt).toLocaleDateString()}</span>
                  </div>

                  {match._id && (
                    <a
                      href={`${ASSETS_URL}/api/donations/matches/${match._id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold font-body relative z-10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Match PDF</span>
                    </a>
                  )}

                  <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.06] relative z-10">
                    <button
                      onClick={() => handleMarkComplete(match._id)}
                      disabled={completingMatch === match._id}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer keep-white shadow-sm"
                    >
                      {completingMatch === match._id ? (
                        <Loader2 className="w-4 h-4 animate-spin animate-spin-slow" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>Mark Completed</span>
                    </button>
                    <button
                      onClick={() => handleCancelMatch(match._id)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-205 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-[#C0152A] dark:hover:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel Match</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4 — Match History (accordion) */}
        {matchHistory.length > 0 && (
          <div className="border-t border-slate-200 dark:border-white/[0.06] pt-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between py-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span className="font-bold text-sm font-body">Donation History ({matchHistory.length})</span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHistory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fadeIn">
                {matchHistory.map((match) => {
                  const isCompleted = match.status === 'completed';
                  return (
                    <div key={match._id} className="glass-card p-5 opacity-80 hover:opacity-100 transition-opacity">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500">{match.matchObid}</span>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-300 mt-1 font-display">
                            {match.bloodGroup} • {match.units} Unit(s)
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-body">
                            Donor: {match.donorId?.name || 'Unknown'} • Seeker: {match.seekerId?.name || 'Unknown'}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border capitalize font-mono ${
                          isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                            : 'bg-red-500/10 border-red-500/20 text-[#C0152A] dark:text-red-400'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                      {match.completedAt && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-2 font-body">Completed: {new Date(match.completedAt).toLocaleString()}</p>
                      )}
                      {match.cancellationReason && (
                        <p className="text-[10px] text-red-550 dark:text-red-500/70 mt-2 italic font-body">Reason: {match.cancellationReason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
