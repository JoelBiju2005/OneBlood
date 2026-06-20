import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Phone, MapPin, Loader2, Save, HeartPulse, Building, Copy } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Click handler component to pick coordinates on Leaflet map
const LocationPicker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? <Marker position={position} /> : null;
};

const ProfilePage = () => {
  const { user, fetchMe } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [coords, setCoords] = useState([12.9716, 77.5946]); // default to Bengaluru center
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    const fetchSpecificProfile = async () => {
      setLoading(true);
      try {
        if (user.role === 'donor') {
          const res = await api.get('/donors/profile');
          const donorData = res.data.donor;
          setProfileData(donorData);
          const latVal = donorData.location?.coordinates?.[1] ?? parseFloat(donorData.latitude ?? donorData.lat);
          const lngVal = donorData.location?.coordinates?.[0] ?? parseFloat(donorData.longitude ?? donorData.lng);
          const lat = isNaN(latVal) ? 12.9716 : latVal;
          const lng = isNaN(lngVal) ? 77.5946 : lngVal;
          setCoords([lat, lng]);
          reset({
            name: user.name,
            phone: user.phone,
            bio: user.bio || '',
            age: donorData.age,
            weight: donorData.weight,
            address: donorData.address,
            city: donorData.city,
            pincode: donorData.pincode,
            preferredContactMethod: donorData.preferredContactMethod,
            lastDonated: donorData.lastDonated ? donorData.lastDonated.split('T')[0] : '',
            medicalConditions: donorData.medicalConditions ? donorData.medicalConditions.join(', ') : ''
          });
        } else if (user.role === 'blood_bank') {
          const res = await api.get('/banks/profile');
          const bankData = res.data.bank;
          setProfileData(bankData);
          const latVal = bankData.location?.coordinates?.[1] ?? parseFloat(bankData.latitude ?? bankData.lat);
          const lngVal = bankData.location?.coordinates?.[0] ?? parseFloat(bankData.longitude ?? bankData.lng);
          const lat = isNaN(latVal) ? 12.9716 : latVal;
          const lng = isNaN(lngVal) ? 77.5946 : lngVal;
          setCoords([lat, lng]);
          reset({
            name: user.name,
            phone: user.phone,
            bio: user.bio || '',
            bankName: bankData.name,
            registrationNumber: bankData.registrationNumber,
            licenseNumber: bankData.licenseNumber,
            address: bankData.address,
            city: bankData.city,
            district: bankData.district,
            pincode: bankData.pincode,
            is24x7: bankData.operatingHours?.is24x7
          });
        } else {
          // Patient or Admin
          reset({
            name: user.name,
            phone: user.phone,
            bio: user.bio || '',
          });
        }
      } catch (err) {
        toast.error('Failed to load profile details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSpecificProfile();
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      // 1. Update Base User profile details
      await api.put('/auth/profile', {
        name: data.name,
        phone: data.phone,
        bio: data.bio,
        lat: coords[0],
        lng: coords[1]
      });

      // 2. Update role-specific profile details
      if (user.role === 'donor' && profileData) {
        await api.put(`/donors/${profileData._id}`, {
          name: data.name,
          phone: data.phone,
          age: parseInt(data.age, 10),
          weight: parseInt(data.weight, 10),
          address: data.address,
          city: data.city,
          pincode: data.pincode,
          preferredContactMethod: data.preferredContactMethod,
          lat: coords[0].toString(),
          lng: coords[1].toString(),
          lastDonated: data.lastDonated || null,
          medicalConditions: data.medicalConditions ? data.medicalConditions.split(',').map(s => s.trim()).filter(Boolean) : []
        });
      } else if (user.role === 'blood_bank' && profileData) {
        await api.put(`/banks/${profileData._id}`, {
          name: data.bankName,
          phone: data.phone,
          registrationNumber: data.registrationNumber,
          licenseNumber: data.licenseNumber,
          address: data.address,
          city: data.city,
          district: data.district,
          pincode: data.pincode,
          lat: coords[0].toString(),
          lng: coords[1].toString(),
          operatingHours: {
            is24x7: data.is24x7
          }
        });
      }

      await fetchMe(); // update local storage state
      toast.success('Profile saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-2" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white py-12 px-4 relative overflow-hidden transition-colors duration-300">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/[0.02] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/[0.01] blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 w-full">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-slate-105 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[#C0152A] shadow-sm">
            {user?.role === 'blood_bank' ? <Building className="w-8 h-8" /> : <User className="w-8 h-8" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">Edit Profile</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keep your personal and geospatial contact details up to date</p>
          </div>
        </div>

        {/* Profile Identity Card (monospaced and crimson OneBlood ID card first) */}
        <div className="flex flex-col items-center text-center space-y-3 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-xl w-full">
          <div className="w-20 h-20 rounded-full bg-[#C0152A]/10 border border-[#C0152A]/30 flex items-center justify-center text-xl font-bold text-slate-900 dark:text-white tracking-wider">
            {user?.name ? user.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : 'OB'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {user?.role === 'blood_bank' ? 'Blood Bank Admin' : user?.role === 'seeker' ? 'Seeker' : user?.role}
              {user?.role === 'donor' && profileData?.bloodGroup && `  •  ${profileData.bloodGroup}`}
              {(profileData?.city || user?.city) && `  •  ${profileData?.city || user?.city}`}
            </p>
          </div>
          <div className="bg-slate-100/50 dark:bg-black/30 border border-slate-200 dark:border-[#C0152A]/30 rounded-xl px-4 py-3 flex flex-col items-center max-w-xs w-full">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">OneBlood ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-[#C0152A] tracking-wider">{user?.onebloodId}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(user?.onebloodId);
                  toast.success('OneBlood ID copied!');
                }}
                className="p-1.5 rounded bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-xs text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center"
                title="Copy ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Details Column */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl space-y-4 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Basic Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                    {...register('name', { required: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                    {...register('phone', { required: true })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bio / Description</label>
                <textarea
                  rows="3"
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 resize-none"
                  {...register('bio')}
                />
              </div>
            </div>

            {/* Donor Specific Details */}
            {user?.role === 'donor' && profileData && (
              <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl space-y-4 shadow-xl">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Donor Specifications</h2>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age</label>
                    <input type="number" min="18" max="65" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('age')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weight (kg)</label>
                    <input type="number" min="45" max="150" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('weight')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Method</label>
                    <select className="w-full px-2 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('preferredContactMethod')}>
                      <option value="call">Phone Call</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Residential Address</label>
                  <input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('address')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">City</label>
                    <input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('city')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pincode</label>
                    <input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('pincode')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Blood Donation Date</label>
                    <input type="date" max={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('lastDonated')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Health / Medical Conditions</label>
                    <input type="text" placeholder="E.g., Mild asthma, allergy (comma separated)" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('medicalConditions')} />
                  </div>
                </div>
              </div>
            )}

            {/* Blood Bank Specific Details */}
            {user?.role === 'blood_bank' && profileData && (
              <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl space-y-4 shadow-xl">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Blood Bank Information</h2>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Bank Name</label>
                  <input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('bankName')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registration Number</label>
                    <input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('registrationNumber')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">License Number</label>
                    <input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('licenseNumber')} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address Details</label>
                  <input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('address')} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">City</label>
                    <input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('city')} />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">District</label>
                    <input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('district')} />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pincode</label>
                    <input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none" {...register('pincode')} />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input type="checkbox" id="is24x7" className="w-4 h-4 bg-slate-900 border-white/10 rounded accent-red-600 focus:outline-none" {...register('is24x7')} />
                  <label htmlFor="is24x7" className="text-xs text-slate-400 font-semibold cursor-pointer">Operating 24x7 Emergency Services</label>
                </div>
              </div>
            )}
          </div>

          {/* Maps / Coordinates Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl space-y-4 shadow-xl flex flex-col">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">GPS Location</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-left">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Latitude</span>
                  <span className="text-xs font-mono text-white font-semibold">{coords[0].toFixed(6)}</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-left">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Longitude</span>
                  <span className="text-xs font-mono text-white font-semibold">{coords[1].toFixed(6)}</span>
                </div>
              </div>

              {/* Leaflet map selection */}
              <div className="h-64 w-full rounded-xl overflow-hidden border border-white/10 relative">
                <MapContainer center={coords} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <LocationPicker position={coords} setPosition={setCoords} />
                </MapContainer>
                <div className="absolute bottom-2 left-2 z-[1000] bg-slate-950/80 border border-white/10 px-2 py-1 rounded text-[10px] text-slate-400">
                  Click on map to place pin
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-950 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-red-700/10 hover:shadow-red-700/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
