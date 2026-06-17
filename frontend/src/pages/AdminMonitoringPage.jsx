import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Users, 
  Heart, 
  Building, 
  Activity, 
  MessageSquare, 
  Search, 
  Filter, 
  Loader2, 
  TrendingUp, 
  UserCheck,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  Award,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminMonitoringPage = () => {
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'users', 'donors', 'banks', 'requests', 'messages'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [donors, setDonors] = useState([]);
  const [banks, setBanks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);

  // Filter/Search states
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [requestStatus, setRequestStatus] = useState('all');
  
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null); // ID of expanded user/request row

  // Load active tab data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'stats') {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await api.get(`/admin/users?page=${userPage}&limit=10&search=${userSearch}&role=${userRole}`);
        setUsers(res.data.users);
        setTotalUserPages(res.data.pages);
      } else if (activeTab === 'donors') {
        const res = await api.get('/admin/donors');
        setDonors(res.data.donors);
      } else if (activeTab === 'banks') {
        const res = await api.get('/admin/banks');
        setBanks(res.data.banks);
      } else if (activeTab === 'requests') {
        const res = await api.get(`/admin/requests?status=${requestStatus}`);
        setRequests(res.data.requests);
      } else if (activeTab === 'messages') {
        const res = await api.get('/admin/messages?limit=100');
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin monitoring data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, userPage, userRole, requestStatus]);

  // Debounced search for users
  useEffect(() => {
    if (activeTab !== 'users') return;
    const delayDebounceFn = setTimeout(() => {
      setUserPage(1);
      fetchData();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearch]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 relative overflow-hidden">
      {/* Background radial overlays */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-950/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-widest">
              <Database className="w-4 h-4 animate-pulse" />
              <span>Core Control Panel</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white font-display">
              ADMIN MONITORING
            </h1>
            <p className="text-xs text-slate-400">
              Live statistics, donor database registry, hospital networks, and chat message rooms.
            </p>
          </div>
          
          <button 
            onClick={fetchData}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Refresh System Data
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-white/5 pb-1">
          {[
            { id: 'stats', label: 'Platform Stats', icon: TrendingUp },
            { id: 'users', label: 'Registered Users', icon: Users },
            { id: 'donors', label: 'Donors Registry', icon: Heart },
            { id: 'banks', label: 'Blood Banks', icon: Building },
            { id: 'requests', label: 'Blood Requests', icon: Activity },
            { id: 'messages', label: 'Chat Messages', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setExpandedRow(null);
                }}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-t-xl text-xs font-bold tracking-wide transition-all border-b-2 -mb-0.5 ${
                  isActive
                    ? 'border-red-500 text-white bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* LOADING SHIMMER */}
        {isLoading && !stats && users.length === 0 && donors.length === 0 && banks.length === 0 && requests.length === 0 && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <p className="text-xs text-slate-400">Fetching control logs...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. OVERVIEW & STATS TAB */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-8 animate-fadeIn">
                {/* Statistics Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Total Accounts', value: stats.totals?.totalUsers || 0, color: 'text-blue-400', icon: Users },
                    { label: 'Registered Donors', value: stats.totals?.totalDonors || 0, color: 'text-red-400', icon: Heart },
                    { label: 'Linked Blood Banks', value: stats.totals?.totalBanks || 0, color: 'text-emerald-400', icon: Building },
                    { label: 'Emergency Requests', value: stats.totals?.totalRequests || 0, color: 'text-amber-400', icon: Activity },
                    { label: 'Chat Logs Exchanged', value: stats.totals?.totalMessages || 0, color: 'text-indigo-400', icon: MessageSquare },
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div key={idx} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 space-y-2">
                        <div className="flex justify-between items-center text-slate-500">
                          <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Sub Distributions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Users by Role */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      Users By Role
                    </h3>
                    <div className="space-y-3">
                      {stats.usersByRole?.map((r) => (
                        <div key={r._id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-mono capitalize">{r._id}</span>
                          <span className="text-white font-bold bg-white/5 px-2.5 py-0.5 rounded-full">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requests by Status */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Requests By Status
                    </h3>
                    <div className="space-y-3">
                      {stats.requestsByStatus?.map((s) => (
                        <div key={s._id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-mono capitalize">{s._id}</span>
                          <span className="text-white font-bold bg-white/5 px-2.5 py-0.5 rounded-full">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Donors by City */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      Top Cities (Donors)
                    </h3>
                    <div className="space-y-3">
                      {stats.donorsByCity?.map((c) => (
                        <div key={c._id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">{c._id}</span>
                          <span className="text-white font-bold bg-white/5 px-2.5 py-0.5 rounded-full">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blood Group Distribution */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4 text-red-400" />
                      Blood Group Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
                      {stats.bloodGroupDist?.map((bg) => (
                        <div key={bg._id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-xs">
                          <span className="text-red-400 font-bold">{bg._id}</span>
                          <span className="text-slate-400 font-mono">{bg.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. REGISTERED USERS TAB */}
            {activeTab === 'users' && (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-6 animate-fadeIn">
                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or OneBlood ID..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={userRole}
                      onChange={(e) => {
                        setUserRole(e.target.value);
                        setUserPage(1);
                      }}
                      className="bg-slate-800 border border-white/10 px-4 py-3.5 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="seeker">Seeker</option>
                      <option value="donor">Donor</option>
                      <option value="blood_bank">Blood Bank Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-white/5 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-4">OneBlood ID</th>
                        <th className="p-4">User Details</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Joined Date</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-500">No users found matching parameters.</td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <React.Fragment key={u._id}>
                            <tr 
                              onClick={() => setExpandedRow(expandedRow === u._id ? null : u._id)}
                              className="hover:bg-white/5 transition-all cursor-pointer"
                            >
                              <td className="p-4 font-mono font-bold text-white">{u.onebloodId}</td>
                              <td className="p-4">
                                <div className="font-semibold text-white">{u.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                              </td>
                              <td className="p-4 font-mono text-[11px]">{u.phone}</td>
                              <td className="p-4 capitalize">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                                  u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' :
                                  u.role === 'blood_bank' ? 'bg-emerald-500/10 text-emerald-400' :
                                  u.role === 'donor' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {u.role === 'blood_bank' ? 'Blood Bank' : u.role}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-slate-500">{formatDate(u.createdAt)}</td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  {u.role === 'donor' && (u.donorProfileComplete ? (
                                    <span className="text-[9px] font-bold uppercase text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Profile Set</span>
                                  ) : (
                                    <span className="text-[9px] font-bold uppercase text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">Setup Pending</span>
                                  ))}
                                  {u.role === 'blood_bank' && (u.bankProfileComplete ? (
                                    <span className="text-[9px] font-bold uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Bank Setup</span>
                                  ) : (
                                    <span className="text-[9px] font-bold uppercase text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">Setup Pending</span>
                                  ))}
                                  {u.role === 'seeker' && <span className="text-[9px] text-slate-500 font-bold uppercase bg-white/5 px-1.5 py-0.5 rounded">Standard Seeker</span>}
                                  {u.role === 'admin' && <span className="text-[9px] text-indigo-400 font-bold uppercase bg-indigo-500/5 px-1.5 py-0.5 rounded">Super Admin</span>}
                                </div>
                              </td>
                            </tr>
                            {/* Expanded Details Row */}
                            {expandedRow === u._id && (
                              <tr className="bg-slate-900/80">
                                <td colSpan="6" className="p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
                                    <div className="space-y-1.5">
                                      <div className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Account Coordinates</div>
                                      <div className="font-mono text-slate-300">
                                        Lng: {u.location?.coordinates?.[0] ?? u.longitude ?? u.lng ?? 'N/A'}, Lat: {u.location?.coordinates?.[1] ?? u.latitude ?? u.lat ?? 'N/A'}
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Avatar Details</div>
                                      <div className="truncate text-slate-300">
                                        {u.avatar || 'No custom avatar configured'}
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">User Bio Description</div>
                                      <div className="italic text-slate-300">
                                        "{u.bio || 'This user has not set a custom biography.'}"
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalUserPages > 1 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Page {userPage} of {totalUserPages}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUserPage((p) => Math.max(p - 1, 1))}
                        disabled={userPage === 1}
                        className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 rounded-lg font-bold"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setUserPage((p) => Math.min(p + 1, totalUserPages))}
                        disabled={userPage === totalUserPages}
                        className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 rounded-lg font-bold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. DONORS REGISTRY TAB */}
            {activeTab === 'donors' && (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Medical Donors</h3>
                  <span className="text-xs text-slate-400">{donors.length} Profiles Registered</span>
                </div>
                
                <div className="overflow-x-auto border border-white/5 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-4">Donor Name</th>
                        <th className="p-4 text-center">Group</th>
                        <th className="p-4">Geographic Details</th>
                        <th className="p-4">Availability</th>
                        <th className="p-4 text-center">Donations</th>
                        <th className="p-4">Last Donated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                      {donors.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-500">No donor profiles exist in DB.</td>
                        </tr>
                      ) : (
                        donors.map((d) => (
                          <tr key={d._id} className="hover:bg-white/5 transition-all">
                            <td className="p-4">
                              <div className="font-semibold text-white">{d.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                <span>{d.userId?.onebloodId || 'OB-Seq'}</span>
                                <span>•</span>
                                <span>Age {d.age}</span>
                                <span>•</span>
                                <span className="capitalize">{d.gender}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-3 py-1 bg-red-600 text-white font-black text-xs rounded-lg shadow-sm">
                                {d.bloodGroup}
                              </span>
                            </td>
                            <td className="p-4">
                              <div>{d.city || 'Karnataka'}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{d.address}</div>
                            </td>
                            <td className="p-4">
                              {d.isAvailable ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  Available
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                                  Unavailable
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center font-bold font-mono text-white">{d.totalDonations || 0}</td>
                            <td className="p-4 font-mono text-[11px] text-slate-400">
                              {d.lastDonated ? formatDate(d.lastDonated) : 'Never Donated'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. BLOOD BANKS TAB */}
            {activeTab === 'banks' && (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hospital & Blood Bank Network</h3>
                  <span className="text-xs text-slate-400">{banks.length} Centers Registered</span>
                </div>

                <div className="overflow-x-auto border border-white/5 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-4">Center Details</th>
                        <th className="p-4">License / Reg</th>
                        <th className="p-4">Phone Contacts</th>
                        <th className="p-4">Inventory Totals</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                      {banks.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-500">No blood bank entries exist in database.</td>
                        </tr>
                      ) : (
                        banks.map((b) => {
                          // Calculate inventory sum
                          let totalUnits = 0;
                          if (b.inventory) {
                            Object.values(b.inventory).forEach((component) => {
                              if (typeof component === 'object') {
                                Object.values(component).forEach((count) => {
                                  if (typeof count === 'number') totalUnits += count;
                                });
                              }
                            });
                          }
                          return (
                            <tr key={b._id} className="hover:bg-white/5 transition-all">
                              <td className="p-4">
                                <div className="font-semibold text-white">{b.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                  <span>{b.city}, {b.state}</span>
                                  <span>•</span>
                                  <span>Admin: {b.adminUserId?.name || 'Assigned User'}</span>
                                </div>
                              </td>
                              <td className="p-4 font-mono font-semibold text-[11px] text-slate-400">{b.registrationNumber || 'N/A'}</td>
                              <td className="p-4">
                                <div>{b.phone}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{b.email}</div>
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                  {totalUnits} Units Stocked
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {b.isVerified ? (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. BLOOD REQUESTS TAB */}
            {activeTab === 'requests' && (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Emergency Requests Panel</h3>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={requestStatus}
                      onChange={(e) => setRequestStatus(e.target.value)}
                      className="bg-slate-800 border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="all">All Request Statuses</option>
                      <option value="pending">Pending Matches</option>
                      <option value="accepted">Accepted</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-white/5 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-4">Patient / Hospital</th>
                        <th className="p-4 text-center">Group</th>
                        <th className="p-4">Blood Component</th>
                        <th className="p-4">Urgency</th>
                        <th className="p-4">Requester</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                      {requests.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-500">No matching blood requests found.</td>
                        </tr>
                      ) : (
                        requests.map((r) => (
                          <tr key={r._id} className="hover:bg-white/5 transition-all">
                            <td className="p-4">
                              <div className="font-semibold text-white">{r.patientName}</div>
                              <div className="text-[10px] text-slate-500">{r.hospitalName}, {r.hospitalCity}</div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-3 py-1 bg-red-600 text-white font-black text-xs rounded-lg">
                                {r.bloodGroup}
                              </span>
                            </td>
                            <td className="p-4 capitalize">{r.bloodComponent?.replace('_', ' ') || 'Whole Blood'}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                                r.urgency === 'immediate' ? 'bg-red-500/10 text-red-400' :
                                r.urgency === 'urgent' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {r.urgency}
                              </span>
                            </td>
                            <td className="p-4">
                              <div>{r.requesterId?.name || 'Anonymous User'}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{r.requesterId?.phone}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                r.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-400' :
                                r.status === 'accepted' ? 'bg-blue-500/10 text-blue-400' :
                                r.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. CHAT MESSAGES TAB */}
            {activeTab === 'messages' && (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Chat Conversation Logs</h3>
                  <span className="text-xs text-slate-400">Showing Last {messages.length} Messages</span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No chat history exists in DB.</div>
                  ) : (
                    messages.map((m) => (
                      <div key={m._id} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1 hover:border-white/20 transition-all">
                        <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-white">{m.senderId?.name || 'System Sender'} ({m.senderId?.onebloodId})</span>
                            <span className="text-slate-500">➜</span>
                            <span className="text-slate-400">{m.receiverId?.name || 'System Receiver'} ({m.receiverId?.onebloodId})</span>
                          </div>
                          <span className="text-slate-500 font-mono">{formatDate(m.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-300 bg-black/20 p-2.5 rounded-lg font-mono break-words border border-white/5">
                          {m.text}
                        </p>
                        <div className="text-[9px] text-slate-500 font-mono">
                          Request Reference ID: {m.requestId || 'Global Broadcast'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default AdminMonitoringPage;
