import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Phone, Mail, Globe, MapPin, Clock, Award, ShieldCheck, CornerUpRight, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const BloodBankDetailPage = () => {
  const { id } = useParams();
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const res = await api.get(`/banks/${id}`);
        setBank(res.data.bank);
      } catch (err) {
        toast.error('Failed to load blood bank details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBankDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-2" />
        <p className="text-xs text-slate-400">Loading blood bank details...</p>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-950 text-white px-4 text-center">
        <p className="text-sm font-bold text-white mb-2">Blood Bank Not Found</p>
        <Link to="/search" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold text-white transition-all">
          Back to Search Map
        </Link>
      </div>
    );
  }

  const [lng, lat] = bank.location?.coordinates || [77.5946, 12.9716];

  const bloodGroups = ['Apos', 'Aneg', 'Bpos', 'Bneg', 'ABpos', 'ABneg', 'Opos', 'Oneg'];
  const groupLabelMap = {
    Apos: 'A+', Aneg: 'A-',
    Bpos: 'B+', Bneg: 'B-',
    ABpos: 'AB+', ABneg: 'AB-',
    Opos: 'O+', Oneg: 'O-'
  };

  const components = [
    { key: 'wholeBlood', name: 'Whole Blood' },
    { key: 'packedRBC', name: 'Packed Red Blood Cells' },
    { key: 'freshFrozenPlasma', name: 'Fresh Frozen Plasma (FFP)' },
    { key: 'platelets', name: 'Platelets' },
    { key: 'cryoprecipitate', name: 'Cryoprecipitate' },
    { key: 'singleDonorPlatelets', name: 'Single Donor Platelets (SDP)' }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-white py-12 px-4 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-500/5 blur-[130px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10 w-full text-left font-sans">
        {/* Back Link */}
        <Link to="/search" className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </Link>

        {/* Profile Card Header */}
        <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] bg-red-500/10 border border-red-500/25 text-red-400 px-2 py-0.5 rounded-full font-bold">
                BLOOD BANK
              </span>
              {bank.isVerified && (
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight font-display">{bank.name}</h1>
            <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <span>{bank.address}, {bank.city}, {bank.state} - {bank.pincode}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <a 
              href={`tel:${bank.phone}`}
              className="flex-1 sm:flex-initial px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-1.5 transition-all shadow-lg shadow-red-700/10"
            >
              <Phone className="w-4 h-4" />
              <span>Call Bank</span>
            </a>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center space-x-1.5 transition-all"
            >
              <CornerUpRight className="w-4 h-4 text-amber-400" />
              <span>Directions</span>
            </a>
          </div>
        </div>

        {/* Main Grid: Details + Map */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Details column */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Inventory spreadsheet */}
            <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Blood Inventory Stock</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5">Component</th>
                      {bloodGroups.map(bg => (
                        <th key={bg} className="py-2.5 text-center">{groupLabelMap[bg]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {components.map(comp => (
                      <tr key={comp.key} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 font-semibold text-slate-300">{comp.name}</td>
                        {bloodGroups.map(bg => {
                          const quantity = bank.inventory?.[comp.key]?.[bg] || 0;
                          return (
                            <td key={bg} className="py-3 text-center">
                              <span className={`px-2 py-1 rounded font-mono font-semibold ${quantity === 0 ? 'bg-red-950/20 text-red-500 border border-red-500/10' : quantity < 5 ? 'bg-amber-950/20 text-amber-500 border border-amber-500/10' : 'bg-slate-800 text-slate-300'}`}>
                                {quantity}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contacts & Metadata info */}
            <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Information & Contacts</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 text-xs text-slate-300">
                  <div className="p-2 bg-white/5 rounded-lg text-slate-400"><Clock className="w-4 h-4" /></div>
                  <div>
                    <p className="font-bold text-slate-500 text-[10px] uppercase">Hours</p>
                    <p className="font-semibold">{bank.operatingHours?.is24x7 ? '24 Hours Emergency' : 'Standard Shift Hours'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-300">
                  <div className="p-2 bg-white/5 rounded-lg text-slate-400"><Mail className="w-4 h-4" /></div>
                  <div>
                    <p className="font-bold text-slate-500 text-[10px] uppercase">Email</p>
                    <a href={`mailto:${bank.email}`} className="font-semibold hover:underline truncate block max-w-[180px]">{bank.email}</a>
                  </div>
                </div>

                {bank.website && (
                  <div className="flex items-center space-x-3 text-xs text-slate-300">
                    <div className="p-2 bg-white/5 rounded-lg text-slate-400"><Globe className="w-4 h-4" /></div>
                    <div>
                      <p className="font-bold text-slate-500 text-[10px] uppercase">Website</p>
                      <a href={bank.website} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline truncate block max-w-[180px]">{bank.website}</a>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 text-xs text-slate-300">
                  <div className="p-2 bg-white/5 rounded-lg text-slate-400"><Award className="w-4 h-4" /></div>
                  <div>
                    <p className="font-bold text-slate-500 text-[10px] uppercase">Registration ID</p>
                    <p className="font-mono font-semibold">{bank.registrationNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Map column */}
          <div className="md:col-span-5 space-y-6">
            {/* Embedded Location Map */}
            <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Geospatial Location</h2>
              
              <div className="h-64 w-full rounded-xl overflow-hidden border border-white/10">
                <MapContainer center={[lat, lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[lat, lng]}>
                    <Popup>{bank.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed text-center font-semibold">
                Latitude: <span className="font-mono font-bold text-white">{lat.toFixed(6)}</span> | Longitude: <span className="font-mono font-bold text-white">{lng.toFixed(6)}</span>
              </div>
            </div>

            {/* Facilities list */}
            {bank.facilities && bank.facilities.length > 0 && (
              <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-1">Available Facilities</h2>
                <div className="flex flex-wrap gap-2 pt-1">
                  {bank.facilities.map(fac => (
                    <span key={fac} className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg font-bold text-slate-300">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default BloodBankDetailPage;
