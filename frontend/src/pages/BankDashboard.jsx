import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie } from 'recharts';
import { Landmark, Activity, HeartPulse, RefreshCw, BarChart2, Edit3, Save, CheckCircle2 } from 'lucide-react';

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
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-oneblood-midnight text-slate-400">
        <div className="w-8 h-8 border-2 border-oneblood-crimson border-t-transparent rounded-full animate-spin mr-2" />
        <span>Loading Bank Dashboard...</span>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-oneblood-midnight text-slate-400 space-y-4">
        <p className="text-sm font-semibold">No blood bank profile found for this account.</p>
        <p className="text-xs">Make sure you are registered as a blood bank admin.</p>
      </div>
    );
  }

  // Map analytics for Recharts
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
    <div className="min-h-[calc(100vh-80px)] bg-oneblood-midnight py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="text-left space-y-2 pb-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl font-bold text-white font-display flex items-center space-x-2">
                <Landmark className="w-6 h-6 text-blue-400" />
                <span>{bank.name}</span>
              </h1>
              {user?.onebloodId && (
                <span className="inline-flex items-center gap-1 bg-[#C0152A]/10 border border-[#C0152A]/30 text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-lg">
                  ID: {user.onebloodId}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.onebloodId);
                      toast.success('OneBlood ID copied!');
                    }}
                    className="hover:text-red-400 transition-colors cursor-pointer ml-1"
                    title="Copy ID"
                  >
                    📋
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Official Blood Bank Admin Center &bull; Registration: {bank.registrationNumber}
            </p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Low Stock Warning Banner */}
        {lowStockAlerts.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-left flex items-start space-x-3">
            <HeartPulse className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-red-400">Critical Stock Warning ({lowStockAlerts.length} items low)</h4>
              <p className="text-[11px] text-slate-400">
                The following blood components have dropped below the safe threshold of 5 units. Please coordinate donation campaigns or update stocks:
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {lowStockAlerts.slice(0, 8).map((alert, idx) => (
                  <span key={idx} className="text-[10px] bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-lg font-bold">
                    {alert.group} {alert.component} ({alert.qty} units)
                  </span>
                ))}
                {lowStockAlerts.length > 8 && (
                  <span className="text-[10px] bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded-lg font-bold">
                    + {lowStockAlerts.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Inventory matrix grid */}
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white font-display flex items-center space-x-2">
              <Activity className="w-5 h-5 text-oneblood-crimson" />
              <span>Real-time Inventory matrix</span>
            </h3>
            <span className="text-[10px] text-slate-500 italic bg-white/5 border border-white/5 px-2 py-0.5 rounded">
              ⚡ Debounced Sync: Cell edits auto-save to cloud after 1.5s
            </span>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-x-auto shadow-2xl p-4">
            <table className="w-full text-xs text-slate-300 min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-3 px-4 font-bold text-slate-400 text-left w-48">Blood Components</th>
                  {bloodGroupsList.map(bg => (
                    <th key={bg.key} className="py-3 px-2 font-bold text-center text-slate-400 w-16">{bg.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {componentsList.map(comp => (
                  <tr key={comp.key} className="hover:bg-white/5 transition-all">
                    <td className="py-3.5 px-4 font-bold text-white">{comp.label}</td>
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
                              className="w-12 py-1 px-1.5 bg-slate-950 border border-oneblood-crimson rounded text-center text-[11px] text-white focus:outline-none font-mono"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingCell({ component: comp.key, group: bg.key });
                                setTempQty(val.toString());
                              }}
                              className={`w-12 py-1.5 text-center font-bold font-mono rounded cursor-pointer transition-all border ${val >= 10 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : val > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'}`}
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

        {/* Analytics charts grid using Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* Chart 1: Monthly donation trends */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-white/5 p-6 rounded-2xl text-left space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <BarChart2 className="w-4 h-4 text-oneblood-gold" />
              <span>Monthly donation trends (2026)</span>
            </h3>
            
            <div className="h-72 w-full pt-4">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">No trend data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B91C1C" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#B91C1C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', fontSize: 11 }} />
                    <Area type="monotone" dataKey="donations" stroke="#B91C1C" fillOpacity={1} fill="url(#colorDonations)" name="Donations Logs" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Blood Group distribution Pie Chart */}
          <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 p-6 rounded-2xl text-left space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Blood group stock distribution</h3>
            
            <div className="h-72 w-full flex items-center justify-center pt-4">
              {groupData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">No stock data available</div>
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
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', fontSize: 11 }} />
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
