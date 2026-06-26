import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { ASSETS_URL } from '../utils/api';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';
import { HeartPulse, Award, Calendar, ShieldCheck, Mail, Phone, Activity, Users, Clipboard, X, Check, ArrowRight, ExternalLink } from 'lucide-react';
import HallOfFameSection from '../components/shared/HallOfFameSection';
import DonationInProgress from '../components/shared/DonationInProgress';
import { scaleIn, fadeUp, staggerContainer } from '../utils/animations';
import { motion } from 'framer-motion';

export default function DonorHomePage() {
  const { user } = useAuthStore();
  const { socket } = useNotificationStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  const communityFeeds = [
    { id: 1, text: 'O+ donor matched for patient at KLE Hospital, Hubballi', time: '10 mins ago' },
    { id: 2, text: 'B- critical request fulfilled at NIMS, Hyderabad', time: '1 hour ago' },
    { id: 3, text: 'A+ donation completed at Victoria Hospital, Bengaluru', time: '2 hours ago' },
    { id: 4, text: 'O- emergency unit delivered to Apollo Hospital, Secunderabad', time: '4 hours ago' }
  ];

  const fetchDonorData = async () => {
    try {
      const profRes = await api.get('/donors/profile');
      const donorProfileData = profRes.data.donor;
      setProfile(donorProfileData);

      const reqsRes = await api.get('/requests');
      const donorIdStr = donorProfileData?._id?.toString();
      const matching = (reqsRes.data?.requests || []).filter(
        req => {
          if (req.status !== 'active' && req.status !== 'accepted') return false;

          const myResp = req.responses?.find(
            (r) => r.responderId && r.responderId.toString() === donorIdStr
          );

          const isTargetedToMe = req.isTargeted === true && req.targetDonorId?.toString() === donorIdStr;
          const isApprovedByMe = req.isTargeted !== true && myResp && myResp.status !== 'declined';

          if (isTargetedToMe) {
            if (myResp && myResp.status === 'declined') return false;
            return true;
          }

          if (isApprovedByMe) {
            return true;
          }

          return false;
        }
      );
      setActiveRequests(matching);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load donor profile details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, []);

  useEffect(() => {
    if (!socket || !profile) return;

    const handleNewRequest = (data) => {
      const isTargetedToMe = data.isTargeted === true && data.targetDonorId?.toString() === profile._id?.toString();
      if (isTargetedToMe) {
        setActiveRequests((prev) => {
          if (prev.some(r => r._id === data._id)) return prev;
          return [data, ...prev];
        });
      }
    };

    socket.on('new_request_broadcast', handleNewRequest);
    socket.on('notification', (payload) => {
      if (payload.data?.request) {
        const req = payload.data.request;
        const isTargetedToMe = req.isTargeted === true && req.targetDonorId?.toString() === profile._id?.toString();
        if (isTargetedToMe) {
          setActiveRequests((prev) => {
            if (prev.some(r => r._id === req._id)) return prev;
            return [req, ...prev];
          });
        }
      }
    });

    return () => {
      socket.off('new_request_broadcast', handleNewRequest);
    };
  }, [socket, profile]);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    const newStatus = !profile.isAvailable;
    try {
      await api.patch('/donors/availability', { isAvailable: newStatus });
      setProfile({ ...profile, isAvailable: newStatus });
      toast.success(newStatus ? 'Marked as AVAILABLE. Stay ready!' : 'Offline. Availability paused.');
    } catch (err) {
      toast.error('Failed to update availability status.');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/accept`);
      fetchDonorData();
      setExpandedRequestId(null);
      navigate(`/donor/response-confirm`, { state: { action: 'can_donate', requestId } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept donation request.');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/decline`);
      toast.success('Request declined.');
      fetchDonorData();
      setExpandedRequestId(null);
    } catch (err) {
      toast.error('Failed to decline request.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-ob-ink text-neutral-555">
        <Loader2 className="w-10 h-10 animate-spin text-ob-red-700 mr-3" />
        <span className="font-mono text-sm">Loading donor terminal...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-ob-ink px-4 space-y-4">
        <HeartPulse className="w-16 h-16 text-ob-red-700 animate-bounce" />
        <h3 className="text-2xl font-display text-neutral-900 dark:text-ob-white">Donor Profile Incomplete</h3>
        <p className="text-sm max-w-sm text-center text-neutral-500 dark:text-neutral-400">
          You must set up your donor details (blood group, city, availability) before entering.
        </p>
        <Link
          to="/donor/register"
          className="px-6 py-3 bg-ob-red-700 text-white font-bold rounded-full hover:scale-[1.02] active:scale-[0.97] transition-all"
        >
          Complete Setup
        </Link>
      </div>
    );
  }

  const isEligible = new Date(profile.eligibleToDonateSince) <= new Date();
  const daysDiff = Math.ceil((new Date(profile.eligibleToDonateSince) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-white dark:bg-ob-ink py-10 px-4 sm:px-6 lg:px-8 space-y-8 transition-colors duration-300 relative">
      <div className="absolute top-0 right-0 w-[30vw] h-[30vw] rounded-full bg-ob-red-700/[0.03] blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Donor Profile Header Panel */}
        <motion.div 
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-card"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-ob-red-700/10 border border-ob-red-700/20 text-ob-red-700 dark:text-red-400 font-mono font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  ID: {user?.onebloodId}
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(user?.onebloodId);
                      toast.success('Copied OneBlood ID!');
                    }}
                    className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
                </span>
                <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2.5 py-1 rounded-lg font-mono font-bold">
                  Group: {profile.bloodGroup}
                </span>
              </div>
              <h1 className="text-3xl font-display font-black text-neutral-905 dark:text-ob-white">
                Welcome, {profile.name}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                You have saved lives <span className="text-ob-red-700 font-bold">{profile.totalDonations} times</span>. 
                That's an estimated <span className="text-emerald-500 font-bold">{profile.totalDonations * 3} patients protected</span>!
              </p>
              
              <div className="pt-1 text-xs flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-ob-red-700" />
                <span className="text-neutral-600 dark:text-neutral-300">
                  Transfusion status:{' '}
                  {isEligible ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Eligible to donate now</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Cooldown active ({daysDiff} days remaining)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="bg-white dark:bg-neutral-900/60 border border-neutral-250 dark:border-neutral-800 rounded-2xl p-5 flex flex-col items-center space-y-2 min-w-[200px]">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Availability Switch</span>
              <button
                onClick={handleToggleAvailability}
                className="transition-transform active:scale-95 focus:outline-none"
              >
                {profile.isAvailable ? (
                  <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-605 dark:text-emerald-400 px-4 py-2 rounded-xl font-bold text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>ACTIVE / DISPATCH READY</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 px-4 py-2 rounded-xl font-bold text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-neutral-400" />
                    <span>PAUSED / OFFLINE</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Incoming Emergency Requests */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-ob-white font-display flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ob-red-700 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ob-red-700"></span>
              </span>
              <span>Proximity Match Requests ({profile.bloodGroup})</span>
            </h3>
            <span className="text-xs font-mono bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-full text-neutral-500">{activeRequests.length} matching</span>
          </div>

          {activeRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-neutral-50 dark:bg-neutral-900/20 border border-neutral-200 dark:border-ob-glass-border rounded-3xl text-center space-y-3 shadow-card">
              <HeartPulse className="w-8 h-8 text-ob-red-700 animate-pulse" />
              <p className="text-sm font-semibold text-neutral-755 dark:text-neutral-350">No incoming dispatches.</p>
              <p className="text-xs text-neutral-500 max-w-sm">
                Ensure availability is toggled ON to receive direct coordinate dispatches from nearby seeking hospitals.
              </p>
            </div>
          ) : (
            <div className="flex space-x-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
              {activeRequests.map((req) => {
                const isExpanded = expandedRequestId === req._id;
                const myResp = req.responses?.find(
                  (r) => r.responderId && r.responderId.toString() === profile._id?.toString()
                );
                return (
                  <div
                    key={req._id}
                    className={`snap-start shrink-0 w-80 bg-neutral-50 dark:bg-neutral-900/60 border rounded-2xl flex flex-col justify-between p-6 transition-all duration-300 ${
                      isExpanded ? 'border-ob-red-700 ring-2 ring-ob-red-700/10 w-[340px]' : 'border-neutral-200 dark:border-ob-glass-border hover:border-neutral-300 dark:hover:border-ob-glass-hover'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] px-2 py-0.5 rounded-lg border font-mono font-bold uppercase tracking-wider ${
                          req.urgencyLevel === 'critical' ? 'bg-ob-red-700/10 text-ob-red-700 border-ob-red-700/25 animate-pulse' : 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-505/20'
                        }`}>
                          {req.urgencyLevel}
                        </span>
                        <span className="text-xs text-neutral-500 font-mono">
                          {req.city || profile.city}
                        </span>
                      </div>

                      <div className="text-left">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-ob-white">
                          Patient: {req.patientName}
                        </h4>
                        <p className="text-xs text-neutral-505 dark:text-neutral-400 mt-1">
                          Hospital: {req.hospitalName}
                        </p>
                      </div>

                      {myResp ? (
                        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-500">Response Status:</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-505 font-mono text-[9px] font-bold uppercase">
                              {myResp.status}
                            </span>
                          </div>

                          <div className="bg-white dark:bg-neutral-950/40 rounded-xl p-3 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">Seeker Contact</span>
                            <p className="text-xs text-neutral-700 dark:text-neutral-300"><strong>Name:</strong> {req.requesterId?.name || 'Patient Family'}</p>
                            {req.phone && (
                              <p className="text-xs text-neutral-755 dark:text-neutral-300 font-mono"><strong>Phone:</strong> <a href={`tel:${req.phone}`} className="text-ob-red-700 hover:underline">{req.phone}</a></p>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeclineRequest(req._id)}
                            className="w-full py-2 bg-ob-red-700/10 hover:bg-ob-red-700/20 text-ob-red-700 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                          >
                            Withdraw Response
                          </button>
                        </div>
                      ) : isExpanded ? (
                        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                          <div className="grid grid-cols-2 text-xs text-neutral-500 gap-y-2 text-left">
                            <span>Units Required:</span>
                            <strong className="text-neutral-900 dark:text-ob-white font-mono">{req.unitsRequired}</strong>
                            <span>Component:</span>
                            <strong className="text-neutral-900 dark:text-ob-white uppercase">{req.bloodComponent.replace('_', ' ')}</strong>
                            <span>Doctor:</span>
                            <strong className="text-neutral-900 dark:text-ob-white">{req.doctorName}</strong>
                            {req.doctorLetterUrl && (
                              <>
                                <span>Letter:</span>
                                <a 
                                  href={req.doctorLetterUrl.startsWith('http') || req.doctorLetterUrl.startsWith('blob:') ? req.doctorLetterUrl : `${ASSETS_URL}${req.doctorLetterUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-ob-red-700 hover:underline font-bold"
                                >
                                  View prescription ↗
                                </a>
                              </>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleAcceptRequest(req._id)}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(req._id)}
                              className="flex-1 py-2 bg-neutral-200 dark:bg-neutral-805 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setExpandedRequestId(req._id)}
                          className="w-full mt-4 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-neutral-800 dark:text-ob-white border border-neutral-250 dark:border-neutral-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                        >
                          <span>Review Request</span>
                          <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Donation Tracker Widget */}
        <DonationInProgress />

        {/* Lifetime Performance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4 text-left">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-ob-white font-display flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Donor Impact & Badge Shelf</span>
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-ob-glass-border p-4 rounded-2xl text-center space-y-1 shadow-sm">
                <Activity className="w-5 h-5 text-ob-red-700 mx-auto mb-1" />
                <span className="text-2xl font-black text-neutral-900 dark:text-ob-white font-mono">{profile.totalDonations}</span>
                <p className="text-[10px] text-neutral-400 uppercase font-semibold">Total Donations</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-ob-glass-border p-4 rounded-2xl text-center space-y-1 shadow-sm">
                <Users className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <span className="text-2xl font-black text-neutral-900 dark:text-ob-white font-mono">{profile.totalDonations * 3}</span>
                <p className="text-[10px] text-neutral-400 uppercase font-semibold">Lives Saved</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-ob-glass-border p-4 rounded-2xl text-center space-y-1 shadow-sm">
                <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <span className="text-2xl font-black text-neutral-900 dark:text-ob-white font-mono">
                  {profile.lastDonationDate ? Math.ceil((new Date() - new Date(profile.lastDonationDate)) / (1000 * 60 * 60 * 24)) : 'N/A'}
                </span>
                <p className="text-[10px] text-neutral-400 uppercase font-semibold">Days Since Last</p>
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-2xl space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Badge shelf</h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { name: 'First Drop', min: 1, icon: <HeartPulse className="w-4 h-4 text-ob-red-700" /> },
                  { name: 'Life Saver', min: 3, icon: <Activity className="w-4 h-4 text-emerald-505" /> },
                  { name: 'Century Club', min: 5, icon: <Award className="w-4 h-4 text-amber-500" /> },
                  { name: 'Guardian Angel', min: 10, icon: <Users className="w-4 h-4 text-blue-500" /> }
                ].map((b) => {
                  const unlocked = profile.totalDonations >= b.min;
                  return (
                    <div
                      key={b.name}
                      className={`px-3 py-2 border rounded-xl flex items-center space-x-2 text-xs font-bold transition-all ${
                        unlocked
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-405 dark:text-neutral-500 opacity-60'
                      }`}
                    >
                      <span>{b.icon}</span>
                      <span>{b.name}</span>
                      {!unlocked && (
                        <span className="text-[8px] text-neutral-400 pl-1 font-mono">
                          (Need {b.min - profile.totalDonations})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-ob-white font-display">Recent Activity</h3>
            <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-ob-glass-border rounded-3xl p-6 divide-y divide-neutral-200 dark:divide-neutral-800 space-y-4 shadow-sm">
              {communityFeeds.map((feed) => (
                <div key={feed.id} className="pt-4 first:pt-0 space-y-1">
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-350 leading-snug">
                    {feed.text}
                  </p>
                  <span className="text-[10px] text-neutral-400 font-mono block">
                    {feed.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Quick Navigation */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <Link
            to="/profile"
            className="p-4 bg-neutral-50 dark:bg-neutral-900/45 border border-neutral-200 dark:border-ob-glass-border rounded-2xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm"
          >
            Edit Profile
          </Link>
          <Link
            to="/search"
            className="p-4 bg-neutral-50 dark:bg-neutral-900/45 border border-neutral-200 dark:border-ob-glass-border rounded-2xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm"
          >
            Browse Search Map
          </Link>
          <Link
            to="/active-donations"
            className="p-4 bg-neutral-50 dark:bg-neutral-900/45 border border-neutral-200 dark:border-ob-glass-border rounded-2xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm"
          >
            Donation Records
          </Link>
          <button
            onClick={() => toast.success('Dispatch metrics synced!')}
            className="p-4 bg-neutral-50 dark:bg-neutral-900/45 border border-neutral-200 dark:border-ob-glass-border rounded-2xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm cursor-pointer"
          >
            Sync Dispatch System
          </button>
        </div>

        {/* Global Hall of Fame */}
        <HallOfFameSection />
      </div>
    </div>
  );
}
