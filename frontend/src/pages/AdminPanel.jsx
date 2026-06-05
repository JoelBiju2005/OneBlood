import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Loader2, ShieldCheck, Users, Landmark, AlertCircle, Trash2, CheckCircle, XCircle, Copy } from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ users: 0, donors: 0, banks: 0, requests: 0 });
  const [banks, setBanks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [banksRes, requestsRes, donorsRes] = await Promise.all([
          api.get('/banks'),
          api.get('/requests'),
          api.get('/donors')
        ]);
        
        const rawBanks = banksRes.data.banks || [];
        const rawRequests = requestsRes.data.requests || [];
        const rawDonors = donorsRes.data.donors || [];

        setBanks(rawBanks);
        setRequests(rawRequests);
        
        // Calculate counts
        setStats({
          users: rawDonors.length + rawBanks.length + 5, // mock total users
          donors: rawDonors.length,
          banks: rawBanks.length,
          requests: rawRequests.length
        });
      } catch (err) {
        toast.error('Failed to retrieve administrative logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleVerifyBank = async (bankId, currentStatus) => {
    setActionLoading(bankId);
    try {
      await api.put(`/banks/${bankId}`, {
        isVerified: !currentStatus
      });
      toast.success(currentStatus ? 'Verification revoked' : 'Blood bank verified successfully');
      setBanks(banks.map(b => b._id === bankId ? { ...b, isVerified: !currentStatus } : b));
    } catch (err) {
      toast.error('Failed to change verification status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRequest = async (reqId) => {
    setActionLoading(reqId);
    try {
      await api.delete(`/admin/requests/${reqId}`);
      toast.success('Request deleted successfully');
      setRequests(requests.filter(r => r._id !== reqId));
      setStats(prev => ({ ...prev, requests: prev.requests - 1 }));
    } catch (err) {
      toast.error('Failed to delete request');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-2" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading admin panel logs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white py-12 px-4 relative overflow-hidden transition-colors duration-300">
      {/* Background blurs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/5 blur-[130px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 w-full text-left font-sans">
        
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-200 dark:border-white/5 pb-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Super Admin Dashboard</h1>
              {user?.onebloodId && (
                <span className="inline-flex items-center gap-1.5 bg-[#C0152A]/10 border border-[#C0152A]/30 text-[#C0152A] dark:text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg">
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
            <p className="text-xs text-slate-500 dark:text-slate-400">Platform moderation, verification center, and request logs</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Donors</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{stats.donors}</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Landmark className="w-6 h-6" /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Blood Banks</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{stats.banks}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><AlertCircle className="w-6 h-6 animate-pulse" /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Active Requests</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{stats.requests}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Verified Banks</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{banks.filter(b => b.isVerified).length}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Blood Banks Moderation */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm dark:shadow-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-150 dark:border-white/5 pb-2">Blood Bank Verifications</h2>
            
            <div className="space-y-3 overflow-y-auto max-h-[400px]">
              {banks.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">No blood banks registered on this system.</p>
              ) : (
                banks.map(bank => (
                  <div key={bank._id} className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl flex justify-between items-center gap-4 shadow-inner">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{bank.name}</p>
                      <p className="text-[10px] text-slate-550 dark:text-slate-500 truncate">{bank.registrationNumber} | {bank.city}</p>
                    </div>
                    <button
                      onClick={() => handleVerifyBank(bank._id, bank.isVerified)}
                      disabled={actionLoading === bank._id}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${bank.isVerified ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30'}`}
                    >
                      {actionLoading === bank._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : bank.isVerified ? 'Revoke Verify' : 'Verify'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Requests Moderation */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm dark:shadow-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400 border-b border-slate-150 dark:border-white/5 pb-2">Active Emergency Requests</h2>
            
            <div className="space-y-3 overflow-y-auto max-h-[400px]">
              {requests.length === 0 ? (
                <p className="text-xs text-slate-550 italic text-center py-4">No active emergency requests found.</p>
              ) : (
                requests.map(req => (
                  <div key={req._id} className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl flex justify-between items-center gap-4 shadow-inner">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{req.patientName}</p>
                      <p className="text-[10px] text-slate-550 dark:text-slate-500 truncate">
                        Need <span className="text-red-650 dark:text-red-500 font-bold">{req.bloodGroup}</span> at {req.hospitalName}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteRequest(req._id)}
                      disabled={actionLoading === req._id}
                      className="p-2 bg-red-650/10 hover:bg-red-650/20 text-red-600 dark:text-red-500 rounded-lg transition-all cursor-pointer"
                    >
                      {actionLoading === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
