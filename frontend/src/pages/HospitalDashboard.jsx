import React, { useState, useEffect, useCallback } from 'react';
import api, { ASSETS_URL } from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading hospital dashboard...</span>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-4 px-4">
        <Building2 className="w-12 h-12 text-blue-500 animate-bounce" />
        <h3 className="text-xl font-bold text-white">Hospital Profile Not Found</h3>
        <p className="text-sm max-w-sm text-center text-slate-400">
          Your hospital profile has not been set up yet. Please contact the admin or re-register.
        </p>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[stats.verificationStatus] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-[30vw] h-[30vw] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Section 1 — Hospital Profile & Verification Status */}
        <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3 text-left flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black font-mono px-3 py-1.5 rounded-lg">
                  HOSPITAL
                </span>
                <span className={`text-[10px] ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text} font-black font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5 border`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusCfg.label}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-white">{hospital.hospitalName}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {hospital.address}, {hospital.city}, {hospital.state} - {hospital.pincode}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {hospital.emergencyContact}
                </span>
                {hospital.website && (
                  <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    Website
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Authorized: {hospital.authorizedPersonName} ({hospital.designation}) • Reg: {hospital.registrationNumber}
              </p>
            </div>

            {/* Stat cards */}
            <div className="flex gap-4">
              <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 text-center min-w-[120px]">
                <Activity className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                <span className="text-2xl font-black text-white block">{stats.matchesInProgress}</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">In Progress</span>
              </div>
              <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 text-center min-w-[120px]">
                <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <span className="text-2xl font-black text-white block">{stats.matchesCompleted}</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Verification Documents */}
        {stats.verificationStatus !== 'approved' && (
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Verification Documents</h3>
            </div>

            {stats.verificationStatus === 'rejected' && (
              <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Verification was rejected</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Please re-upload your documents or contact admin support for clarification.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registration Certificate */}
              <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Registration Certificate</span>
                  {hospital.documents?.registrationCertificate && (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">UPLOADED</span>
                  )}
                </div>
                {hospital.documents?.registrationCertificate ? (
                  <a
                    href={hospital.documents.registrationCertificate.startsWith('http') ? hospital.documents.registrationCertificate : `${ASSETS_URL}${hospital.documents.registrationCertificate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    View Uploaded Document ↗
                  </a>
                ) : (
                  <p className="text-xs text-slate-500">No document uploaded yet</p>
                )}
                <label className={`w-full py-3 border border-dashed border-white/10 rounded-xl text-xs font-bold text-slate-400 text-center cursor-pointer hover:bg-white/5 transition-all flex items-center justify-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload / Replace'}
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload(e, 'registrationCertificate')} disabled={uploading} />
                </label>
              </div>

              {/* Government Approval */}
              <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Government Approval</span>
                  {hospital.documents?.govApproval && (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">UPLOADED</span>
                  )}
                </div>
                {hospital.documents?.govApproval ? (
                  <a
                    href={hospital.documents.govApproval.startsWith('http') ? hospital.documents.govApproval : `${ASSETS_URL}${hospital.documents.govApproval}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    View Uploaded Document ↗
                  </a>
                ) : (
                  <p className="text-xs text-slate-500">No document uploaded yet</p>
                )}
                <label className={`w-full py-3 border border-dashed border-white/10 rounded-xl text-xs font-bold text-slate-400 text-center cursor-pointer hover:bg-white/5 transition-all flex items-center justify-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
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
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Donations In Progress ({activeMatches.length})</span>
          </h3>

          {activeMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/20 border border-white/5 rounded-3xl text-center space-y-3">
              <div className="p-4 bg-slate-800/40 rounded-full text-slate-500">
                <Activity className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No active donation matches.</p>
              <p className="text-xs text-slate-500 max-w-sm">
                When a seeker selects your facility as the donation point, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeMatches.map((match) => (
                <div key={match._id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                        {match.matchObid}
                      </span>
                      <h4 className="font-bold text-base text-white mt-2">{match.bloodGroup} • {match.units} Unit(s)</h4>
                    </div>
                    <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
                      In Progress
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-400">
                    <span>Seeker:</span>
                    <span className="text-white font-bold">{match.seekerId?.name || 'N/A'}</span>
                    <span>Donor:</span>
                    <span className="text-white font-bold">{match.donorId?.name || 'N/A'} ({match.donorId?.onebloodId || ''})</span>
                    <span>Donor Phone:</span>
                    <span className="text-white font-bold">{match.donorId?.phone || 'N/A'}</span>
                    <span>Created:</span>
                    <span className="text-white font-bold">{new Date(match.createdAt).toLocaleDateString()}</span>
                  </div>

                  {match.pdfPath && (
                    <a
                      href={match.pdfPath.startsWith('http') ? match.pdfPath : `${ASSETS_URL}${match.pdfPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Match PDF
                    </a>
                  )}

                  <div className="flex gap-3 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleMarkComplete(match._id)}
                      disabled={completingMatch === match._id}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {completingMatch === match._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Mark Completed
                    </button>
                    <button
                      onClick={() => handleCancelMatch(match._id)}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4 — Match History (accordion) */}
        {matchHistory.length > 0 && (
          <div className="border-t border-white/5 pt-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between py-4 text-slate-400 hover:text-white transition-colors"
            >
              <span className="font-bold text-sm">Donation History ({matchHistory.length})</span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHistory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fadeIn">
                {matchHistory.map((match) => {
                  const isCompleted = match.status === 'completed';
                  return (
                    <div key={match._id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 opacity-80">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500">{match.matchObid}</span>
                          <h4 className="font-bold text-sm text-slate-300 mt-1">
                            {match.bloodGroup} • {match.units} Unit(s)
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Donor: {match.donorId?.name || 'Unknown'} • Seeker: {match.seekerId?.name || 'Unknown'}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                          isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                      {match.completedAt && (
                        <p className="text-[10px] text-slate-500 mt-2">Completed: {new Date(match.completedAt).toLocaleString()}</p>
                      )}
                      {match.cancellationReason && (
                        <p className="text-[10px] text-red-400/70 mt-2 italic">Reason: {match.cancellationReason}</p>
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
