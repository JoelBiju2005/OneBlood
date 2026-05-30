import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Phone, Mail, MapPin, HeartPulse, User, Calendar, Award, Lock, ShieldAlert, MessageSquare } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';

const DonorPublicProfilePage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [donor, setDonor] = useState(null);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealLoading, setRevealLoading] = useState(false);

  useEffect(() => {
    const fetchDonorDetails = async () => {
      try {
        // Fetch public details
        const res = await api.get(`/donors/${id}/profile`);
        setDonor(res.data.donor);
        
        // If authenticated, try to fetch gated contact details
        if (isAuthenticated) {
          try {
            const contactRes = await api.get(`/donors/${id}/contact`);
            setContact(contactRes.data.contact);
          } catch (err) {
            // 403 Forbidden is expected if not unlocked yet
            console.log('Contact details are locked for this user');
          }
        }
      } catch (err) {
        toast.error('Failed to load donor profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonorDetails();
  }, [id, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-2" />
        <p className="text-xs text-slate-400">Loading donor profile...</p>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-950 text-white px-4 text-center">
        <p className="text-sm font-bold text-white mb-2">Donor Profile Not Found</p>
        <Link to="/search" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold text-white transition-all">
          Back to Search Map
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-white py-12 px-4 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/5 blur-[130px] pointer-events-none" />

      <div className="max-w-2xl mx-auto space-y-8 relative z-10 w-full text-left font-sans">
        
        {/* Profile Card Header */}
        <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl">
              <User className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] bg-red-500/10 border border-red-500/25 text-red-400 px-2 py-0.5 rounded-full font-bold">
                VERIFIED DONOR
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white leading-tight font-display">{donor.name}</h1>
                {donor.onebloodId && (
                  <span className="font-mono text-xs border border-[#C0152A]/50 text-[#C0152A] px-2 py-0.5 rounded-full font-bold">
                    [{donor.onebloodId}]
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>{donor.city}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-sm font-bold text-slate-400">Blood Group</span>
            <span className="text-3xl font-extrabold bg-red-600/20 border border-red-500/30 text-red-500 px-4 py-1.5 rounded-2xl animate-pulse">
              {donor.bloodGroup}
            </span>
          </div>
        </div>

        {/* Main content split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Public info list */}
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Donor Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="text-slate-500 font-semibold">Availability</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${donor.isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {donor.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="text-slate-500 font-semibold">Age</span>
                <span className="font-semibold text-white">{donor.age} Years</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="text-slate-500 font-semibold">Weight</span>
                <span className="font-semibold text-white">{donor.weight} kg</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="text-slate-500 font-semibold">Gender</span>
                <span className="font-semibold text-white capitalize">{donor.gender}</span>
              </div>

              {donor.eligibleToDonateSince && (
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="text-slate-500 font-semibold">Next Eligible Donation</span>
                  <span className="font-semibold text-emerald-400">
                    {new Date(donor.eligibleToDonateSince) <= new Date() ? 'Eligible Now' : new Date(donor.eligibleToDonateSince).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-300">
                <span className="text-slate-500 font-semibold">Total Donations</span>
                <span className="font-semibold text-white">{donor.totalDonations} drop{donor.totalDonations !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Badges and certificates */}
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Honorary Badges</h2>
            
            {donor.badges && donor.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {donor.badges.map(badge => (
                  <span key={badge} className="text-[10px] bg-amber-500/10 border border-amber-500/25 text-amber-400 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>{badge}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed italic pt-2">No badges unlocked yet. Keep saving lives to earn honorary recognitions!</p>
            )}
          </div>
        </div>

        {/* Bio & Health Profile */}
        {(donor.bio || (donor.medicalConditions && donor.medicalConditions.length > 0) || donor.lastDonated) && (
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-6 animate-fadeIn">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Health & About Profile</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {donor.bio && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">About Donor (Bio)</span>
                  <p className="text-xs text-slate-300 italic">"{donor.bio}"</p>
                </div>
              )}
              
              {donor.lastDonated && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Last Donated Blood</span>
                  <p className="text-xs text-slate-300 font-semibold">
                    {new Date(donor.lastDonated).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {donor.medicalConditions && donor.medicalConditions.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Seeker-Critical Health Considerations</span>
                <div className="flex flex-wrap gap-2">
                  {donor.medicalConditions.map((condition, idx) => (
                    <span key={idx} className="text-[10px] bg-red-500/10 border border-red-500/25 text-red-400 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{condition}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Locked/Unlocked Gated details */}
        <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">Gated Contact Details</h2>

          {contact ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-xs text-slate-300 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-400"><Phone className="w-4 h-4" /></div>
                <div>
                  <p className="font-bold text-slate-500 text-[10px] uppercase">Phone Number</p>
                  <a href={`tel:${contact.phone}`} className="font-semibold hover:underline block">{contact.phone}</a>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-300 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><MessageSquare className="w-4 h-4" /></div>
                <div>
                  <p className="font-bold text-slate-500 text-[10px] uppercase">WhatsApp</p>
                  <a href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline block">Send Chat Message</a>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-300 p-3 bg-white/5 rounded-xl border border-white/5 sm:col-span-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Mail className="w-4 h-4" /></div>
                <div>
                  <p className="font-bold text-slate-500 text-[10px] uppercase">Email Address</p>
                  <a href={`mailto:${contact.email}`} className="font-semibold hover:underline block">{contact.email}</a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-950/40 border border-amber-500/10 rounded-xl text-center space-y-3 flex flex-col items-center">
              <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-xs font-bold text-white">Contact details locked</p>
              <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                To protect donor privacy, contact information (phone number, email, address) is completely hidden. 
                Please broadcast or target this donor with an emergency request on the <Link to="/search" className="text-red-500 font-bold hover:underline">Search Map</Link>. Once they accept, their contact details will be automatically unlocked here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorPublicProfilePage;
