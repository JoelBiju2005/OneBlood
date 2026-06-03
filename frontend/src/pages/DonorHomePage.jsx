import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { ASSETS_URL } from '../utils/api';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';
import { HeartPulse, Award, Calendar, ToggleLeft, ToggleRight, ShieldAlert, Navigation, Phone, CheckCircle, MessageCircle, ArrowRight, Activity, Users, AwardIcon } from 'lucide-react';
import HallOfFameSection from '../components/shared/HallOfFameSection';
import DonationInProgress from '../components/shared/DonationInProgress';

const DonorHomePage = () => {
  const { user } = useAuthStore();
  const { socket } = useNotificationStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  // Community feed mock for Karnataka/AP/Telangana
  const communityFeeds = [
    { id: 1, text: 'O+ donor matched for patient at KLE Hospital, Hubballi', time: '10 mins ago' },
    { id: 2, text: 'B- critical request fulfilled at NIMS, Hyderabad', time: '1 hour ago' },
    { id: 3, text: 'A+ donation completed at Victoria Hospital, Bengaluru', time: '2 hours ago' },
    { id: 4, text: 'O- emergency unit delivered to Apollo Hospital, Secunderabad', time: '4 hours ago' }
  ];

  const fetchDonorData = async () => {
    try {
      // 1. Fetch donor profile
      const profRes = await api.get('/donors/profile');
      const donorProfileData = profRes.data.donor;
      setProfile(donorProfileData);

      // 2. Fetch active requests matching blood type and sent to this donor
      const reqsRes = await api.get('/requests');
      const donorIdStr = donorProfileData?._id?.toString();
      const matching = (reqsRes.data?.requests || []).filter(
        req => {
          if (req.status !== 'active') return false;
          // Check if request was notified/sent to this donor
          const isNotified = req.notifiedDonors?.some(
            (id) => id?.toString() === donorIdStr
          );
          if (!isNotified) return false;

          // Filter out if the donor has already responded to this request
          const myResp = req.responses?.find(
            (r) => r.responderId && r.responderId.toString() === donorIdStr
          );
          return !myResp;
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

  // Hook into Socket.IO for new matching request alerts
  useEffect(() => {
    if (!socket || !profile) return;

    const handleNewRequest = (data) => {
      // Check if donor is in the notified list
      const isNotified = data.notifiedDonors?.some(
        id => id?.toString() === profile._id?.toString()
      );
      if (isNotified) {
        setActiveRequests((prev) => {
          // Prevent duplicates
          if (prev.some(r => r._id === data._id)) return prev;
          return [data, ...prev];
        });
      }
    };

    socket.on('new_request_broadcast', handleNewRequest);
    socket.on('notification', (payload) => {
      if (payload.data?.request) {
        const req = payload.data.request;
        const isNotified = req.notifiedDonors?.some(
          id => id?.toString() === profile._id?.toString()
        );
        if (isNotified) {
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
      toast.success(newStatus ? '🔴 Marked as AVAILABLE. Stay ready!' : '⚪ Offline. Availability paused.');
    } catch (err) {
      toast.error('Failed to update availability status.');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/accept`);
      fetchDonorData();
      setExpandedRequestId(null);
      // Navigate to confirmation page
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading your donor home...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-4 px-4">
        <HeartPulse className="w-12 h-12 text-red-500 animate-bounce" />
        <h3 className="text-xl font-bold text-white">Donor Profile Incomplete</h3>
        <p className="text-sm max-w-sm text-center text-slate-400">
          You must set up your donor details (blood group, city, availability) before entering.
        </p>
        <Link
          to="/donor/register"
          className="px-6 py-3 bg-[#C0152A] hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
        >
          Complete Setup &rarr;
        </Link>
      </div>
    );
  }

  const isEligible = new Date(profile.eligibleToDonateSince) <= new Date();
  
  // Calculate remaining days for eligibility message
  const daysDiff = Math.ceil((new Date(profile.eligibleToDonateSince) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[30vw] h-[30vw] rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Section 1 — Personal welcome hero */}
        <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-[#C0152A] font-black font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  ID: {user?.onebloodId}
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(user?.onebloodId);
                      toast.success('OneBlood ID copied!');
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                    title="Copy ID"
                  >
                    📋
                  </button>
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-white">
                Hey {profile.name} 👋
              </h1>
              <p className="text-sm text-slate-400">
                You have donated <span className="text-white font-bold">{profile.totalDonations} times</span>. 
                You've helped an estimated <span className="text-red-400 font-bold">{profile.totalDonations * 3} people</span>!
              </p>
              
              <div className="pt-2 text-xs flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span className="text-slate-300">
                  Next eligible to donate:{' '}
                  {isEligible ? (
                    <span className="text-emerald-400 font-bold">✅ You're eligible now!</span>
                  ) : (
                    <span className="text-amber-400">
                      in {daysDiff} days — <button onClick={() => toast.success('Reminder scheduled!')} className="underline hover:text-white">Set a reminder</button>
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Giant toggle button */}
            <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center space-y-3 min-w-[200px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Availability Toggle</span>
              <button
                onClick={handleToggleAvailability}
                className="focus:outline-none transition-transform hover:scale-105"
              >
                {profile.isAvailable ? (
                  <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl font-black text-sm">
                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                    <span>AVAILABLE</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-slate-800 border border-white/5 text-slate-400 px-4 py-2.5 rounded-xl font-black text-sm">
                    <ToggleLeft className="w-7 h-7 text-slate-500" />
                    <span>OFFLINE</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2 — Live incoming requests */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>Live Emergency Requests Nearby ({profile.bloodGroup})</span>
            </h3>
            <span className="text-xs text-slate-400">{activeRequests.length} active matching</span>
          </div>

          {activeRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/20 border border-white/5 rounded-3xl text-center space-y-3">
              <div className="p-4 bg-slate-800/40 rounded-full text-slate-500">
                <HeartPulse className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No active requests nearby.</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Stay available — someone in {profile.city} might need your help soon.
              </p>
            </div>
          ) : (
            <div className="flex space-x-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-white/10">
              {activeRequests.map((req) => {
                const isExpanded = expandedRequestId === req._id;
                return (
                  <div
                    key={req._id}
                    className={`snap-start shrink-0 w-80 bg-slate-900 border transition-all duration-300 rounded-2xl flex flex-col justify-between p-6 ${
                      isExpanded ? 'border-red-500 ring-1 ring-red-500/20 w-[360px]' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          {req.urgencyLevel}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {req.city || profile.city}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-white">
                          Patient: {req.patientName}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          Hospital: {req.hospitalName}
                        </p>
                      </div>

                      {/* In-place response forms */}
                      {isExpanded ? (
                        <div className="pt-3 border-t border-white/5 space-y-3 animate-fadeIn">
                          <div className="grid grid-cols-2 text-xs text-slate-400 gap-y-2">
                            <span>Units:</span>
                            <span className="text-white font-bold">{req.unitsRequired} Units</span>
                            <span>Component:</span>
                            <span className="text-white font-bold capitalize">{req.bloodComponent.replace('_', ' ')}</span>
                            <span>Doctor:</span>
                            <span className="text-white font-bold">{req.doctorName}</span>
                            {req.doctorLetterUrl && (
                              <>
                                <span>Prescription:</span>
                                <a 
                                  href={req.doctorLetterUrl.startsWith('http') || req.doctorLetterUrl.startsWith('blob:') ? req.doctorLetterUrl : `${ASSETS_URL}${req.doctorLetterUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-oneblood-crimson hover:underline font-bold"
                                >
                                  View Document ↗
                                </a>
                              </>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleAcceptRequest(req._id)}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Accept Request
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(req._id)}
                              className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs font-bold transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setExpandedRequestId(req._id)}
                          className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                        >
                          <span>Respond</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2.5 — Donation In Progress */}
        <DonationInProgress />

        {/* Section 3 — My Impact & Section 4 — Community Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section 3: My Impact */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-oneblood-gold" />
              <span>My Impact & Badges</span>
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl text-center space-y-1">
                <Activity className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <span className="text-2xl font-black text-white">{profile.totalDonations}</span>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Donations Made</p>
              </div>
              <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl text-center space-y-1">
                <Users className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-2xl font-black text-white">{profile.totalDonations * 3}</span>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">People Helped</p>
              </div>
              <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl text-center space-y-1">
                <Calendar className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <span className="text-2xl font-black text-white">
                  {profile.lastDonationDate ? Math.ceil((new Date() - new Date(profile.lastDonationDate)) / (1000 * 60 * 60 * 24)) : 'N/A'}
                </span>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Days Since Last</p>
              </div>
            </div>

            {/* Badge shelf */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Badge Gallery</h4>
              <div className="flex flex-wrap gap-3">
                {/* Seed Badges */}
                {[
                  { name: 'First Drop', min: 1, emoji: '🩸' },
                  { name: 'Life Saver', min: 3, emoji: '💖' },
                  { name: 'Century Club', min: 5, emoji: '🏆' },
                  { name: 'Guardian Angel', min: 10, emoji: '👼' }
                ].map((b) => {
                  const unlocked = profile.totalDonations >= b.min;
                  return (
                    <div
                      key={b.name}
                      className={`px-3 py-2 border rounded-xl flex items-center space-x-2 text-xs font-bold transition-all ${
                        unlocked
                          ? 'bg-amber-500/10 border-amber-500/20 text-oneblood-gold'
                          : 'bg-white/5 border-white/5 text-slate-500 opacity-60'
                      }`}
                    >
                      <span>{b.emoji}</span>
                      <span>{b.name}</span>
                      {!unlocked && (
                        <span className="text-[8px] text-slate-600 block pl-1">
                          (Donate {b.min - profile.totalDonations} more)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Community Feed */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 divide-y divide-white/5 space-y-4">
              {communityFeeds.map((feed) => (
                <div key={feed.id} className="pt-4 first:pt-0 space-y-1">
                  <p className="text-xs font-semibold text-slate-300 leading-snug">
                    {feed.text}
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    {feed.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5 — Quick links */}
        <div className="border-t border-white/5 pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <Link
            to="/dashboard/donor"
            className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Go to my Dashboard &rarr;
          </Link>
          <Link
            to="/profile"
            className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Edit my Profile &rarr;
          </Link>
          <Link
            to="/search"
            className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            Browse Map &rarr;
          </Link>
          <button
            onClick={() => toast.success('Donation log is up to date!')}
            className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all focus:outline-none"
          >
            See donation history &rarr;
          </button>
        </div>

        {/* Hall of Fame statistics */}
        <HallOfFameSection />
      </div>
    </div>
  );
};

export default DonorHomePage;
