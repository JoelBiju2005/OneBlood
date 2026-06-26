import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { HeartPulse, User, Mail, Phone, Lock, Landmark, Heart, Loader2, Eye, EyeOff, MapPin, AlertCircle, Quote } from 'lucide-react';
import Logo from '../components/shared/Logo';
import { motion, AnimatePresence } from 'framer-motion';

const CITIES = [
  'Bengaluru',
  'Hubballi',
  'Dharwad',
  'Belagavi',
  'Mangaluru',
  'Mysuru',
  'Hyderabad',
  'Secunderabad',
  'Vijayawada',
  'Visakhapatnam'
];

const TESTIMONIALS = [
  {
    text: "India needs structured, fast donor dispatching. OneBlood does exactly that—ensuring emergency requests get matched instantly, saving lives during crucial golden hours.",
    author: "Karan Johar",
    role: "Red Cross Volunteer",
    stat: "Verified Partner"
  },
  {
    text: "I registered in under two minutes. Knowing my identity is encrypted and only shared with verified patients is why I choose OneBlood for my regular donations.",
    author: "Shreya Ghoshal",
    role: "Active A+ Donor",
    stat: "5 Donations Logged"
  }
];

export default function SignupPage() {
  const { register: registerUser, isLoading, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user && !isSubmitting) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, user, isSubmitting, navigate]);

  // Cycle testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [selectedRole, setSelectedRole] = useState(() => {
    if (location.state?.role) return location.state.role;
    const searchParams = new URLSearchParams(location.search);
    const roleParam = searchParams.get('role');
    if (roleParam && ['donor', 'seeker', 'blood_bank', 'hospital'].includes(roleParam)) {
      return roleParam;
    }
    return null;
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    city: 'Hubballi',
    bankName: '',
    hospitalName: '',
    registrationNumber: '',
    hospitalType: 'Private',
    address: '',
    state: 'Karnataka',
    pincode: '',
    emergencyContact: '',
    website: '',
    authorizedPersonName: '',
    designation: '',
    lat: '15.3647',
    lng: '75.1240'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-neutral-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score === 1 || pass.length < 8) return { score: 1, label: 'Weak', color: 'bg-red-500 w-1/3' };
    if (score === 2) return { score: 2, label: 'Good', color: 'bg-amber-500 w-2/3' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500 w-full' };
  };

  const strength = calculatePasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const validateForm = () => {
    const { name, email, phone, password, city, bankName, hospitalName, registrationNumber, hospitalType, emergencyContact } = formData;
    
    if (selectedRole === 'hospital') {
      if (!hospitalName || !registrationNumber || !hospitalType || !emergencyContact || !email || !password) {
        toast.error('All hospital required fields are required.');
        return false;
      }
    } else {
      if (!name || !email || !phone || !password || !city) {
        toast.error('All standard fields are required.');
        return false;
      }
      if (selectedRole === 'blood_bank' && !bankName) {
        toast.error('Please specify your Hospital/Bank name.');
        return false;
      }
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let extraData = {};
      let nameToSubmit = formData.name;

      if (selectedRole === 'blood_bank') {
        nameToSubmit = `${formData.name} (${formData.bankName})`;
      } else if (selectedRole === 'hospital') {
        nameToSubmit = formData.hospitalName;
        extraData = {
          hospitalName: formData.hospitalName,
          registrationNumber: formData.registrationNumber,
          hospitalType: formData.hospitalType,
          address: formData.address,
          state: formData.state,
          pincode: formData.pincode,
          emergencyContact: formData.emergencyContact,
          website: formData.website,
          authorizedPersonName: formData.authorizedPersonName,
          designation: formData.designation,
          lat: formData.lat,
          lng: formData.lng
        };
      }

      const user = await registerUser(
        nameToSubmit,
        formData.email,
        selectedRole === 'hospital' ? formData.emergencyContact : formData.phone,
        formData.password,
        selectedRole,
        formData.city,
        extraData
      );

      toast.success('Registration successful!');
      navigate('/welcome', { 
        state: { 
          isNewUser: true, 
          onebloodId: user.onebloodId, 
          name: user.name,
          role: user.role
        },
        replace: true
      });
    } catch (err) {
      setIsSubmitting(false);
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-ob-ink transition-colors duration-300">
      
      {/* LEFT VISUAL PANEL */}
      <div className="hidden md:flex md:w-[40%] lg:w-[45%] bg-gradient-to-br from-ob-red-955 via-ob-red-900 to-ob-red-955 p-12 text-white relative flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.35),transparent_80%)] pointer-events-none" />
        
        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Logo size="lg" showText={false} />
          <div>
            <h2 className="text-xl font-display font-black tracking-tight text-white leading-none">OneBlood</h2>
            <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-red-300">Onboarding Center</span>
          </div>
        </div>

        {/* Testimonials */}
        <div className="relative z-10 max-w-xl pr-8 my-auto">
          <Quote className="w-12 h-12 text-red-400/40 mb-6" />
          <div className="min-h-[140px] relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <p className="text-lg md:text-xl font-light leading-relaxed text-red-100 font-sans">
                  "{TESTIMONIALS[testimonialIndex].text}"
                </p>
                <div>
                  <h4 className="font-bold text-white text-sm">{TESTIMONIALS[testimonialIndex].author}</h4>
                  <p className="text-xs text-red-300">{TESTIMONIALS[testimonialIndex].role}</p>
                </div>
                <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider text-red-200">
                  {TESTIMONIALS[testimonialIndex].stat}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-xs text-red-200 font-mono">Creating secure digital medical identities</p>
          <p className="text-[10px] text-red-300 uppercase tracking-widest font-bold">HIPAA SECURED</p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 bg-white dark:bg-ob-ink relative overflow-y-auto">
        <div className="md:hidden flex items-center justify-center gap-3 mb-8">
          <Logo size="md" showText={false} />
          <h1 className="text-2xl font-display font-black tracking-tight text-neutral-900 dark:text-ob-white">OneBlood</h1>
        </div>

        <div className="w-full max-w-xl mx-auto space-y-8">
          
          {!selectedRole ? (
            /* Step 1: Role Selection Cards */
            <div className="space-y-6">
              <div className="text-left space-y-2">
                <h2 className="text-3xl font-display font-black text-neutral-900 dark:text-ob-white leading-tight">
                  Choose Account Type
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Select your role below to start setting up your OneBlood routing account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Donor */}
                <div
                  onClick={() => handleRoleSelect('donor')}
                  className="p-6 rounded-3xl border border-neutral-250 dark:border-ob-glass-border bg-neutral-50 dark:bg-neutral-900/40 hover:border-ob-red-700/50 hover:bg-ob-red-700/5 dark:hover:bg-ob-red-950/10 cursor-pointer transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-ob-red-700/10 text-ob-red-700 dark:text-ob-red-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-ob-white mb-1">Blood Donor</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Register your blood type, manage availability and respond to emergency dispatches in your city.
                    </p>
                  </div>
                </div>

                {/* Seeker */}
                <div
                  onClick={() => handleRoleSelect('seeker')}
                  className="p-6 rounded-3xl border border-neutral-250 dark:border-ob-glass-border bg-neutral-50 dark:bg-neutral-900/40 hover:border-amber-500/50 hover:bg-amber-500/5 dark:hover:bg-amber-950/10 cursor-pointer transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Heart className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-ob-white mb-1">Blood Seeker</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Search active map coordinates, broadcast alerts, and coordinate with verified match dispatches.
                    </p>
                  </div>
                </div>

                {/* Blood Bank */}
                <div
                  onClick={() => handleRoleSelect('blood_bank')}
                  className="p-6 rounded-3xl border border-neutral-250 dark:border-ob-glass-border bg-neutral-50 dark:bg-neutral-900/40 hover:border-blue-500/50 hover:bg-blue-500/5 dark:hover:bg-blue-950/10 cursor-pointer transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-ob-white mb-1">Blood Bank / Storage</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Publish real-time inventory levels, coordinate match collections, and verify donor arrivals.
                    </p>
                  </div>
                </div>

                {/* Hospital */}
                <div
                  onClick={() => handleRoleSelect('hospital')}
                  className="p-6 rounded-3xl border border-neutral-250 dark:border-ob-glass-border bg-neutral-50 dark:bg-neutral-900/40 hover:border-purple-500/50 hover:bg-purple-500/5 dark:hover:bg-purple-950/10 cursor-pointer transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-650 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-ob-white mb-1">Hospital / Clinic</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      Authorize blood reception requests, confirm receipt transits, and close match transactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Input fields */
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-250 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 transition-all"
                >
                  ← Back
                </button>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-ob-white font-display leading-tight">
                    Onboarding details
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Registering as: <span className="font-bold text-ob-red-700 font-mono capitalize">{selectedRole.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {selectedRole === 'hospital' ? (
                  /* Hospital Form Fields */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Hospital Name</label>
                      <input
                        type="text"
                        name="hospitalName"
                        required
                        value={formData.hospitalName}
                        onChange={handleChange}
                        placeholder="E.g., KIMS Hospital"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Registration Number</label>
                      <input
                        type="text"
                        name="registrationNumber"
                        required
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        placeholder="E.g., HOSP-KA-836"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Hospital Type</label>
                      <select
                        name="hospitalType"
                        required
                        value={formData.hospitalType}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="Private">Private</option>
                        <option value="Government">Government</option>
                        <option value="Charitable">Charitable</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        name="emergencyContact"
                        required
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        placeholder="10-digit phone number"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Authorized Person Name</label>
                      <input
                        type="text"
                        name="authorizedPersonName"
                        required
                        value={formData.authorizedPersonName}
                        onChange={handleChange}
                        placeholder="Contact person's name"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Designation</label>
                      <input
                        type="text"
                        name="designation"
                        required
                        value={formData.designation}
                        onChange={handleChange}
                        placeholder="E.g., Superintendent"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">City</label>
                      <select
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all cursor-pointer"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        required
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="6-digit PIN"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Full Address</label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Hospital street address details"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Login Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="hospital@domain.com"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  /* Standard Form Fields */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">
                        {selectedRole === 'blood_bank' ? 'Contact Person Name' : 'Full Name'}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-neutral-400" />
                        </span>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder={selectedRole === 'blood_bank' ? 'Contact person name' : 'Enter full name'}
                          className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {selectedRole === 'blood_bank' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">
                          Hospital / Blood Bank Name
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Landmark className="h-4 w-4 text-neutral-400" />
                          </span>
                          <input
                            type="text"
                            name="bankName"
                            required
                            value={formData.bankName}
                            onChange={handleChange}
                            placeholder="Hospital or Bank name"
                            className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-neutral-400" />
                        </span>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="name@example.com"
                          className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-neutral-400" />
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="10-digit mobile number"
                          className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">
                        City
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-4 w-4 text-neutral-400" />
                        </span>
                        <select
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all cursor-pointer"
                        >
                          {CITIES.map((c) => (
                            <option key={c} value={c} className="bg-white dark:bg-ob-ink text-neutral-900 dark:text-ob-white">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">
                        Password
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-neutral-400" />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Min 6 characters"
                          className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-350 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {formData.password && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[9px] px-1 font-mono">
                            <span className="text-neutral-400">Strength:</span>
                            <span className={strength.score === 1 ? 'text-red-500' : strength.score === 2 ? 'text-amber-500' : 'text-emerald-500 font-bold'}>
                              {strength.label}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-300 ${strength.color}`} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-ob-red-700 text-xs font-semibold flex items-center justify-center gap-1.5 mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || isSubmitting}
                  className="w-full py-3 bg-ob-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm text-white hover:shadow-glow-red active:scale-[0.97] transition-all flex items-center justify-center space-x-2"
                >
                  {isLoading || isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Register Account</span>
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="text-center pt-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>Already have an account? </span>
            <Link to="/auth/login" className="text-ob-red-700 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
}
