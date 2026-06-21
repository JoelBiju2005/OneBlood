import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Landmark, Activity, HeartPulse, RefreshCw, BarChart2, CheckCircle2, Copy, Zap } from 'lucide-react';
import DonationInProgress from '../components/shared/DonationInProgress';

const BankDashboard = () => {
  const { user } = useAuthStore();
  const [bank, setBank] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cell editing state
  const [editingCell, setEditingCell] = useState(null); // { component, group }
  const [tempQty, setTempQty] = useState('');
  const debounceTimer = useRef(null);

  // Map inventory key names to frontend display values
  const componentsList = [
    { key: 'wholeBlood', label: 'Whole Blood' },
    { key: 'packedRBC', label: 'Packed RBC (PRBC)' },
    { key: 'freshFrozenPlasma', label: 'Fresh Frozen Plasma' },
    { key: 'platelets', label: 'Platelets' },
    { key: 'cryoprecipitate', label: 'Cryoprecipitate' },
    { key: 'singleDonorPlatelets', label: 'Single Donor Platelets (SDP)' }
  ];

  const bloodGroupsList = [
    { key: 'Apos', label: 'A+' },
    { key: 'Aneg', label: 'A-' },
    { key: 'Bpos', label: 'B+' },
    { key: 'Bneg', label: 'B-' },
    { key: 'ABpos', label: 'AB+' },
    { key: 'ABneg', label: 'AB-' },
    { key: 'Opos', label: 'O+' },
    { key: 'Oneg', label: 'O-' }
  ];

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Bank details
      const bankRes = await api.get('/banks/profile');
      setBank(bankRes.data.bank);
      setInventory(bankRes.data.bank.inventory);

      // 2. Fetch Analytics
      const analRes = await api.get('/analytics');
      setAnalytics(analRes.data);
    } catch (err) {
      toast.error('Failed to load bank records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const saveInventoryUpdate = async (updatedInventory) => {
    try {
      await api.put('/banks/inventory', { inventory: updatedInventory });
      toast.success('Inventory synced with server');
      fetchDashboardData(); // Refresh analytics
    } catch (err) {
      toast.error('Failed to sync inventory update');
    }
  };

  // Debounced auto-save handler
  const handleQtyChange = (compKey, groupKey, value) => {
    const qty = parseInt(value, 10) || 0;
    
    // Update local state instantly for snappy UI response
    const updated = {
      ...inventory,
      [compKey]: {
        ...inventory[compKey],
        [groupKey]: qty
      }
    };
    setInventory(updated);

    // Debounce the PUT request by 1.5 seconds
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveInventoryUpdate(updated);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 dark:bg-[#07070A] text-slate-500 dark:text-slate-450 transition-colors duration-300">
        <div className="w-8 h-8 border-2 border-[#C0152A] border-t-transparent rounded-full animate-spin mr-3" />
        <span className="font-semibold text-xs tracking-wider uppercase font-mono">Loading Bank Profile...</span>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#07070A] text-slate-555 dark:text-slate-400 space-y-4 transition-colors duration-300 px-4">
        <div className="w-full max-w-md p-8 bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] rounded-3xl text-center space-y-4 shadow-xl">
          <Landmark className="w-12 h-12 text-[#C0152A] mx-auto animate-bounce" />
          <h3 className="text-xl font-bold text-slate-805 dark:text-white font-display">Blood Bank Profile Not Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-body">
            No blood bank profile found for this account. Make sure you are registered as a blood bank admin, or contact support.
          </p>
        </div>
      </div>
    );
  }

  // Map analytics for Recharts
  const trendData = analytics?.monthlyTrends?.map(t => ({
    name: t.month,
    donations: t.donations,
    requests: t.requests
  })) || [];

  const donutColors = ['#C0152A', '#D97706', '#059669', '#2563EB', '#7C3AED', '#DB2777', '#475569', '#0F172A'];

  const groupData = bloodGroupsList.map((bg, idx) => {
    let count = 0;
    if (inventory) {
      componentsList.forEach(comp => {
        count += inventory[comp.key]?.[bg.key] || 0;
      });
    }
    return {
      name: bg.label,
      value: count,
      color: donutColors[idx % donutColors.length]
    };
  }).filter(g => g.value > 0);

  const lowStockAlerts = [];
  if (inventory) {
    componentsList.forEach(comp => {
      bloodGroupsList.forEach(bg => {
        const qty = inventory[comp.key]?.[bg.key] || 0;
        if (qty < 5) {
          lowStockAlerts.push({ component: comp.label, group: bg.label, qty });
        }
      });
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07070A] py-8 px-4 sm:px-6 lg:px-8 space-y-8 relative overflow-hidden transition-colors duration-300">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-blue-600/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] rounded-full bg-gradient-to-bl from-[#C0152A]/3 to-transparent blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10 text-left">
        
        {/* Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-6 border-b border-slate-200 dark:border-white/[0.06] flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white font-display flex items-center space-x-2">
                <Landmark className="w-7 h-7 text-blue-500 dark:text-blue-400" />
                <span>{bank.name}</span>
              </h1>
              {user?.onebloodId && (
                <span className="inline-flex items-center gap-1.5 bg-[#C0152A]/10 border border-[#C0152A]/20 text-[#C0152A] dark:text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg">
                  <span>ID: {user.onebloodId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.onebloodId);
                      toast.success('OneBlood ID copied!');
                    }}
                    className="hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
                    title="Copy ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-body">
              Official Blood Bank Admin Center &bull; Registration: {bank.registrationNumber}
            </p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm font-body"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Refresh Stats</span>
          </button>
        </motion.div>

        {/* Low Stock Warning Banner */}
        {lowStockAlerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl text-left flex items-start space-x-4 shadow-sm"
          >
            <HeartPulse className="w-6 h-6 text-[#C0152A] dark:text-red-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-[#C0152A] dark:text-red-400 font-body">Critical Stock Warning ({lowStockAlerts.length} items low)</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-body">
                The following blood components have dropped below the safe threshold of 5 units. Please coordinate donation campaigns or update stocks:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {lowStockAlerts.slice(0, 8).map((alert, idx) => (
                  <span key={idx} className="text-[10px] bg-red-500/20 border border-red-500/30 text-[#C0152A] dark:text-red-400 px-2.5 py-1 rounded-lg font-bold font-mono">
                    {alert.group} {alert.component} ({alert.qty} units)
                  </span>
                ))}
                {lowStockAlerts.length > 8 && (
                  <span className="text-[10px] bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg font-bold">
                    + {lowStockAlerts.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Real-time Inventory matrix grid */}
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#C0152A]" />
              <span>Real-time Inventory Matrix</span>
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] px-3 py-1.5 rounded-lg flex items-center gap-1 font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Debounced Sync: Cell edits auto-save to cloud after 1.5s</span>
            </span>
          </div>

          <div className="glass-card overflow-x-auto p-5">
            <table className="w-full text-xs text-slate-600 dark:text-slate-300 min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.06]">
                  <th className="py-3 px-4 font-bold text-slate-500 dark:text-slate-450 text-left w-48 font-body uppercase tracking-wider">Blood Components</th>
                  {bloodGroupsList.map(bg => (
                    <th key={bg.key} className="py-3 px-2 font-bold text-center text-slate-500 dark:text-slate-450 w-16 font-body uppercase tracking-wider">{bg.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {componentsList.map(comp => (
                  <tr key={comp.key} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-body">{comp.label}</td>
                    {bloodGroupsList.map(bg => {
                      const val = inventory?.[comp.key]?.[bg.key] || 0;
                      const isEditing = editingCell?.component === comp.key && editingCell?.group === bg.key;
                      
                      return (
                        <td key={bg.key} className="py-2.5 px-1 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={tempQty}
                              onChange={(e) => {
                                setTempQty(e.target.value);
                                handleQtyChange(comp.key, bg.key, e.target.value);
                              }}
                              onBlur={() => setEditingCell(null)}
                              className="w-12 py-1 px-1.5 bg-slate-100 dark:bg-slate-950 border border-[#C0152A] rounded-lg text-center text-[11px] text-slate-900 dark:text-white focus:outline-none font-mono"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingCell({ component: comp.key, group: bg.key });
                                setTempQty(val.toString());
                              }}
                              className={`w-12 py-1.5 text-center font-bold font-mono rounded-lg cursor-pointer transition-all border ${val >= 10 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : val > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 animate-pulse'}`}
                            >
                              {val}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donations In Progress — matches assigned to this blood bank */}
        <DonationInProgress />

        {/* Analytics charts grid using Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* Chart 1: Monthly donation trends */}
          <div className="lg:col-span-8 glass-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest flex items-center space-x-1.5 font-body">
              <BarChart2 className="w-4 h-4 text-amber-500" />
              <span>Monthly donation trends (2026)</span>
            </h3>
            
            <div className="h-72 w-full pt-4 font-mono">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-body">No trend data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C0152A" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#C0152A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#07070a', borderColor: 'rgba(255,255,255,0.06)', fontSize: 11, borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="donations" stroke="#C0152A" fillOpacity={1} fill="url(#colorDonations)" name="Donations Logs" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Blood Group distribution Pie Chart */}
          <div className="lg:col-span-4 glass-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-widest font-body">Blood group stock distribution</h3>
            
            <div className="h-72 w-full flex items-center justify-center pt-4 font-mono">
              {groupData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-body">No stock data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={groupData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {groupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#07070a', borderColor: 'rgba(255,255,255,0.06)', fontSize: 11, borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BankDashboard;
