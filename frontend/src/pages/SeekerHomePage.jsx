import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';
import { HeartPulse, Search, MapPin, Plus, FileText, CheckCircle, Clock, ChevronDown, ChevronUp, Navigation, Phone, MessageSquare, Landmark } from 'lucide-react';
import HallOfFameSection from '../components/shared/HallOfFameSection';
import NoticeBoardCard from '../components/shared/NoticeBoardCard';
const URGENCY_COLORS = { critical: '#dc2626', urgent: '#f97316', moderate: '#eab308', planned: '#22c55e' };

const SeekerHomePage = () => {
  const { user } = useAuthStore();
  const { socket } = useNotificationStore();
  const navigate = useNavigate();

  const [location, setLocation] = useState({ lat: 15.3647, lng: 75.1240, city: 'Hubballi' });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [activeRequests, setActiveRequests] = useState([]);
  const [pastRequests, setPastRequests] = useState([]);
  const [nearbyBanks, setNearbyBanks] = useState([]);
  const [myNotices, setMyNotices] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          city: 'My Location'
        });
        setGpsLoading(false);
        toast.success('Location synchronized successfully!');
      },
      (error) => {
        setGpsLoading(false);
        toast.error('Could not fetch GPS coordinates. Defaulting to Hubballi, KA.');
      }
    );
  };

  const fetchUserData = async () => {
    try {
      // 1. Fetch user's blood requests
      const reqRes = await api.get('/requests/my-requests');
      const allRequests = reqRes.data?.requests || [];
      
      const active = allRequests.filter(r => r.status === 'active' || r.status === 'accepted');
      const past = allRequests.filter(r => r.status === 'fulfilled' || r.status === 'cancelled' || r.status === 'expired');
      
      setActiveRequests(active);
      setPastRequests(past);

      // 2. Fetch user's notice board posts
      const noticeRes = await api.get('/noticeboard/mine');
      setMyNotices(noticeRes.data || []);
    } catch (err) {
      console.error('Failed to load user request history:', err.message);
    }
  };

  const fetchNearbyBanks = async () => {
    setBanksLoading(true);
    try {
      const res = await api.get(`/search?type=banks&lat=${location.lat}&lng=${location.lng}&radius=50`);
      setNearbyBanks(res.data?.banks?.slice(0, 3) || []);
    } catch (err) {
      console.error('Failed to fetch nearby blood banks:', err.message);
    } finally {
      setBanksLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    fetchNearbyBanks();
  }, [location.lat, location.lng]);

  // Hook into Socket.IO for request updates
  useEffect(() => {
    if (!socket) return;

    const handleResponseUpdate = (data) => {
      // If one of our requests got accepted, refresh list
      toast.success('An update was received on your request status!');
      fetchUserData();
    };

    socket.on('donor_responded', handleResponseUpdate);
    return () => {
      socket.off('donor_responded', handleResponseUpdate);
    };
  }, [socket]);

  const handleNoticeRespond = async (noticeId, action) => {
    try {
      if (action === 'close') {
        await api.patch(`/noticeboard/${noticeId}/close`);
        toast.success('Notice marked as fulfilled!');
        fetchUserData();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to close notice.');
    }
  };

  const handleFindBlood = () => {
    // Redirect to search, prepopulating coords
    navigate(`/search?lat=${location.lat}&lng=${location.lng}&prefire=true`);
  };

  const getStatusBadge = (status, responses = []) => {
    const hasAccepted = responses.some(r => r.status === 'accepted');
    if (status === 'accepted' || hasAccepted) {
      return (
        <span className="flex items-center space-x-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold">
          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>Accepted — Ready to coordinate</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold">
        <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
        <span>Pending — Notifying {responses.length || 12} donors nearby</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-[30vw] h-[30vw] rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 text-left">
        {/* Section 1 — Immediate action hero */}
        <div className="relative overflow-hidden bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md text-center space-y-6">
          <div className="flex justify-center items-center gap-2 flex-wrap">
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Need blood urgently?
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Create an emergency request or search our network of nearby individual donors and registered blood banks immediately.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={handleFindBlood}
              className="w-full sm:w-auto px-8 py-4 bg-[#C0152A] hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-700/20 hover:shadow-red-700/35 flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Find Blood Now</span>
            </button>

            <Link
              to="/request/new"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5 text-red-500" />
              <span>Upload Doctor's Letter</span>
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 pt-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span>
              Using location:{' '}
              <span className="text-white font-bold">
                {location.city} ({location.lat.toFixed(3)}, {location.lng.toFixed(3)})
              </span>
            </span>
            <button
              onClick={getGeolocation}
              disabled={gpsLoading}
              className="underline text-red-400 hover:text-white pl-1"
            >
              {gpsLoading ? 'Locating...' : '(Sync GPS)'}
            </button>
          </div>
        </div>

        {/* Section 2 — My active requests */}
        {activeRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>My Active Emergency Requests</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRequests.map((req) => {
                const acceptedRes = req.responses?.find(r => r.status === 'accepted');
                return (
                  <div
                    key={req._id}
                    className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-base text-white">
                            Patient: {req.patientName}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            {req.bloodGroup} &bull; {req.bloodComponent.replace('_', ' ').toUpperCase()} &bull; {req.unitsRequired} Units
                          </p>
                        </div>
                        {getStatusBadge(req.status, req.responses)}
                      </div>

                      <p className="text-xs text-slate-400 mt-3 bg-white/5 px-3 py-2 rounded-lg">
                        📍 {req.hospitalName} ({req.hospitalAddress})
                      </p>
                    </div>

                    {req.responses && req.responses.length > 0 && (
                      <div className="pt-4 border-t border-white/5 space-y-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Donor Responses ({req.responses.length})
                        </span>
                        <div className="space-y-3">
                          {req.responses.map((resp, idx) => {
                            const isAccepted = resp.status === 'accepted';
                            const isDeclined = resp.status === 'declined';
                            const isTransport = resp.status === 'need_transport';
                            const isTomorrow = resp.status === 'donate_tomorrow';
                            
                            let badgeStyle = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                            let statusText = resp.status;
                            if (isAccepted) {
                              badgeStyle = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                              statusText = "Accepted";
                            } else if (isDeclined) {
                              badgeStyle = "bg-red-500/10 text-red-400 border border-red-500/20";
                              statusText = "Declined";
                            } else if (isTransport) {
                              badgeStyle = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                              statusText = "Need Transport";
                            } else if (isTomorrow) {
                              badgeStyle = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
                              statusText = "Will Donate Tomorrow";
                            }

                            return (
                              <div key={idx} className="bg-slate-950/40 border border-white/5 rounded-xl p-3 space-y-2 text-left">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-white">
                                    {resp.responderName}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${badgeStyle}`}>
                                    {statusText}
                                  </span>
                                </div>
                                
                                {resp.message && (
                                  <p className="text-[10px] text-slate-400 italic">
                                    "{resp.message}"
                                  </p>
                                )}

                                {!isDeclined && (resp.contactPhone !== 'Hidden' || resp.contactEmail !== 'Hidden') && (
                                  <div className="flex gap-2 pt-1">
                                    {resp.contactPhone !== 'Hidden' && (
                                      <a
                                        href={`tel:${resp.contactPhone}`}
                                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold text-center transition-all flex items-center justify-center space-x-1"
                                      >
                                        <Phone className="w-3 h-3" />
                                        <span>Call ({resp.contactPhone})</span>
                                      </a>
                                    )}
                                    {resp.contactEmail !== 'Hidden' && (
                                      <a
                                        href={`mailto:${resp.contactEmail}`}
                                        className="flex-1 py-1.5 px-2 border border-white/10 hover:bg-white/5 text-slate-300 rounded-lg text-[10px] font-bold text-center transition-all flex items-center justify-center space-x-1"
                                      >
                                        <span>Email</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 3 — My Notice Board Posts */}
        {myNotices.length > 0 && (
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>My Active Requests Board Posts</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myNotices.map((notice) => (
                <NoticeBoardCard
                  key={notice._id}
                  notice={notice}
                  viewerId={user?.id}
                  viewerRole={user?.role}
                  onRespond={handleNoticeRespond}
                  urgencyColors={URGENCY_COLORS}
                />
              ))}
            </div>
          </div>
        )}

        {/* Section 4 — Nearby blood banks */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-blue-400" />
            <span>Nearby Registered Blood Banks</span>
          </h3>

          {banksLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading nearby stock inventory...</div>
          ) : nearbyBanks.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/20 border border-white/5 rounded-2xl text-xs text-slate-500">
              No registered blood banks found within 50km coordinates radius.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {nearbyBanks.map((bank) => (
                <div
                  key={bank._id}
                  className="bg-slate-900 border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all"
                >
                  <div>
                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[9px] font-bold uppercase tracking-wider">
                      VERIFIED BANK
                    </span>
                    <h4 className="font-bold text-sm text-white mt-2 truncate">
                      {bank.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {bank.address}, {bank.city}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex gap-2">
                    <a
                      href={`tel:${bank.phone || '108'}`}
                      className="flex-1 py-2 border border-white/10 text-slate-300 rounded-lg text-xs font-bold text-center hover:bg-white/5 transition-all flex items-center justify-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <Link
                      to={`/blood-bank/${bank._id}`}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center space-x-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5 — My request history (accordion) */}
        {pastRequests.length > 0 && (
          <div className="border-t border-white/5 pt-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between py-4 text-slate-400 hover:text-white transition-colors"
            >
              <span className="font-bold text-sm">My past requests ({pastRequests.length})</span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHistory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fadeIn">
                {pastRequests.map((req) => (
                  <div
                    key={req._id}
                    className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 opacity-70"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-300">Patient: {req.patientName}</h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {req.bloodGroup} &bull; {req.unitsRequired} Units &bull; {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-slate-400 capitalize">
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hall of Fame statistics */}
        <HallOfFameSection />
      </div>
    </div>
  );
};

export default SeekerHomePage;
