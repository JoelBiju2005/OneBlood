import React, { useState, useEffect } from 'react';
import api, { ASSETS_URL } from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { 
  HeartPulse, Award, Calendar, ToggleLeft, ToggleRight, ShieldAlert, 
  Navigation, Phone, CheckCircle, Activity, FileText, ArrowRight, 
  MapPin, Copy, Star, User, Hospital, Building2, ExternalLink, Loader2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { scaleIn } from '../utils/animations';
import { motion } from 'framer-motion';

export default function DonorDashboard() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlockedContacts, setUnlockedContacts] = useState({});

  const fetchDonorData = async () => {
    try {
      const profRes = await api.get('/donors/profile');
      setProfile(profRes.data.donor);

      const reqsRes = await api.get('/requests');
      const donorIdStr = profRes.data?.donor?._id?.toString();
      const matching = (reqsRes.data?.requests || []).filter(req => {
        if (req.status !== 'active') return false;
        const isNotified = req.notifiedDonors?.some(
          (id) => id?.toString() === donorIdStr
        );
        return isNotified;
      });
      setActiveRequests(matching);

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
      toast.success(newStatus ? 'You are now marked AVAILABLE' : 'You are now marked OFFLINE');
    } catch (err) {
      toast.error('Failed to update availability status');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/accept`);
      toast.success('Donation accepted! Seeker contact unlocked.');
      setUnlockedContacts(prev => ({ ...prev, [requestId]: true }));
      fetchDonorData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept match');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/decline`);
      toast.success('Request declined.');
      fetchDonorData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-ob-ink text-neutral-555">
        <Loader2 className="w-8 h-8 animate-spin text-ob-red-700 mr-3" />
        <span className="font-mono text-sm">Loading donor dashboard...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-ob-ink px-4 space-y-4">
        <div className="w-full max-w-md p-8 bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border rounded-3xl text-center space-y-4 shadow-card">
          <ShieldAlert className="w-12 h-12 text-ob-red-700 mx-auto animate-bounce" />
          <p className="text-sm font-bold text-neutral-900 dark:text-ob-white">No donor profile found.</p>
          <p className="text-xs text-neutral-500">Please complete registration as a donor.</p>
        </div>
      </div>
    );
  }

  const isEligible = new Date(profile.eligibleToDonateSince) <= new Date();

  return (
    <div className="min-h-screen bg-white dark:bg-ob-ink py-10 px-4 transition-colors duration-300 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-6 md:p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm">
          <div className="text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-3xl font-display font-black text-neutral-900 dark:text-ob-white">Dashboard, {profile.name}</h2>
              {user?.onebloodId && (
                <span className="inline-flex items-center gap-1.5 bg-ob-red-700/10 border border-ob-red-700/20 text-ob-red-700 dark:text-red-400 font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg">
                  ID: {user.onebloodId}
                  <button onClick={() => { navigator.clipboard.writeText(user.onebloodId); toast.success('Copied!'); }} className="hover:text-neutral-900 dark:hover:text-white"><Copy className="w-3.5 h-3.5" /></button>
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-500 flex items-center gap-1.5 font-mono">
              <span className="font-semibold text-ob-red-700">Verified {profile.bloodGroup} Donor</span>
              <span>Rating: {profile.rating.toFixed(1)} ★</span>
            </div>
          </div>
          
          {/* Availability Status */}
          <div className="flex items-center space-x-3 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-805 px-4 py-2 rounded-2xl shadow-inner">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-405 dark:text-neutral-500">Status</span>
            <button onClick={handleToggleAvailability} className="text-ob-red-700 focus:outline-none">
              {profile.isAvailable ? (
                <ToggleRight className="w-9 h-9 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-neutral-400 dark:text-neutral-600" />
              )}
            </button>
          </div>
        </div>

        {/* Active Matches */}
        {activeMatch && (() => {
          const hasTransitBank = activeMatch.bloodBankId && activeMatch.destinationType === 'BloodBankAndHospital';
          let progressPercent = 0;
          let progressLabel = '';
          if (activeMatch.status === 'completed') {
            progressPercent = 100;
            progressLabel = 'Completed';
          } else {
            if (hasTransitBank) {
              if (activeMatch.stage === 'at_blood_bank') {
                progressPercent = 25;
                progressLabel = 'At Transit Blood Bank';
              } else if (activeMatch.stage === 'at_hospital') {
                progressPercent = 65;
                progressLabel = 'En-Route to Hospital';
              }
            } else {
              progressPercent = 50;
              progressLabel = 'En-Route to Hospital';
            }
          }

          return (
            <div className="bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-6 md:p-8 rounded-3xl text-left space-y-6 shadow-card">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-450 font-bold text-xs uppercase tracking-widest">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-505"></span>
                  </span>
                  <span>Active Match Journey</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800">
                  Match: {activeMatch.matchObid}
                </span>
              </div>

              <div className="space-y-3 bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl text-left">
                <div className="flex justify-between items-center text-[10px] text-neutral-555">
                  <span className="font-bold uppercase tracking-wider">Progress</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-850 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-[10px] font-mono text-neutral-500 block pt-1">
                  📍 Stage: <span className="text-neutral-900 dark:text-white font-bold">{progressLabel}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-450 uppercase tracking-wider block">Seeker</span>
                    <span className="text-base font-bold text-neutral-900 dark:text-ob-white block">{activeMatch.seekerId?.name || 'Anonymous Seeker'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-450 uppercase tracking-wider block">Requirement</span>
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">
                      {activeMatch.bloodGroup} &bull; {activeMatch.units} Unit(s)
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900/40 border border-neutral-250 dark:border-neutral-800 p-4 rounded-xl space-y-3 text-xs">
                  <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-widest block">Route nodes</span>
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                    <div className="flex-1 text-center font-bold">You</div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-405 shrink-0" />
                    {activeMatch.bloodBankId && (
                      <>
                        <div className="flex-1 text-center font-bold text-purple-650" title={activeMatch.bloodBankId.name}>{activeMatch.bloodBankId.name.slice(0, 10)}...</div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-405 shrink-0" />
                      </>
                    )}
                    <div className="flex-1 text-center font-bold text-blue-500" title={activeMatch.hospitalId?.hospitalName}>{activeMatch.hospitalId?.hospitalName.slice(0, 10)}...</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                {activeMatch._id && (
                  <a
                    href={`${ASSETS_URL}/api/donations/matches/${activeMatch._id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download PDF slip</span>
                  </a>
                )}
                <Link
                  to="/active-donations"
                  className="py-3 px-5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-all text-center flex-grow"
                >
                  Active Records
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Eligibility Panel */}
          <div className="bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl text-left space-y-3">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Eligibility status</h3>
            {isEligible ? (
              <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-full text-[10px] font-bold">
                ELIGIBLE NOW
              </span>
            ) : (
              <p className="text-xs text-neutral-500 font-mono">
                Cooldown until: <strong className="text-neutral-900 dark:text-white">{new Date(profile.eligibleToDonateSince).toLocaleDateString()}</strong>
              </p>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl text-left space-y-3">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Unlocked Badges</h3>
            <div className="flex flex-wrap gap-2">
              {profile.badges.length === 0 ? (
                <span className="text-xs text-neutral-400 italic">No badges yet.</span>
              ) : (
                profile.badges.map(b => (
                  <span key={b} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md text-[9px] font-bold">
                    {b}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl text-left space-y-3">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Total Contribution</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-xl">
                <span className="text-xl font-bold font-mono text-neutral-900 dark:text-ob-white">{profile.totalDonations}</span>
                <span className="text-[8px] text-neutral-400 block font-bold uppercase mt-0.5">Donations</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-xl">
                <span className="text-xl font-bold font-mono text-ob-red-700">{profile.totalDonations * 3}</span>
                <span className="text-[8px] text-neutral-400 block font-bold uppercase mt-0.5">Lives Saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Requests directed to the donor */}
        <div className="space-y-4 text-left">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-ob-white font-display">Targeted Dispatch Inbox</h3>
          {activeRequests.length === 0 ? (
            <div className="p-10 text-center bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-ob-glass-border rounded-3xl text-xs text-neutral-450 leading-relaxed font-mono">
              Inbox empty. No active dispatches.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRequests.map(req => {
                const donorResponse = req.responses?.find(r => r.responderId.toString() === profile._id.toString());
                const isAccepted = donorResponse?.status === 'accepted' || unlockedContacts[req._id] !== undefined;
                return (
                  <div key={req._id} className="bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl flex flex-col justify-between space-y-4 hover:border-neutral-300 dark:hover:border-ob-glass-hover transition-all">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className={`text-[8px] px-2 py-0.5 rounded border font-mono font-bold ${req.urgencyLevel === 'critical' ? 'bg-ob-red-700/10 text-ob-red-700 border-ob-red-700/20 animate-pulse' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                          {req.urgencyLevel}
                        </span>
                        <span className="text-xs font-mono text-neutral-900 dark:text-white font-bold">{req.unitsRequired} Units</span>
                      </div>
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-ob-white mt-3">Patient: {req.patientName}</h4>
                      <p className="text-xs text-neutral-500 mt-1">{req.hospitalName}</p>
                    </div>

                    {isAccepted ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5">
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold">✓ Request Accepted</p>
                        <p className="text-xs font-mono text-neutral-800 dark:text-neutral-200">Phone: {req.doctorContact}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => handleAcceptRequest(req._id)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all">Accept</button>
                        <button onClick={() => handleDeclineRequest(req._id)} className="flex-1 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-350 rounded-xl text-xs font-bold transition-all">Decline</button>
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
}
