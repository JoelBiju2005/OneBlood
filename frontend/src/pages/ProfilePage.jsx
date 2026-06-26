import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Phone, MapPin, Loader2, Save, Copy } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { scaleIn } from '../utils/animations';
import { motion } from 'framer-motion';

// Leaflet marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? <Marker position={position} /> : null;
};

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [coords, setCoords] = useState([12.9716, 77.5946]);
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
      await api.put('/auth/profile', {
        name: data.name,
        phone: data.phone,
        bio: data.bio,
        lat: coords[0],
        lng: coords[1]
      });

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

      await fetchMe();
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-ob-ink text-neutral-555">
        <Loader2 className="w-8 h-8 animate-spin text-ob-red-700 mr-3" />
        <span className="font-mono text-sm">Synchronizing profiles...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-ob-ink text-neutral-800 dark:text-ob-white py-12 px-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-ob-red-700/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-neutral-100 dark:bg-neutral-900/[0.01] blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 w-full text-left">
        
        {/* Header */}
        <div className="flex items-center space-x-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-ob-glass-border rounded-xl text-ob-red-700 shadow-sm">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-neutral-900 dark:text-ob-white leading-tight">Edit Profile</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Keep your personal and coordinates information accurate.</p>
          </div>
        </div>

        {/* Profile Card Summary */}
        <motion.div 
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center space-y-4 bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl shadow-card w-full"
        >
          <div className="w-20 h-20 rounded-full bg-ob-red-700/10 border border-ob-red-700/20 flex items-center justify-center text-2xl font-bold text-ob-red-700 tracking-wider">
            {user?.name ? user.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : 'OB'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-ob-white">{user?.name}</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize mt-1">
              {user?.role?.replace('_', ' ')}
              {user?.role === 'donor' && profileData?.bloodGroup && `  •  ${profileData.bloodGroup}`}
              {(profileData?.city || user?.city) && `  •  ${profileData?.city || user?.city}`}
            </p>
          </div>
          
          <div className="bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-xl px-5 py-3 flex flex-col items-center max-w-xs w-full shadow-inner">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-555 uppercase tracking-widest mb-1">OneBlood ID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-ob-red-700 tracking-wider">{user?.onebloodId}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(user?.onebloodId);
                  toast.success('OneBlood ID copied!');
                }}
                className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Copy className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Details Form fields */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl space-y-4 shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 pb-2">Basic Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-405 dark:text-neutral-500 uppercase block pl-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/25 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none transition-all"
                    {...register('name', { required: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-405 dark:text-neutral-500 uppercase block pl-1">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/25 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none transition-all font-mono"
                    {...register('phone', { required: true })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-405 dark:text-neutral-500 uppercase block pl-1">Bio / Status Message</label>
                <textarea
                  rows="3"
                  placeholder="Tell coordinators about yourself..."
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/25 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none transition-all resize-none"
                  {...register('bio')}
                />
              </div>
            </div>

            {/* Donor specs */}
            {user?.role === 'donor' && profileData && (
              <div className="bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl space-y-4 shadow-card">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 pb-2">Donor Details</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-405 uppercase block pl-1">Age</label>
                    <input type="number" min="18" max="65" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:outline-none rounded-xl text-xs text-neutral-900 dark:text-white" {...register('age')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-405 uppercase block pl-1">Weight (kg)</label>
                    <input type="number" min="45" max="150" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:outline-none rounded-xl text-xs text-neutral-900 dark:text-white" {...register('weight')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-405 uppercase block pl-1">Contact via</label>
                    <select className="w-full px-2 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer" {...register('preferredContactMethod')}>
                      <option value="call">Call</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">Street Address</label>
                  <input type="text" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none" {...register('address')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">City</label>
                    <input type="text" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none" {...register('city')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">Pincode</label>
                    <input type="text" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none font-mono" {...register('pincode')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">Last Transfusion Date</label>
                    <input type="date" max={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none font-mono" {...register('lastDonated')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">Medical Conditions</label>
                    <input type="text" placeholder="Mild asthma, allergies, etc." className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none" {...register('medicalConditions')} />
                  </div>
                </div>
              </div>
            )}

            {/* Blood Bank specifications */}
            {user?.role === 'blood_bank' && profileData && (
              <div className="bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl space-y-4 shadow-card">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 pb-2">Blood Bank Details</h3>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">Blood Bank Name</label>
                  <input type="text" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none" {...register('bankName')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">Registration No</label>
                    <input type="text" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none font-mono" {...register('registrationNumber')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">License No</label>
                    <input type="text" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none font-mono" {...register('licenseNumber')} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">Address Details</label>
                  <input type="text" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none" {...register('address')} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">City</label>
                    <input type="text" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none" {...register('city')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">District</label>
                    <input type="text" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none" {...register('district')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-455 uppercase block pl-1">Pincode</label>
                    <input type="text" className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none font-mono" {...register('pincode')} />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input type="checkbox" id="is24x7" className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-ob-red-700 focus:ring-ob-red-700/20 focus:outline-none accent-ob-red-700 cursor-pointer" {...register('is24x7')} />
                  <label htmlFor="is24x7" className="text-xs text-neutral-500 font-semibold cursor-pointer">Operating 24/7 Services</label>
                </div>
              </div>
            )}
          </div>

          {/* Coordinate select column */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-6 rounded-3xl space-y-4 shadow-card flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 pb-2">Geospatial Coordinates</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-xl text-left shadow-inner">
                  <span className="text-[9px] font-bold text-neutral-400 block uppercase">Latitude</span>
                  <span className="text-xs font-mono text-neutral-900 dark:text-ob-white font-bold">{coords[0].toFixed(6)}</span>
                </div>
                <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-xl text-left shadow-inner">
                  <span className="text-[9px] font-bold text-neutral-400 block uppercase">Longitude</span>
                  <span className="text-xs font-mono text-neutral-900 dark:text-ob-white font-bold">{coords[1].toFixed(6)}</span>
                </div>
              </div>

              {/* Map Selection */}
              <div className="h-64 w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-ob-glass-border relative z-10">
                <MapContainer center={coords} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  />
                  <LocationPicker position={coords} setPosition={setCoords} />
                </MapContainer>
                <div className="absolute bottom-2 left-2 z-[1000] bg-neutral-900/90 border border-neutral-700 px-2 py-1 rounded text-[10px] text-neutral-400 font-mono">
                  Click map to relocate marker
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-ob-red-700 hover:bg-red-800 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 shadow-glow-red"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
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
}
