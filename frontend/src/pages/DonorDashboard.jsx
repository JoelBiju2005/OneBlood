import React, { useState, useEffect } from 'react';
import api, { ASSETS_URL } from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { 
  HeartPulse, Award, Calendar, ToggleLeft, ToggleRight, ShieldAlert, 
  Navigation, Phone, CheckCircle, Activity, FileText, ArrowRight, 
  MapPin, Copy, Star, User, Hospital, Building2, ExternalLink 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DonorDashboard = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlockedContacts, setUnlockedContacts] = useState({}); // map of request ID to phone details

  const fetchDonorData = async () => {
    try {
      // 1. Fetch donor profile
      const profRes = await api.get('/donors/profile');
      setProfile(profRes.data.donor);

      // 2. Fetch active requests that were specifically sent/notified to this donor
      const reqsRes = await api.get('/requests');
      const donorIdStr = profRes.data?.donor?._id?.toString();
      const matching = (reqsRes.data?.requests || []).filter(req => {
        if (req.status !== 'active') return false;
        // Only show requests explicitly sent to this donor via notifiedDonors
        const isNotified = req.notifiedDonors?.some(
          (id) => id?.toString() === donorIdStr
        );
        return isNotified;
      });
      setActiveRequests(matching);

      // 3. Fetch active match in progress for this donor
      const matchRes = await api.get('/donations/matches/in-progress');
      if (matchRes.data?.matches?.length > 0) {
        setActiveMatch(matchRes.data.matches[0]);
      } else {
        setActiveMatch(null);
      }
    } catch (err) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, []);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    const newStatus = !profile.isAvailable;
    
    try {
      await api.patch('/donors/availability', { isAvailable: newStatus });
      setProfile({ ...profile, isAvailable: newStatus });
      toast.success(newStatus ? 'You are now marked AVAILABLE for requests' : 'You are now marked OFFLINE');
    } catch (err) {
      toast.error('Failed to update availability status');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/accept`);
      toast.success('Donation accepted successfully! Contact details unlocked.');
      setUnlockedContacts(prev => ({
        ...prev,
        [requestId]: true
      }));
      // Refresh list
      fetchDonorData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept match');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/decline`);
      toast.success('Request declined.');
      // Refresh list
      fetchDonorData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 dark:bg-[#07070A] text-slate-500 dark:text-slate-400 transition-colors duration-300">
        <div className="w-8 h-8 border-2 border-[#C0152A] border-t-transparent rounded-full animate-spin mr-3" />
        <span className="font-semibold text-xs tracking-wider uppercase font-mono">Loading Donor Profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#07070A] text-slate-500 dark:text-slate-400 space-y-4 transition-colors duration-300 px-4">
        <div className="w-full max-w-md p-8 bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] rounded-3xl text-center space-y-4 shadow-xl">
          <ShieldAlert className="w-12 h-12 text-[#C0152A] mx-auto animate-bounce" />
          <p className="text-sm font-bold text-slate-800 dark:text-white">No donor profile found for this account.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Make sure your account is registered as a donor, or contact support if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  const isEligible = new Date(profile.eligibleToDonateSince) <= new Date();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-[#07070A] py-10 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white dark:bg-[#0F0F1A]/40 border border-slate-200 dark:border-white/[0.05] backdrop-blur-md p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm hover:border-slate-300 dark:hover:border-white/[0.1] transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-tr from-[#C0152A]/5 to-[#FF4D6A]/5 blur-2xl pointer-events-none" />
          <div className="text-left space-y-2 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display">Hello, {profile.name}</h2>
              {user?.onebloodId && (
                <span className="inline-flex items-center gap-1.5 bg-[#C0152A]/10 border border-[#C0152A]/20 text-[#C0152A] dark:text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg">
                  <span>ID: {user.onebloodId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.onebloodId);
                      toast.success('OneBlood ID copied!');
                    }}
                    className="hover:text-red-750 dark:hover:text-red-400 transition-colors cursor-pointer"
                    title="Copy ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap font-body">
              <span className="font-semibold text-[#C0152A] dark:text-[#FF4D6A]">Verified {profile.bloodGroup} Donor</span>
              <span className="w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-700" />
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Rating {profile.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          
          {/* Availability Toggle Switch */}
          <div className="flex items-center space-x-3 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] px-4 py-2 rounded-2xl shadow-inner relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Availability Status</span>
            <button 
              onClick={handleToggleAvailability}
              className="text-[#C0152A] hover:text-red-500 transition-colors focus:outline-none cursor-pointer"
            >
              {profile.isAvailable ? (
                <ToggleRight className="w-9 h-9 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-slate-400 dark:text-slate-650" />
              )}
            </button>
          </div>
        </div>

        {/* Active Donation Section */}
        {activeMatch && (() => {
          const hasTransitBank = activeMatch.bloodBankId && activeMatch.destinationType === 'BloodBankAndHospital';
          let progressPercent = 0;
          let progressLabel = '';
          if (activeMatch.status === 'completed') {
            progressPercent = 100;
            progressLabel = 'Completed — Donation Received at Hospital';
          } else if (activeMatch.status === 'cancelled') {
            progressPercent = 0;
            progressLabel = 'Cancelled';
          } else {
            if (hasTransitBank) {
              if (activeMatch.stage === 'at_blood_bank') {
                progressPercent = 25;
                progressLabel = 'Step 1 of 3: At Transit Blood Bank';
              } else if (activeMatch.stage === 'at_hospital') {
                progressPercent = 65;
                progressLabel = 'Step 2 of 3: Verified at Blood Bank -> En-Route to Hospital';
              }
            } else {
              progressPercent = 50;
              progressLabel = 'Step 1 of 2: En-Route to Hospital';
            }
          }

          return (
            <div className="bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] p-8 rounded-3xl text-left space-y-6 shadow-md dark:shadow-xl hover:border-slate-300 dark:hover:border-emerald-500/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-500/[0.02] blur-2xl pointer-events-none" />
              <div className="flex justify-between items-center flex-wrap gap-2 relative z-10">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>Active Donation Match</span>
                </div>
                <span className="text-[10px] font-black text-slate-800 dark:text-white px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.05] font-mono">
                  Match ID: {activeMatch.matchObid}
                </span>
              </div>

              {/* Progress Bar Component */}
              <div className="space-y-3 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] rounded-2xl p-5 text-left relative z-10">
                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-450">
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Donation Journey Progress</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/[0.05] rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block pt-1 font-body">
                  📍 Current Stage: <span className="text-slate-900 dark:text-white font-bold">{progressLabel}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Seeker Name</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white block">{activeMatch.seekerId?.name || 'Anonymous Seeker'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Blood Group & Units</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                      {activeMatch.bloodGroup} &bull; {activeMatch.units} Unit(s)
                    </span>
                  </div>
                </div>

                {/* Donation Route Visualization */}
                <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] p-5 rounded-2xl space-y-4 text-xs">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block mb-1">Donation Journey Route</span>
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    {/* Step 1: Donor */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-450">
                        <User className="w-4 h-4" />
                      </span>
                      <span className="text-slate-750 dark:text-slate-350 font-bold truncate max-w-full mt-2 text-center text-[10px]">You (Donor)</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-650 shrink-0" />

                    {/* Step 2: Detour Blood Bank (Optional) */}
                    {activeMatch.bloodBankId && (
                      <>
                        <div className="flex flex-col items-center flex-1 min-w-0">
                          <span className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 font-bold truncate max-w-full mt-2 text-center text-[10px]" title={activeMatch.bloodBankId.name}>
                            {activeMatch.bloodBankId.name.replace(' Hubli', '')}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-650 shrink-0" />
                      </>
                    )}

                    {/* Step 3: Destination Hospital */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-450">
                        <Hospital className="w-4 h-4" />
                      </span>
                      <span className="text-blue-600 dark:text-blue-450 font-bold truncate max-w-full mt-2 text-center text-[10px]" title={activeMatch.hospitalId?.hospitalName}>
                        {activeMatch.hospitalId?.hospitalName.replace(' Hubli', '')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 relative z-10">
                {activeMatch._id && (
                  <a
                    href={`${ASSETS_URL}/api/donations/matches/${activeMatch._id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-sm keep-white"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Match Slip PDF</span>
                  </a>
                )}
                <Link
                  to="/active-donations"
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-205 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all flex items-center justify-center"
                >
                  Active Donations Page &rarr;
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Eligibility Panel */}
          <div className="bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] p-8 rounded-3xl text-left space-y-4 shadow-sm backdrop-blur-md">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Donation Eligibility</h3>
              <Calendar className="w-4 h-4 text-[#C0152A] dark:text-[#FF4D6A]" />
            </div>
            
            {isEligible ? (
              <div className="space-y-2">
                <span className="inline-block px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-full text-[10px] font-bold">
                  ELIGIBLE TO DONATE
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-body">It has been more than 56 days since your last donation. You can save lives today!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="inline-block px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold">
                  ON HOLD (56-DAY RULE)
                </span>
                <p className="text-xs text-slate-650 dark:text-slate-400 font-medium leading-relaxed font-body">
                  Eligible to donate again from:<br />
                  <span className="text-slate-900 dark:text-white font-black text-base block mt-1">{new Date(profile.eligibleToDonateSince).toLocaleDateString()}</span>
                </p>
              </div>
            )}
          </div>

          {/* Badges Shelf */}
          <div className="bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] p-8 rounded-3xl text-left space-y-4 shadow-sm backdrop-blur-md">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Achievement Badges</h3>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.badges.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-555 italic leading-relaxed font-body">No badges earned yet. Complete a donation to unlock!</p>
              ) : (
                profile.badges.map(badge => (
                  <span key={badge} className="px-2.5 py-1 bg-amber-550/10 border border-amber-500/20 text-amber-650 dark:text-amber-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 font-body">
                    <Award className="w-3.5 h-3.5" />
                    <span>{badge}</span>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Core Metrics */}
          <div className="bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] p-8 rounded-3xl text-left space-y-4 shadow-sm backdrop-blur-md">
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lifetime Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] rounded-2xl text-center shadow-inner">
                <p className="text-3xl font-black text-slate-900 dark:text-white font-display">{profile.totalDonations}</p>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1 uppercase font-bold tracking-wider font-body">Donations</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] rounded-2xl text-center shadow-inner">
                <p className="text-3xl font-black text-[#C0152A] dark:text-[#FF4D6A] font-display">{profile.totalDonations * 3}</p>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1 uppercase font-bold tracking-wider font-body">Lives Saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Sent Directly to This Donor */}
        <div className="space-y-5 text-left">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-[#C0152A] dark:text-[#FF4D6A] animate-pulse" />
            <span>Requests Sent to You</span>
          </h3>

          {activeRequests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#0F0F1A]/20 border border-slate-200 dark:border-white/[0.05] rounded-3xl text-xs text-slate-400 dark:text-slate-500 shadow-sm backdrop-blur-md font-body leading-relaxed max-w-4xl mx-auto">
              No requests have been directed specifically to you right now. When a seeker sends you a direct request or your blood group is matched to a nearby emergency, it will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRequests.filter(req => {
                const donorResponse = req.responses?.find(r => r.responderId.toString() === profile._id.toString());
                return donorResponse?.status !== 'declined';
              }).map(req => {
                const donorResponse = req.responses?.find(r => r.responderId.toString() === profile._id.toString());
                const isAccepted = donorResponse?.status === 'accepted' || unlockedContacts[req._id] !== undefined;
                return (
                  <div key={req._id} className="bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] p-6 rounded-3xl flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-white/[0.1] transition-all shadow-sm relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-red-500/[0.01] blur-xl pointer-events-none" />
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <span className={`text-[8px] px-2.5 py-1 rounded-full font-black border uppercase tracking-widest ${req.urgencyLevel === 'critical' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 animate-pulse' : 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20'}`}>
                          {req.urgencyLevel}
                        </span>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white mt-3 font-display">Patient: {req.patientName}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-1 font-body">{req.hospitalName} &bull; {req.hospitalAddress}</p>
                        {req.doctorLetterUrl && (
                          <div className="mt-3">
                            <a 
                              href={req.doctorLetterUrl.startsWith('http') || req.doctorLetterUrl.startsWith('blob:') ? req.doctorLetterUrl : `${ASSETS_URL}${req.doctorLetterUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#C0152A] dark:text-[#FF4D6A] hover:underline font-bold inline-flex items-center gap-1 font-body"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Prescription</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#C0152A] dark:text-[#FF4D6A] px-3 py-1.5 rounded-xl bg-[#C0152A]/10 border border-[#C0152A]/20 font-mono tracking-wider">
                          {req.unitsRequired} Units
                        </span>
                      </div>
                    </div>

                    {/* Unlocked contacts overlay */}
                    {isAccepted ? (
                      <div className="p-4 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-2xl space-y-2 relative z-10">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-body">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>Match Confirmed! Coordinate details below:</span>
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-900 dark:text-white pt-1">
                          <span className="flex items-center gap-1.5 font-mono">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-450" />
                            <span>Contact: {req.doctorContact}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 border-t border-slate-100 dark:border-white/[0.05] justify-between relative z-10">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-body">
                          <Navigation className="w-3.5 h-3.5 text-slate-400" />
                          <span>Within coordination radius</span>
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(req._id)}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer flex-1 keep-white"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req._id)}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-450 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] border border-slate-200 dark:border-white/[0.06] cursor-pointer flex-1"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DonorDashboard;
