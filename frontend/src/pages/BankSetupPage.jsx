import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Landmark, MapPin, Phone, Mail, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix standard leaflet icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const centerIcon = L.divIcon({
  className: 'custom-center-marker',
  html: `<div class="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-blue-500 shadow-xl animate-pulse"><div class="w-3 h-3 bg-blue-500 rounded-full"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

const MapEventsHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
};

const BankSetupPage = () => {
  const { user, registerBankProfile } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [licNo, setLicNo] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [pincode, setPincode] = useState('');
  const [is24x7, setIs24x7] = useState(true);
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [coords, setCoords] = useState([12.9716, 77.5946]); // Default Bengaluru
  const [gpsLabel, setGpsLabel] = useState('📍 Fetching location...');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        setGpsLabel('📍 Precise GPS position set');
      },
      () => {
        fetch('https://ipapi.co/json/')
          .then(r => r.json())
          .then(data => {
            setCoords([data.latitude, data.longitude]);
            setGpsLabel('📍 Approx location set');
          })
          .catch(() => setGpsLabel('❌ GPS failed. Click on map.'));
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !regNo || !address || !pincode) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const bankData = {
        name,
        registrationNumber: regNo,
        licenseNumber: licNo,
        phone,
        email,
        address,
        city,
        district,
        state: 'Karnataka',
        pincode,
        lat: coords[0].toString(),
        lng: coords[1].toString(),
        operatingHours: { is24x7 },
        emergencyContact: emergencyPhone || phone
      };
      await registerBankProfile(bankData);
      toast.success('Blood bank profile completed successfully!');
      navigate('/dashboard/bank');
    } catch (err) {
      toast.error(err.message || 'Failed to complete bank setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-oneblood-midnight px-4 py-12">
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-oneblood-crimson/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-oneblood-gold/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900/60 border border-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl space-y-6 text-left">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/25 rounded-2xl text-blue-500 mb-2">
            <Landmark className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">Blood Bank Administrative Setup</h2>
          <p className="text-xs text-slate-400">Complete your profile to register your inventory and coordinate emergency requests.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital/Centre Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Red Cross Karnataka Blood Bank"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Number *</label>
              <input 
                type="text" 
                placeholder="e.g. KA-BB-DWD-001"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">License Number</label>
              <input 
                type="text" 
                placeholder="e.g. L-123/45"
                value={licNo}
                onChange={(e) => setLicNo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Telephone *</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email *</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Address *</label>
            <input 
              type="text" 
              placeholder="Building, Street, Area Name"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City *</label>
              <input 
                type="text" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">District *</label>
              <input 
                type="text" 
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pincode *</label>
              <input 
                type="text" 
                placeholder="560001"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operating Hours</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                  <input type="radio" checked={is24x7} onChange={() => setIs24x7(true)} className="accent-blue-500" />
                  <span>24x7 Operations</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                  <input type="radio" checked={!is24x7} onChange={() => setIs24x7(false)} className="accent-blue-500" />
                  <span>Standard Shift Hours</span>
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Hotline Contact</label>
              <input 
                type="tel" 
                placeholder="24/7 hotline phone"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Leaflet map pin selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Set coordinates on map *</span>
              <span className="text-blue-400">{gpsLabel}</span>
            </div>
            <div className="h-44 rounded-xl overflow-hidden border border-white/10 relative">
              <MapContainer center={coords} zoom={13} style={{ width: '100%', height: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <ChangeMapView center={coords} />
                <MapEventsHandler onMapClick={(pos) => {
                  setCoords(pos);
                  setGpsLabel('📍 Custom coordinates selected');
                }} />
                <Marker position={coords} icon={centerIcon} />
              </MapContainer>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-oneblood-crimson hover:bg-red-700 disabled:bg-red-900 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-red-700/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving setup details...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4.5 h-4.5" />
                <span>Save Setup & Enter Dashboard</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BankSetupPage;
