import React, { useState, useEffect } from 'react';
import api, { ASSETS_URL } from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { HeartPulse, Award, Calendar, ToggleLeft, ToggleRight, ShieldAlert, Navigation, Phone, CheckCircle } from 'lucide-react';

const DonorDashboard = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockedContacts, setUnlockedContacts] = useState({}); // map of request ID to phone details

  const fetchDonorData = async () => {
    try {
      // 1. Fetch donor profile
      const profRes = await api.get('/donors/profile');
      setProfile(profRes.data.donor);

      // 2. Fetch active matching requests for this blood group
      const reqsRes = await api.get('/requests');
      // Filter requests matching this donor's blood group
      const matching = (reqsRes.data?.requests || []).filter(
        req => req.bloodGroup === profRes.data?.donor?.bloodGroup && req.status === 'active'
      );
      setActiveRequests(matching);
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
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-oneblood-midnight text-slate-400">
        <div className="w-8 h-8 border-2 border-oneblood-crimson border-t-transparent rounded-full animate-spin mr-2" />
        <span>Loading Donor Profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-oneblood-midnight text-slate-400 space-y-4">
        <p className="text-sm font-semibold">No donor profile found for this account.</p>
        <p className="text-xs">Make sure you are registered as a donor.</p>
      </div>
    );
  }

  const isEligible = new Date(profile.eligibleToDonateSince) <= new Date();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-oneblood-midnight py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-tr from-slate-900 via-slate-900 to-oneblood-crimson/10 border border-white/5 p-8 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-2xl font-bold text-white font-display">Hello, {profile.name}</h2>
              {user?.onebloodId && (
                <span className="inline-flex items-center gap-1 bg-[#C0152A]/10 border border-[#C0152A]/30 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg">
                  ID: {user.onebloodId}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.onebloodId);
                      toast.success('OneBlood ID copied!');
                    }}
                    className="hover:text-red-400 transition-colors cursor-pointer ml-1"
                    title="Copy ID"
                  >
                    📋
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Verified {profile.bloodGroup} Donor &bull; Rating {profile.rating.toFixed(1)} ⭐
            </p>
          </div>
          
          {/* Availability Toggle Switch */}
          <div className="flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
            <span className="text-xs font-bold text-slate-300">Availability Status</span>
            <button 
              onClick={handleToggleAvailability}
              className="text-oneblood-crimson hover:text-red-500 transition-colors focus:outline-none cursor-pointer"
            >
              {profile.isAvailable ? (
                <ToggleRight className="w-9 h-9 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Eligibility Panel */}
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl text-left space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Donation Eligibility</h3>
              <Calendar className="w-4 h-4 text-oneblood-crimson" />
            </div>
            
            {isEligible ? (
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold">
                  ELIGIBLE TO DONATE
                </span>
                <p className="text-xs text-slate-300">It has been more than 56 days since your last donation. You can save lives today!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-oneblood-gold rounded-full text-[10px] font-bold">
                  ON HOLD (56-DAY RULE)
                </span>
                <p className="text-xs text-slate-400">
                  Eligible to donate again from:<br />
                  <span className="text-white font-bold">{new Date(profile.eligibleToDonateSince).toLocaleDateString()}</span>
                </p>
              </div>
            )}
          </div>

          {/* Badges Shelf */}
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl text-left space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Achievement Badges</h3>
              <Award className="w-4 h-4 text-oneblood-gold" />
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {profile.badges.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No badges earned yet. Complete a donation to unlock!</p>
              ) : (
                profile.badges.map(badge => (
                  <span key={badge} className="px-2.5 py-1 bg-oneblood-gold/10 border border-oneblood-gold/20 text-oneblood-gold rounded-lg text-[10px] font-bold flex items-center space-x-1">
                    <span>🏅</span>
                    <span>{badge}</span>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Core Metrics */}
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl text-left space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lifetime Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                <p className="text-2xl font-black text-white">{profile.totalDonations}</p>
                <span className="text-[10px] text-slate-500 block mt-1 uppercase font-bold">Donations</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                <p className="text-2xl font-black text-oneblood-crimson">{profile.totalDonations * 3}</p>
                <span className="text-[10px] text-slate-500 block mt-1 uppercase font-bold">Lives Saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Emergency Requests List */}
        <div className="space-y-4 text-left">
          <h3 className="text-lg font-bold text-white font-display flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-oneblood-crimson animate-pulse" />
            <span>Active emergency requests ({profile.bloodGroup})</span>
          </h3>

          {activeRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/20 border border-white/5 rounded-2xl text-xs text-slate-500">
              No active emergency requests for {profile.bloodGroup} in your area right now.
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
                  <div key={req._id} className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-white/10 transition-all">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${req.urgencyLevel === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'bg-amber-500/20 text-oneblood-gold border-oneblood-gold/30'}`}>
                          {req.urgencyLevel} Request
                        </span>
                        <h4 className="font-bold text-sm text-white mt-2">Patient: {req.patientName}</h4>
                        <p className="text-xs text-slate-400 leading-snug mt-1">{req.hospitalName} &bull; {req.hospitalAddress}</p>
                        {req.doctorLetterUrl && (
                          <div className="mt-2.5">
                            <a 
                              href={req.doctorLetterUrl.startsWith('http') || req.doctorLetterUrl.startsWith('blob:') ? req.doctorLetterUrl : `${ASSETS_URL}${req.doctorLetterUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-oneblood-crimson hover:underline font-bold inline-flex items-center space-x-1"
                            >
                              <span>📎 View Prescription ↗</span>
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-oneblood-crimson px-2.5 py-1 rounded bg-oneblood-crimson/10 border border-oneblood-crimson/25">
                          {req.unitsRequired} Units
                        </span>
                      </div>
                    </div>

                    {/* Unlocked contacts overlay */}
                    {isAccepted ? (
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                        <p className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Match Confirmed! Coordinate details below:</span>
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs font-semibold text-white pt-1">
                          <span className="flex items-center space-x-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Contact: {req.doctorContact}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-white/5 justify-between">
                        <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <Navigation className="w-3.5 h-3.5 text-slate-500" />
                          <span>Within coordination radius</span>
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(req._id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex-1"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req._id)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1"
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
