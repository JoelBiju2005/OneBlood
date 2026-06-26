import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Landmark, Activity, HeartPulse, RefreshCw, BarChart2, Copy, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import DonationInProgress from '../components/shared/DonationInProgress';
import { scaleIn } from '../utils/animations';

export default function BankDashboard() {
  const { user } = useAuthStore();
  const [bank, setBank] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cell editing state
  const [editingCell, setEditingCell] = useState(null); // { component, group }
  const [tempQty, setTempQty] = useState('');
  const debounceTimer = useRef(null);

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
      const bankRes = await api.get('/banks/profile');
      setBank(bankRes.data.bank);
      setInventory(bankRes.data.bank.inventory);

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
      toast.success('Inventory synced with cloud');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to sync inventory update');
    }
  };

  const handleQtyChange = (compKey, groupKey, value) => {
    const qty = parseInt(value, 10) || 0;
    
    const updated = {
      ...inventory,
      [compKey]: {
        ...inventory[compKey],
        [groupKey]: qty
      }
    };
    setInventory(updated);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveInventoryUpdate(updated);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-ob-ink text-neutral-555">
        <Loader2 className="w-8 h-8 animate-spin text-ob-red-700 mr-3" />
        <span className="font-mono text-sm">Loading blood bank terminal...</span>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-ob-ink px-4">
        <div className="w-full max-w-md p-8 bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border rounded-3xl text-center space-y-4 shadow-card">
          <Landmark className="w-12 h-12 text-ob-red-700 mx-auto animate-bounce" />
          <h3 className="text-xl font-bold text-neutral-900 dark:text-ob-white font-display">Blood Bank Profile Not Found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            No profile details available. Verify registration or contact system coordinators.
          </p>
        </div>
      </div>
    );
  }

  const trendData = analytics?.monthlyTrends?.map(t => ({
    name: t.month,
    donations: t.donations,
    requests: t.requests
  })) || [];

  const donutColors = ['#B91C1C', '#D97706', '#059669', '#2563EB', '#7C3AED', '#DB2777', '#475569', '#0F172A'];

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
    <div className="min-h-screen bg-white dark:bg-ob-ink py-10 px-4 sm:px-6 lg:px-8 space-y-8 relative overflow-hidden transition-colors duration-300">
      
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full bg-blue-600/[0.02] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] rounded-full bg-ob-red-700/[0.02] blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10 text-left">
        
        {/* Profile Header */}
        <motion.div 
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="pb-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl font-display font-black text-neutral-900 dark:text-ob-white flex items-center space-x-2">
                <Landmark className="w-7 h-7 text-blue-500 shrink-0" />
                <span>{bank.name}</span>
              </h1>
              {user?.onebloodId && (
                <span className="inline-flex items-center gap-1.5 bg-ob-red-700/10 border border-ob-red-700/20 text-ob-red-700 dark:text-red-400 font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg">
                  <span>ID: {user.onebloodId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.onebloodId);
                      toast.success('Copied!');
                    }}
                    className="hover:text-neutral-950 dark:hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-550 dark:text-neutral-400">
              Admin Terminal &bull; Coordinates: {bank.city} &bull; Reg: {bank.registrationNumber}
            </p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-850 border border-neutral-250 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all active:scale-[0.97]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Records</span>
          </button>
        </motion.div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="bg-ob-red-700/5 border border-ob-red-700/20 p-5 rounded-3xl text-left flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-ob-red-700 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-ob-red-700 dark:text-red-400">Critical Stock Alert ({lowStockAlerts.length} items critical)</h4>
              <p className="text-xs text-neutral-555 dark:text-neutral-450 leading-relaxed">
                The following inventories have fallen below the clinical safety line (5 units). Update reserves immediately.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {lowStockAlerts.slice(0, 8).map((alert, idx) => (
                  <span key={idx} className="text-[10px] bg-ob-red-700/10 border border-ob-red-700/20 text-ob-red-700 dark:text-red-400 px-2.5 py-1 rounded-lg font-bold font-mono">
                    {alert.group} {alert.component} ({alert.qty} units)
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Inventory Matrix */}
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-ob-white font-display flex items-center space-x-2">
              <Activity className="w-5 h-5 text-ob-red-700 animate-pulse" />
              <span>Real-Time Inventory Ledger</span>
            </h3>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-250 dark:border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-1 font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Automated cloud sync after 1.5s delay</span>
            </span>
          </div>

          <div className="bg-neutral-50/50 dark:bg-ob-ink-90/30 border border-neutral-200 dark:border-ob-glass-border overflow-x-auto p-6 rounded-3xl backdrop-blur-md shadow-card">
            <table className="w-full text-xs text-neutral-600 dark:text-neutral-350 min-w-[700px]">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="py-3 px-4 font-bold text-neutral-500 text-left w-48 uppercase tracking-wider">Blood Components</th>
                  {bloodGroupsList.map(bg => (
                    <th key={bg.key} className="py-3 px-2 font-mono font-bold text-center text-neutral-500 w-16 uppercase tracking-wider">{bg.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60">
                {componentsList.map(comp => (
                  <tr key={comp.key} className="hover:bg-neutral-100/30 dark:hover:bg-white/[0.01] transition-all">
                    <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-ob-white">{comp.label}</td>
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
                              className="w-12 py-1 px-1.5 bg-neutral-100 dark:bg-neutral-950 border border-ob-red-700 rounded-lg text-center text-[11px] text-neutral-900 dark:text-ob-white focus:outline-none font-mono"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingCell({ component: comp.key, group: bg.key });
                                setTempQty(val.toString());
                              }}
                              className={`w-12 py-1.5 text-center font-bold font-mono rounded-lg cursor-pointer transition-all border active:scale-95 ${
                                val >= 10 
                                  ? 'bg-emerald-500/10 text-emerald-605 dark:text-emerald-450 border-emerald-500/20 hover:bg-emerald-500/20' 
                                  : val >= 5 
                                  ? 'bg-amber-500/10 text-amber-605 dark:text-amber-450 border-amber-500/20 hover:bg-amber-500/20' 
                                  : 'bg-ob-red-700/10 text-ob-red-700 border-ob-red-700/20 hover:bg-ob-red-700/20 animate-pulse'
                              }`}
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

        {/* Live Active Matching In Progress */}
        <DonationInProgress />

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          <div className="lg:col-span-8 bg-neutral-50/50 dark:bg-ob-ink-90/30 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl shadow-card">
            <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-widest flex items-center space-x-1.5">
              <BarChart2 className="w-4 h-4 text-ob-red-700" />
              <span>Transfusion Logs Analysis</span>
            </h3>
            
            <div className="h-72 w-full pt-4 font-mono text-[10px]">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-neutral-500">No chart data sync available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(185, 28, 28)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="rgb(185, 28, 28)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="name" stroke="#888" fontSize={9} />
                    <YAxis stroke="#888" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgb(24, 24, 28)', borderColor: 'rgba(255,255,255,0.08)', fontSize: 10, borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="donations" stroke="rgb(185, 28, 28)" fillOpacity={1} fill="url(#colorDonations)" name="Verified Transfusions" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 bg-neutral-50/50 dark:bg-ob-ink-90/30 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl shadow-card">
            <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-widest">Inventory distribution</h3>
            
            <div className="h-72 w-full flex items-center justify-center pt-4 font-mono">
              {groupData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-neutral-500">Inventory empty</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={groupData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {groupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgb(24, 24, 28)', borderColor: 'rgba(255,255,255,0.08)', fontSize: 10, borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
