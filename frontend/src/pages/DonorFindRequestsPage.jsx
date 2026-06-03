import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { HeartPulse, MapPin, Phone, Mail, Loader2, CheckCircle2, XCircle, Clock, Truck, Calendar } from 'lucide-react';

const DonorFindRequestsPage = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch donor profile
      const profRes = await api.get('/donors/profile');
      setProfile(profRes.data.donor);

      // 2. Fetch all active requests
      const reqsRes = await api.get('/requests');
      setRequests(reqsRes.data?.requests || []);
    } catch (err) {
      console.error('Failed to load requests:', err.message);
      toast.error('Failed to load active requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/accept`);
      toast.success('Donation request accepted! Seeker contact details unlocked.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request.');
    }
  };

  const handleDecline = async (requestId) => {
    try {
      await api.post(`/requests/${requestId}/decline`);
      toast.success('Request declined.');
      fetchData();
    } catch (err) {
      toast.error('Failed to decline request.');
    }
  };

  const handleCustomResponse = async (requestId, status, message) => {
    try {
      await api.post(`/requests/${requestId}/respond`, {
        responderType: 'donor',
        status,
        message
      });
      toast.success('Response recorded successfully.');
      fetchData();
    } catch (err) {
      toast.error('Failed to record response.');
    }
  };

  const getMyResponse = (request) => {
    if (!profile) return null;
    return request.responses?.find(
      (r) => r.responderId && r.responderId.toString() === profile._id.toString()
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-10 h-10 text-oneblood-crimson animate-spin mr-3" />
        <span>Finding emergency requests nearby...</span>
      </div>
    );
  }

  // Filter requests matching compatible blood group or general active ones, filtering out declined ones and checking notified list
  const activeRequests = requests.filter(r => {
    if (r.status !== 'active' && r.status !== 'accepted') return false;
    // Check if the current donor's ID is in the notifiedDonors list
    const isNotified = r.notifiedDonors?.some(
      (id) => profile && id?.toString() === profile._id?.toString()
    );
    if (!isNotified) return false;

    const myResp = getMyResponse(r);
    if (myResp && myResp.status === 'declined') return false;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-8 text-left relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-oneblood-crimson/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-oneblood-gold/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <h2 className="text-2xl font-extrabold text-white font-display tracking-wide">
            Requests you received
          </h2>
        </div>

        {activeRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-slate-900/30 border border-white/5 rounded-3xl text-center space-y-4">
            <div className="p-4 bg-slate-800/40 rounded-full text-slate-500">
              <HeartPulse className="w-10 h-10" />
            </div>
            <p className="text-base font-semibold text-slate-400">No requests received yet.</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Direct donor requests will appear here when patients or nearby seekers search for your blood type.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeRequests.map((req) => {
              const myResp = getMyResponse(req);
              
              // Determine status badge
              let statusBadge = (
                <span className="flex items-center space-x-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Pending</span>
                </span>
              );

              if (myResp) {
                if (myResp.status === 'accepted') {
                  statusBadge = (
                    <span className="flex items-center space-x-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>Accepted</span>
                    </span>
                  );
                } else if (myResp.status === 'declined') {
                  statusBadge = (
                    <span className="flex items-center space-x-1 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[10px] font-bold">
                      <XCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                      <span>Declined</span>
                    </span>
                  );
                } else if (myResp.status === 'need_transport') {
                  statusBadge = (
                    <span className="flex items-center space-x-1 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold">
                      <Truck className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                      <span>Need Transport</span>
                    </span>
                  );
                } else if (myResp.status === 'donate_tomorrow') {
                  statusBadge = (
                    <span className="flex items-center space-x-1 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-bold">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                      <span>Donate Tomorrow</span>
                    </span>
                  );
                }
              }

              return (
                <div
                  key={req._id}
                  className="bg-slate-900 border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xl hover:border-white/10 transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base text-white">
                          Patient: {req.patientName}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {req.bloodGroup} &bull; {req.bloodComponent.replace('_', ' ').toUpperCase()} &bull; {req.unitsRequired} Units
                        </p>
                      </div>
                      {statusBadge}
                    </div>

                    <p className="text-xs text-slate-400 bg-white/5 px-3 py-2 rounded-lg">
                      📍 {req.hospitalName} ({req.hospitalAddress || req.city})
                    </p>
                  </div>

                  {/* Actions / Response status */}
                  <div className="pt-4 border-t border-white/5">
                    {!myResp ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(req._id)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accept Request</span>
                          </button>
                          <button
                            onClick={() => handleDecline(req._id)}
                            className="flex-1 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCustomResponse(req._id, 'need_transport', 'Interested, but need transportation arrangement.')}
                            className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-400/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Need Transport</span>
                          </button>
                          <button
                            onClick={() => handleCustomResponse(req._id, 'donate_tomorrow', 'Can donate tomorrow.')}
                            className="flex-1 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-400/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>Donate Tomorrow</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-emerald-400 font-semibold">
                          You responded: <span className="text-white capitalize">{myResp.status.replace('_', ' ')}</span>
                        </p>
                        
                        {/* If accepted or cooperative, show seeker contact details */}
                        {myResp.status !== 'declined' && (
                          <div className="bg-white/5 rounded-xl p-3 space-y-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                              Seeker Contact Details
                            </span>
                            <div className="space-y-1">
                              <p className="text-xs text-slate-300">
                                <strong>Requester:</strong> {req.requesterId?.name || 'Patient Family'}
                              </p>
                              {req.phone && (
                                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                  <a href={`tel:${req.phone}`} className="hover:underline text-white font-semibold">
                                    {req.phone}
                                  </a>
                                </p>
                              )}
                              {req.requesterId?.email && (
                                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                                  <a href={`mailto:${req.requesterId.email}`} className="hover:underline text-white font-semibold">
                                    {req.requesterId.email}
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorFindRequestsPage;
