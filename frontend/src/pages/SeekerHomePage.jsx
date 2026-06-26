import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';
import { HeartPulse, Search, MapPin, Plus, FileText, CheckCircle, Clock, ChevronDown, ChevronUp, Navigation, Phone, MessageSquare, Landmark, Building2, X, Loader2, ShieldCheck, Clipboard } from 'lucide-react';
import HallOfFameSection from '../components/shared/HallOfFameSection';
import NoticeBoardCard from '../components/shared/NoticeBoardCard';
import DonationInProgress from '../components/shared/DonationInProgress';
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

  // Facility selection modal state
  const [facilityModal, setFacilityModal] = useState({ open: false, requestId: null, donorId: null, donorName: '' });
  const [facilities, setFacilities] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedBloodBank, setSelectedBloodBank] = useState(null);
  const [useDetour, setUseDetour] = useState(false);
  const [approving, setApproving] = useState(false);
  const [facilityFilter, setFacilityFilter] = useState('');
  const [matchSuccess, setMatchSuccess] = useState({ open: false, matchObid: '' });

  // Request editing state and handlers
  const [editModal, setEditModal] = useState({ open: false, request: null });
  const [editForm, setEditForm] = useState({
    patientName: '',
    bloodGroup: '',
    bloodComponent: '',
    unitsRequired: 1,
    hospitalName: '',
    hospitalAddress: '',
    urgencyLevel: 'urgent'
  });

  const handleStartEdit = (req) => {
    setEditModal({ open: true, request: req });
    setEditForm({
      patientName: req.patientName || '',
      bloodGroup: req.bloodGroup || '',
      bloodComponent: req.bloodComponent || 'whole_blood',
      unitsRequired: req.unitsRequired || 1,
      hospitalName: req.hospitalName || '',
      hospitalAddress: req.hospitalAddress || '',
      urgencyLevel: req.urgencyLevel || 'urgent'
    });
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this blood request?')) return;
    try {
      await api.delete(`/requests/${requestId}`);
      toast.success('Blood request deleted successfully.');
      fetchUserData();
    } catch (err) {
      toast.error('Failed to delete request.');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await api.patch(`/requests/${editModal.request._id}`, editForm);
      toast.success('Blood request updated successfully.');
      setEditModal({ open: false, request: null });
      fetchUserData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request.');
    }
  };

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

  // ---- Approve Donor & Select Facility Workflow ----
  const openFacilitySelector = async (requestId, donorResponderId, donorName) => {
    setFacilityModal({ open: true, requestId, donorId: donorResponderId, donorName });
    setSelectedFacility(null);
    setSelectedHospital(null);
    setSelectedBloodBank(null);
    setUseDetour(false);
    setFacilityFilter('');
    setFacilitiesLoading(true);
    try {
      const res = await api.get('/hospitals/facilities');
      setFacilities(res.data.facilities || []);
    } catch (err) {
      toast.error('Failed to load approved facilities');
      setFacilities([]);
    } finally {
      setFacilitiesLoading(false);
    }
  };

  const closeFacilityModal = () => {
    setFacilityModal({ open: false, requestId: null, donorId: null, donorName: '' });
    setSelectedFacility(null);
    setSelectedHospital(null);
    setSelectedBloodBank(null);
    setUseDetour(false);
  };

  const handleApproveDonor = async () => {
    if (!selectedHospital) {
      toast.error('Please select a destination hospital');
      return;
    }
    if (useDetour && !selectedBloodBank) {
      toast.error('Please select a detour blood bank first');
      return;
    }
    setApproving(true);
    try {
      const res = await api.post('/donations/matches/approve', {
        requestId: facilityModal.requestId,
        donorId: facilityModal.donorId,
        hospitalId: selectedHospital.id,
        bloodBankId: useDetour ? selectedBloodBank.id : null
      });
      const createdObid = res.data.match?.matchObid || 'Generated';
      closeFacilityModal();
      fetchUserData();
      setMatchSuccess({ open: true, matchObid: createdObid });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve donor and create match');
    } finally {
      setApproving(false);
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
        <span className="flex items-center space-x-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold">
          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Accepted — Ready to coordinate</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold">
        <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>Pending — Notifying {responses.length || 12} donors nearby</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07070A] py-8 px-4 sm:px-6 lg:px-8 space-y-8 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-[#C0152A]/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] rounded-full bg-gradient-to-bl from-[#C0152A]/3 to-transparent blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 text-left relative z-10">
        {/* Section 1 — Immediate action hero */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card p-8 text-center space-y-6 relative overflow-hidden group"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-tr from-[#C0152A]/5 to-[#FF4D6A]/5 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <span className="text-[10px] bg-[#C0152A]/10 border border-[#C0152A]/20 text-[#C0152A] dark:text-white font-mono font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
              ID: {user?.onebloodId}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(user?.onebloodId);
                  toast.success('OneBlood ID copied!');
                }}
                className="hover:text-[#C0152A] dark:hover:text-red-400 transition-colors cursor-pointer animate-pulse-slow"
                title="Copy ID"
              >
                <Clipboard className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display">
            Need blood urgently?
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-body leading-relaxed">
            Create an emergency request or search our network of nearby individual donors and registered blood banks immediately.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={handleFindBlood}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#C0152A] to-[#E0243C] hover:brightness-110 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#C0152A]/25 hover:shadow-[#C0152A]/35 flex items-center justify-center space-x-2 active:scale-[0.98] transform cursor-pointer keep-white"
            >
              <Search className="w-5 h-5" />
              <span>Find Blood Now</span>
            </button>

            <Link
              to="/request/new"
              className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-white/[0.08] transition-all flex items-center justify-center space-x-2 active:scale-[0.98] transform"
            >
              <FileText className="w-5 h-5 text-[#C0152A] dark:text-[#FF4D6A]" />
              <span>Upload Doctor's Letter</span>
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400 pt-2 font-body">
            <MapPin className="w-4 h-4 text-[#C0152A] dark:text-[#FF4D6A] animate-pulse" />
            <span>
              Using location:{' '}
              <span className="text-slate-805 dark:text-white font-bold">
                {location.city} ({location.lat.toFixed(3)}, {location.lng.toFixed(3)})
              </span>
            </span>
            <button
              onClick={getGeolocation}
              disabled={gpsLoading}
              className="underline text-[#C0152A] hover:text-red-700 dark:text-red-400 dark:hover:text-white pl-1 font-semibold cursor-pointer"
            >
              {gpsLoading ? 'Locating...' : '(Sync GPS)'}
            </button>
          </div>
        </motion.div>

        {/* Section 2 — My active requests */}
        {activeRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span>My Active Emergency Requests</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRequests.map((req) => {
                const acceptedRes = req.responses?.find(r => r.status === 'accepted');
                return (
                  <motion.div
                    key={req._id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card glass-card-hover p-6 flex flex-col justify-between space-y-5 relative overflow-hidden"
                  >
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-[#C0152A]/5 to-transparent blur-xl pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white font-display">
                            Patient: {req.patientName}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-body">
                            {req.bloodGroup} &bull; {req.bloodComponent.replace('_', ' ').toUpperCase()} &bull; {req.unitsRequired} Units
                          </p>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(req.status, req.responses)}
                        </div>
                      </div>

                      <p className="text-xs text-[#C0152A] dark:text-[#FF4D6A] mt-4 bg-slate-50 dark:bg-black/30 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.04] font-body flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#C0152A] dark:text-[#FF4D6A] shrink-0" />
                        <span className="truncate text-slate-700 dark:text-slate-300 font-semibold">{req.hospitalName} ({req.hospitalAddress})</span>
                      </p>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleStartEdit(req)}
                          className="flex-1 py-2.5 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-205 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-white/[0.06] text-center cursor-pointer font-body"
                        >
                          Edit Details
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(req._id)}
                          className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-[#C0152A] dark:text-red-400 border border-red-500/20 dark:border-red-500/10 rounded-xl text-xs font-bold transition-all text-center cursor-pointer font-body"
                        >
                          Delete Request
                        </button>
                      </div>
                    </div>

                    {req.responses && req.responses.length > 0 && (
                      <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] space-y-3 relative z-10">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                          Donor Responses ({req.responses.length})
                        </span>
                        <div className="space-y-3">
                          {req.responses.map((resp, idx) => {
                            const isAccepted = resp.status === 'accepted';
                            const isDeclined = resp.status === 'declined';
                            const isTransport = resp.status === 'need_transport';
                            const isTomorrow = resp.status === 'donate_tomorrow';
                            
                            let badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20";
                            let statusText = resp.status;
                            if (isAccepted) {
                              badgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
                              statusText = "Accepted";
                            } else if (isDeclined) {
                              badgeStyle = "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20";
                              statusText = "Declined";
                            } else if (isTransport) {
                              badgeStyle = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
                              statusText = "Need Transport";
                            } else if (isTomorrow) {
                              badgeStyle = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20";
                              statusText = "Will Donate Tomorrow";
                            }

                            return (
                              <div key={idx} className="bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/[0.04] rounded-2xl p-4 space-y-3 text-left">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-800 dark:text-white font-body">
                                    {resp.responderName}
                                  </span>
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${badgeStyle}`}>
                                    {statusText}
                                  </span>
                                </div>
                                
                                {resp.message && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic font-body">
                                    "{resp.message}"
                                  </p>
                                )}

                                {!isDeclined && (resp.contactPhone !== 'Hidden' || resp.contactEmail !== 'Hidden') && (
                                  <div className="flex gap-2 pt-1">
                                    {resp.contactPhone !== 'Hidden' && (
                                      <a
                                        href={`tel:${resp.contactPhone}`}
                                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold text-center transition-all flex items-center justify-center space-x-1 keep-white"
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>Call ({resp.contactPhone})</span>
                                      </a>
                                    )}
                                    {resp.contactEmail !== 'Hidden' && (
                                      <a
                                        href={`mailto:${resp.contactEmail}`}
                                        className="flex-1 py-2 px-3 bg-slate-105 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-350 rounded-xl text-[10px] font-bold text-center transition-all flex items-center justify-center space-x-1"
                                      >
                                        <span>Email</span>
                                      </a>
                                    )}
                                  </div>
                                )}

                                {/* Approve Donor button — visible for accepted/pending responses (not declined) */}
                                {!isDeclined && req.status !== 'fulfilled' && (
                                  <button
                                    onClick={() => openFacilitySelector(req._id, resp.responderId, resp.responderName)}
                                    className="w-full mt-2 py-2.5 bg-gradient-to-r from-[#C0152A] to-red-700 hover:brightness-110 text-white rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm keep-white cursor-pointer"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Approve & Select Facility</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2.5 — Donation In Progress */}
        <DonationInProgress compact />

        {/* Section 3 — My Notice Board Posts */}
        {myNotices.length > 0 && (
          <div className="space-y-4 text-left">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span>My Active Notice Board Posts</span>
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
                  isOwner={true}
                  onApprove={(noticeId, responderId, responderName) => openFacilitySelector(noticeId, responderId, responderName)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Section 4 — Nearby blood banks */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-blue-500 dark:text-blue-450" />
            <span>Nearby Registered Blood Banks</span>
          </h3>

          {banksLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">Loading nearby stock inventory...</div>
          ) : nearbyBanks.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#0F0F1A]/20 border border-slate-200 dark:border-white/[0.05] rounded-3xl text-xs text-slate-500 shadow-sm backdrop-blur-md font-body leading-relaxed max-w-4xl">
              No registered blood banks found within 50km coordinates radius.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {nearbyBanks.map((bank) => (
                <div
                  key={bank._id}
                  className="glass-card glass-card-hover p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono">
                      VERIFIED BANK
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mt-3 truncate font-display">
                      {bank.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-body leading-relaxed">
                      {bank.address}, {bank.city}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex gap-2">
                    <a
                      href={`tel:${bank.phone || '108'}`}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-205 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center space-x-1 font-body"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <Link
                      to={`/blood-bank/${bank._id}`}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center space-x-1 font-body keep-white"
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
          <div className="border-t border-slate-200 dark:border-white/[0.06] pt-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between py-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span className="font-bold text-sm font-body">My past requests ({pastRequests.length})</span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHistory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fadeIn">
                {pastRequests.map((req) => (
                  <div
                    key={req._id}
                    className="glass-card p-5 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 font-display">Patient: {req.patientName}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-body">
                          {req.bloodGroup} &bull; {req.unitsRequired} Units &bull; {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-slate-100 dark:bg-white/[0.04] border border-slate-205 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 capitalize font-mono">
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

      {/* Facility Selection Modal */}
      <AnimatePresence>
        {facilityModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={closeFacilityModal} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative glass-card max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl z-10"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-white/[0.06] relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-905 dark:text-white font-display">Coordinate Hospital & Blood Bank</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-body">
                      Donor: <span className="text-[#C0152A] dark:text-[#FF4D6A] font-semibold">{facilityModal.donorName}</span>
                    </p>
                  </div>
                  <button onClick={closeFacilityModal} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>

                {/* Detour Switch */}
                <div className="mt-4 flex items-center justify-between bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.04] rounded-2xl p-4">
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block font-body">Add Transit Blood Bank step?</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-body">Collect or transfuse blood at blood bank first before going to hospital</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseDetour(!useDetour)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      useDetour ? 'bg-[#C0152A]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        useDetour ? 'transform translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Search */}
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search facilities by name or city..."
                    value={facilityFilter}
                    onChange={(e) => setFacilityFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.06] rounded-xl text-sm text-slate-805 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#C0152A]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Facility Lists Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Optional Transit Blood Bank Section */}
                {useDetour && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-purple-605 dark:text-purple-400 tracking-wider flex items-center gap-1 font-mono">
                      <Building2 className="w-4 h-4" /> 1. Select Transit Blood Bank (Optional)
                    </h4>
                    <div className="space-y-2 text-left">
                      {facilitiesLoading ? (
                        <div className="py-4 text-center text-xs text-slate-555 font-mono animate-pulse">Loading blood banks...</div>
                      ) : facilities.filter(f => f.type === 'BloodBank').length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-500 font-body">No blood banks found.</div>
                      ) : (
                        facilities
                          .filter(f => f.type === 'BloodBank')
                          .filter(f => {
                            const q = facilityFilter.toLowerCase();
                            return !q || f.name?.toLowerCase().includes(q) || f.city?.toLowerCase().includes(q);
                          })
                          .map((fac) => {
                            const isSelected = selectedBloodBank?.id === fac.id;
                            return (
                              <button
                                key={fac.id}
                                type="button"
                                onClick={() => setSelectedBloodBank(fac)}
                                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20'
                                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.04] hover:border-slate-350 dark:hover:border-white/[0.08]'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white block font-body">{fac.name}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-body">{fac.address}, {fac.city}</span>
                                  </div>
                                  {isSelected && <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />}
                                </div>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                {/* Mandatory Hospital Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1 font-mono">
                    <Building2 className="w-4 h-4" /> {useDetour ? '2. Select Mandatory Destination Hospital' : 'Select Mandatory Destination Hospital'}
                  </h4>
                  <div className="space-y-2 text-left">
                    {facilitiesLoading ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-mono animate-pulse">Loading hospitals...</div>
                    ) : facilities.filter(f => f.type === 'Hospital').length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-body">No approved hospitals found.</div>
                    ) : (
                      facilities
                        .filter(f => f.type === 'Hospital')
                        .filter(f => {
                          const q = facilityFilter.toLowerCase();
                          return !q || f.name?.toLowerCase().includes(q) || f.city?.toLowerCase().includes(q);
                        })
                        .map((fac) => {
                          const isSelected = selectedHospital?.id === fac.id;
                          return (
                            <button
                              key={fac.id}
                              type="button"
                              onClick={() => setSelectedHospital(fac)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
                                  : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.04] hover:border-slate-350 dark:hover:border-white/[0.08]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-bold text-slate-900 dark:text-white block font-body">{fac.name}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-body">{fac.address}, {fac.city}</span>
                                </div>
                                {isSelected && <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                              </div>
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-black/30">
                <button
                  onClick={handleApproveDonor}
                  disabled={!selectedHospital || (useDetour && !selectedBloodBank) || approving}
                  className="w-full py-3 bg-gradient-to-r from-[#C0152A] to-[#E0243C] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md keep-white"
                >
                  {approving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating Match...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Approve Donor & Confirm Matching</>
                  )}
                </button>
                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 text-center space-y-1 font-body">
                  {selectedHospital && (
                    <p>
                      Final destination hospital: <span className="text-slate-800 dark:text-white font-bold">{selectedHospital.name}</span>
                    </p>
                  )}
                  {useDetour && selectedBloodBank && (
                    <p>
                      Transit blood bank step: <span className="text-purple-650 dark:text-purple-400 font-bold">{selectedBloodBank.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Request Modal */}
      <AnimatePresence>
        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={() => setEditModal({ open: false, request: null })} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative glass-card max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl z-10"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-909 dark:text-white font-display">Edit Blood Request</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-body">Update request parameters</p>
                </div>
                <button onClick={() => setEditModal({ open: false, request: null })} className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              {/* Modal Body / Scrollable Form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">Patient Name</label>
                  <input
                    type="text"
                    value={editForm.patientName}
                    onChange={(e) => setEditForm({ ...editForm, patientName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">Blood Group</label>
                    <select
                      value={editForm.bloodGroup}
                      onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">Units Required</label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.unitsRequired}
                      onChange={(e) => setEditForm({ ...editForm, unitsRequired: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">Blood Component</label>
                  <select
                    value={editForm.bloodComponent}
                    onChange={(e) => setEditForm({ ...editForm, bloodComponent: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                  >
                    <option value="whole_blood">Whole Blood</option>
                    <option value="prbc">Packed Red Blood Cells (PRBC)</option>
                    <option value="platelets">Platelets</option>
                    <option value="plasma">Fresh Frozen Plasma (FFP)</option>
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">Hospital Name</label>
                  <input
                    type="text"
                    value={editForm.hospitalName}
                    onChange={(e) => setEditForm({ ...editForm, hospitalName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">Hospital Address</label>
                  <textarea
                    rows="2"
                    value={editForm.hospitalAddress}
                    onChange={(e) => setEditForm({ ...editForm, hospitalAddress: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">Urgency Level</label>
                  <select
                    value={editForm.urgencyLevel}
                    onChange={(e) => setEditForm({ ...editForm, urgencyLevel: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                  >
                    <option value="critical">Critical</option>
                    <option value="urgent">Urgent</option>
                    <option value="moderate">Moderate</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-black/35">
                <button
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-[#C0152A] hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer keep-white shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Match Success Modal */}
      <AnimatePresence>
        {matchSuccess.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass-card max-w-md w-full p-8 text-center space-y-6 shadow-2xl z-10"
            >
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl text-emerald-500">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">Donation Match Confirmed!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                  You have approved the donor. A unique Match ID has been generated for your record.
                </p>
              </div>

              {/* Match ID Display */}
              <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-mono">Matched OBID</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450 font-mono tracking-wide select-all block">
                  {matchSuccess.matchObid}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  to="/active-donations"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md keep-white"
                >
                  Go to Active Donations
                </Link>
                <button
                  onClick={() => setMatchSuccess({ open: false, matchObid: '' })}
                  className="w-full py-3 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-205 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeekerHomePage;
