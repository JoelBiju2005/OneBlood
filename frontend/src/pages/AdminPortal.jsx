import React, { useState, useEffect } from 'react';
import api, { setAccessToken } from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { 
  Loader2, ShieldCheck, Users, Landmark, AlertCircle, Trash2, 
  Edit, CheckCircle, XCircle, Search, Lock, UserCheck, LogOut, Info, Settings
} from 'lucide-react';

const AdminPortal = () => {
  const { logout: normalLogout, user, isAuthenticated: isGloballyAuthenticated } = useAuthStore();
  const isAuthorizedAdmin = isGloballyAuthenticated && user?.role === 'admin';
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('adminPortalAuth') === 'true';
  });
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard Data state
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totals: {}, usersByRole: [], requestsByStatus: [], donorsByCity: [], bloodGroupDist: [] });
  const [users, setUsers] = useState([]);
  const [donors, setDonors] = useState([]);
  const [banks, setBanks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Modals state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '', city: '', isVerified: false });
  const [actionLoading, setActionLoading] = useState(null);

  // 1. Authenticate with exclusive credentials
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await api.post('/auth/admin-portal-login', {
        onebloodId: adminId.trim(),
        password: password
      });
      
      const { accessToken, user } = res.data;
      setAccessToken(accessToken);
      
      // Store in session storage so closing the browser logs out
      sessionStorage.setItem('adminPortalAuth', 'true');
      setIsAuthenticated(true);
      toast.success('Access Granted. Welcome to the Admin Portal.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access Denied: Invalid credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminPortalAuth');
    setIsAuthenticated(false);
    normalLogout();
    toast.success('Logged out of Admin Portal.');
  };

  // 2. Fetch specific tab data from Firestore
  const fetchDataForTab = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } else if (tab === 'users') {
        const res = await api.get('/admin/users?limit=200');
        setUsers(res.data.users || []);
      } else if (tab === 'donors') {
        const res = await api.get('/admin/donors');
        setDonors(res.data.donors || []);
      } else if (tab === 'banks') {
        const res = await api.get('/admin/banks');
        setBanks(res.data.banks || []);
      } else if (tab === 'requests') {
        const res = await api.get('/admin/requests');
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      toast.error('Failed to load portal logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated || isAuthorizedAdmin) {
      fetchDataForTab(activeTab);
    }
  }, [isAuthenticated, isAuthorizedAdmin, activeTab]);

  // 3. User operations (Edit/Delete)
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'patient',
      city: user.city || '',
      isVerified: user.isVerified || false
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setActionLoading(editingUser._id);
    try {
      const res = await api.put(`/admin/users/${editingUser._id}`, editForm);
      toast.success('User updated in database');
      
      // Update state locally
      setUsers(prev => prev.map(u => u._id === editingUser._id ? { ...u, ...editForm } : u));
      setEditingUser(null);
      fetchDataForTab(activeTab); // Refresh stats
    } catch (err) {
      toast.error('Failed to update user record');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user and all their associated profiles from Firestore?')) return;
    
    setActionLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User permanently deleted');
      setUsers(prev => prev.filter(u => u._id !== userId));
      fetchDataForTab(activeTab);
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDonor = async (donorId) => {
    if (!window.confirm('Delete this donor profile? The user account will remain but be downgraded to patient.')) return;
    setActionLoading(donorId);
    try {
      await api.delete(`/admin/donors/${donorId}`);
      toast.success('Donor profile deleted');
      fetchDataForTab(activeTab);
    } catch (err) {
      toast.error('Failed to delete donor profile');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBank = async (bankId) => {
    if (!window.confirm('Delete this blood bank profile? The user account will remain but be downgraded.')) return;
    setActionLoading(bankId);
    try {
      await api.delete(`/admin/banks/${bankId}`);
      toast.success('Blood bank profile deleted');
      fetchDataForTab(activeTab);
    } catch (err) {
      toast.error('Failed to delete bank profile');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVerifyBank = async (bankId, currentStatus) => {
    setActionLoading(bankId);
    try {
      await api.put(`/banks/${bankId}`, { isVerified: !currentStatus });
      toast.success(currentStatus ? 'Verification revoked' : 'Blood bank verified');
      fetchDataForTab(activeTab);
    } catch (err) {
      toast.error('Failed to toggle verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRequest = async (reqId) => {
    if (!window.confirm('Permanently delete this emergency request?')) return;
    setActionLoading(reqId);
    try {
      await api.delete(`/admin/requests/${reqId}`);
      toast.success('Emergency request deleted');
      setRequests(prev => prev.filter(r => r._id !== reqId));
      fetchDataForTab(activeTab);
    } catch (err) {
      toast.error('Failed to delete request');
    } finally {
      setActionLoading(null);
    }
  };

  // Filters for search query
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery) ||
    u.onebloodId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- LOGIN INTERFACE ---
  if (!isAuthenticated && !isAuthorizedAdmin) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-white flex items-center justify-center px-4 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/5 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-500/5 blur-[130px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-950/20">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">OneBlood Admin Portal</h2>
            <p className="text-xs text-slate-400">Exclusive security gateway access required</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Admin ID</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="OB-ADMIN"
                  className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs placeholder-slate-600 focus:outline-none focus:border-red-500 text-white pl-10"
                  required
                />
                <Users className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Secret Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs placeholder-slate-600 focus:outline-none focus:border-red-500 text-white pl-10"
                  required
                />
                <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-oneblood-crimson hover:bg-red-700 font-bold rounded-xl text-xs text-center flex items-center justify-center space-x-2 transition-all shadow-lg shadow-red-950/30 cursor-pointer"
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Access Database 🔑</span>}
            </button>
          </form>

          <div className="flex items-center space-x-2 bg-slate-950/60 border border-white/5 p-3.5 rounded-xl text-[10px] text-slate-500 text-left leading-relaxed">
            <Info className="w-5 h-5 text-oneblood-gold shrink-0" />
            <span>This workspace is restricted to authorized platform administrators only. All system actions are monitored.</span>
          </div>
        </div>
      </div>
    );
  }

  // --- PORTAL DASHBOARD INTERFACE ---
  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-white flex flex-col md:flex-row relative overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-900/60 border-b md:border-b-0 md:border-r border-white/5 p-5 flex flex-col justify-between shrink-0 relative z-20">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-white/5">
            <div className="p-2 bg-red-500/10 border border-red-500/25 rounded-xl text-red-500"><ShieldCheck className="w-6 h-6" /></div>
            <div>
              <h3 className="font-bold text-xs">Admin Console</h3>
              <p className="text-[10px] text-emerald-400 flex items-center"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"/>Secure Mode</p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Console Overview', icon: Settings },
              { id: 'users', label: 'Manage Users', icon: Users },
              { id: 'donors', label: 'Manage Donors', icon: ShieldCheck },
              { id: 'banks', label: 'Manage Blood Banks', icon: Landmark },
              { id: 'requests', label: 'Emergency Requests', icon: AlertCircle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${activeTab === tab.id ? 'bg-oneblood-crimson text-white shadow-lg shadow-red-950/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-950 hover:bg-red-500/15 border border-white/5 hover:border-red-500/25 text-red-400 hover:text-red-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Exit Portal</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10 text-left">
        {loading ? (
          <div className="h-[250px] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-2" />
            <p className="text-xs text-slate-500">Querying Firestore Database...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Database Overview</h1>
                  <p className="text-xs text-slate-400">Aggregated database counts and server metrics</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Registered Users', val: stats.totals?.totalUsers || 0, icon: Users, color: 'text-red-500 bg-red-500/10' },
                    { label: 'Active Blood Donors', val: stats.totals?.totalDonors || 0, icon: UserCheck, color: 'text-emerald-500 bg-emerald-500/10' },
                    { label: 'Blood Bank Hubs', val: stats.totals?.totalBanks || 0, icon: Landmark, color: 'text-blue-500 bg-blue-500/10' },
                    { label: 'Total Emergency Requests', val: stats.totals?.totalRequests || 0, icon: AlertCircle, color: 'text-amber-500 bg-amber-500/10' }
                  ].map((c, i) => (
                    <div key={i} className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${c.color}`}><c.icon className="w-6 h-6" /></div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">{c.label}</span>
                        <span className="text-xl font-bold font-mono">{c.val}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-900/60 border border-white/5 p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Users by Role Group</h3>
                    <div className="divide-y divide-white/5">
                      {stats.usersByRole?.map((r, i) => (
                        <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                          <span className="capitalize text-slate-300">{r._id?.replace('_', ' ') || 'Guest'}</span>
                          <span className="font-bold font-mono text-white bg-slate-950 px-2 py-0.5 rounded-md">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-white/5 p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Emergency Requests status</h3>
                    <div className="divide-y divide-white/5">
                      {stats.requestsByStatus?.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-4">No requests log.</p>
                      ) : (
                        stats.requestsByStatus?.map((r, i) => (
                          <div key={i} className="py-2.5 flex justify-between items-center text-xs">
                            <span className="capitalize text-slate-300">{r._id}</span>
                            <span className="font-bold font-mono text-white bg-slate-950 px-2 py-0.5 rounded-md">{r.count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: USERS */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h1 className="text-xl font-bold">User Registry</h1>
                    <p className="text-xs text-slate-400">Direct edit/delete capabilities for registered users</p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <input 
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 p-2.5 pl-9 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 placeholder-slate-600"
                    />
                    <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
                          <th className="p-4">Name / ID</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">City</th>
                          <th className="p-4">Verified</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.map(user => (
                          <tr key={user._id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-white">{user.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{user.onebloodId || 'No ID'}</p>
                            </td>
                            <td className="p-4 text-slate-300">{user.email}</td>
                            <td className="p-4 text-slate-300 font-mono">{user.phone}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                user.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                user.role === 'blood_bank' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                user.role === 'donor' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {user.role?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 text-slate-300">{user.city || '—'}</td>
                            <td className="p-4">
                              {user.isVerified ? (
                                <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                              ) : (
                                <XCircle className="w-4.5 h-4.5 text-slate-600" />
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex justify-center space-x-2">
                                <button 
                                  onClick={() => openEditModal(user)}
                                  className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg cursor-pointer"
                                  title="Edit User"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DONORS */}
            {activeTab === 'donors' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-xl font-bold">Donor Profiles</h1>
                  <p className="text-xs text-slate-400">Monitor and delete registered donor profiles</p>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-white/5">
                        <th className="p-4">Donor Name</th>
                        <th className="p-4">Group</th>
                        <th className="p-4">City</th>
                        <th className="p-4">Total Donations</th>
                        <th className="p-4">Last Donation</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {donors.map(donor => (
                        <tr key={donor._id} className="hover:bg-white/5">
                          <td className="p-4 font-bold text-white">{donor.userId?.name || donor.name || 'Unknown'}</td>
                          <td className="p-4"><span className="px-2 py-0.5 bg-red-500/20 text-red-400 font-bold rounded">{donor.bloodGroup}</span></td>
                          <td className="p-4 text-slate-300">{donor.city}</td>
                          <td className="p-4 font-mono">{donor.totalDonations}</td>
                          <td className="p-4 text-slate-400">{donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Never'}</td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => handleDeleteDonor(donor._id)}
                              className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg cursor-pointer"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: BANKS */}
            {activeTab === 'banks' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-xl font-bold">Blood Banks</h1>
                  <p className="text-xs text-slate-400">Verify, audit, or delete blood bank listings</p>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-white/5">
                        <th className="p-4">Bank Name</th>
                        <th className="p-4">Registration #</th>
                        <th className="p-4">City</th>
                        <th className="p-4">Verify Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {banks.map(bank => (
                        <tr key={bank._id} className="hover:bg-white/5">
                          <td className="p-4">
                            <p className="font-bold text-white">{bank.name}</p>
                            <p className="text-[10px] text-slate-500">{bank.address}</p>
                          </td>
                          <td className="p-4 font-mono">{bank.registrationNumber}</td>
                          <td className="p-4 text-slate-300">{bank.city}</td>
                          <td className="p-4">
                            <button 
                              onClick={() => handleToggleVerifyBank(bank._id, bank.isVerified)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${bank.isVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}
                            >
                              {bank.isVerified ? '✓ Verified' : 'Pending'}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => handleDeleteBank(bank._id)}
                              className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: REQUESTS */}
            {activeTab === 'requests' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-xl font-bold">Active Emergency Requests</h1>
                  <p className="text-xs text-slate-400">Moderate active request listings across the platform</p>
                </div>

                <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-white/5">
                        <th className="p-4">Patient Name</th>
                        <th className="p-4">Required Details</th>
                        <th className="p-4">Hospital</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {requests.map(req => (
                        <tr key={req._id} className="hover:bg-white/5">
                          <td className="p-4 font-bold text-white">{req.patientName}</td>
                          <td className="p-4">
                            <span className="font-bold text-red-500">{req.bloodGroup}</span> &bull; <span className="uppercase text-[10px] text-slate-400">{req.component?.replace('_', ' ')}</span> &bull; {req.unitsRequired} Unit(s)
                          </td>
                          <td className="p-4">
                            <p className="text-slate-300">{req.hospitalName}</p>
                            <p className="text-[10px] text-slate-500">{req.city}</p>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                              req.status === 'completed' ? 'bg-emerald-500/25 text-emerald-400' :
                              req.status === 'cancelled' ? 'bg-slate-800 text-slate-500' :
                              'bg-amber-500/25 text-amber-400 animate-pulse'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => handleDeleteRequest(req._id)}
                              className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-left animate-fadeIn">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
              <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                <Edit className="w-5 h-5 text-red-500" />
                <span>Edit User: {editingUser.name}</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white cursor-pointer font-bold">✕</button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Email Address</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Role Group</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="patient">Patient (Seeker)</option>
                    <option value="donor">Blood Donor</option>
                    <option value="blood_bank">Blood Bank</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">City</label>
                  <input 
                    type="text" 
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 py-2">
                <input 
                  type="checkbox"
                  id="isVerified"
                  checked={editForm.isVerified}
                  onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-slate-950 text-red-500 accent-red-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isVerified" className="text-xs font-bold text-slate-300 cursor-pointer select-none">Verify User Account</label>
              </div>

              <button 
                type="submit"
                disabled={actionLoading === editingUser._id}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-xs text-center flex items-center justify-center space-x-2 transition-all cursor-pointer mt-4"
              >
                {actionLoading === editingUser._id ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Save Changes to Database</span>}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
