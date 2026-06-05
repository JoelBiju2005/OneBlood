import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { HeartPulse, User, Mail, Phone, Lock, Landmark, Heart, Loader2, Eye, EyeOff, MapPin, AlertCircle } from 'lucide-react';

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

const SignupPage = () => {
  const { register: registerUser, isLoading, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated && user && !isSubmitting) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, user, isSubmitting, navigate]);

  const [selectedRole, setSelectedRole] = useState(() => {
    if (location.state?.role) return location.state.role;
    const searchParams = new URLSearchParams(location.search);
    const roleParam = searchParams.get('role');
    if (roleParam && ['donor', 'patient', 'blood_bank', 'hospital'].includes(roleParam)) {
      return roleParam;
    }
    return null;
  }); // null, 'donor', 'patient', 'blood_bank', 'hospital'
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

  // Password strength logic
  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-700' };
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 px-4 py-12">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/5 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900/60 border border-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl space-y-8">
        
        {!selectedRole ? (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-500 mb-2">
                <HeartPulse className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Join OneBlood
              </h2>
              <p className="text-sm text-slate-400">
                Let's start with a simple question to get you to the right place.
              </p>
            </div>

            {/* Part 2A: Split Selection Panels */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 text-center uppercase tracking-wider">
                Are you a donor, or are you looking for one?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel 1: I'm a Donor */}
                <div
                  onClick={() => handleRoleSelect('donor')}
                  className="border-2 border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-red-500/30"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 rounded-full mb-4 bg-white/5 text-slate-400">
                      <HeartPulse className="w-10 h-10 text-red-500" />
                    </div>
                    <span className="text-lg font-bold text-white mb-2">I want to donate</span>
                    <span className="text-xs text-slate-400 leading-relaxed">
                      Help someone in need. Register as a donor and save lives when it counts.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-6 px-6 py-2.5 rounded-xl font-bold text-xs bg-white/10 text-slate-300 hover:bg-white/20 transition-all cursor-pointer"
                  >
                    I'm a Donor
                  </button>
                </div>

                {/* Panel 2: I Need Blood */}
                <div
                  onClick={() => handleRoleSelect('patient')}
                  className="border-2 border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20 rounded-2xl p-6 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-red-500/30"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-4 rounded-full mb-4 bg-white/5 text-slate-400">
                      <Heart className="w-10 h-10 text-amber-400" />
                    </div>
                    <span className="text-lg font-bold text-white mb-2">I'm looking for blood</span>
                    <span className="text-xs text-slate-400 leading-relaxed">
                      Someone needs help. Now. Find nearby donors and blood banks instantly.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-6 px-6 py-2.5 rounded-xl font-bold text-xs bg-white/10 text-slate-300 hover:bg-white/20 transition-all cursor-pointer"
                  >
                    I Need Blood
                  </button>
                </div>
              </div>

              {/* Panel 3 & 4: Blood Bank & Hospital managers */}
              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">── or ──</span>
                <div className="mt-3 flex flex-col md:flex-row justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('blood_bank')}
                    className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Landmark className="w-4 h-4 text-blue-400" />
                    <span>I manage a blood bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('hospital')}
                    className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <span>I manage a hospital</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Part 2B: Dedicated Form View */
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-4 mb-4 border-b border-white/5 pb-4">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                ← Back
              </button>
              <div>
                <h4 className="text-lg font-bold text-white">
                  Create {selectedRole === 'blood_bank' ? 'Blood Bank' : selectedRole === 'donor' ? 'Donor' : 'Seeker'} Account
                </h4>
                <p className="text-xs text-slate-400">
                  Please enter your credentials to complete registration
                </p>
              </div>
            </div>

            {selectedRole === 'hospital' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hospital Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Name</label>
                  <input
                    type="text"
                    name="hospitalName"
                    required
                    value={formData.hospitalName}
                    onChange={handleChange}
                    placeholder="E.g., KIMS Hospital"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                {/* Registration Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    required
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="E.g., HOSP-KA-836"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                {/* Hospital Type */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital Type</label>
                  <select
                    name="hospitalType"
                    required
                    value={formData.hospitalType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Private">Private</option>
                    <option value="Government">Government</option>
                    <option value="Charitable">Charitable</option>
                  </select>
                </div>
                {/* Emergency Contact */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    required
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="10-digit phone number"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                {/* Authorized Person */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authorized Person Name</label>
                  <input
                    type="text"
                    name="authorizedPersonName"
                    required
                    value={formData.authorizedPersonName}
                    onChange={handleChange}
                    placeholder="Contact person's name"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                {/* Designation */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    required
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="E.g., Medical Superintendent"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                {/* Website */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website (Optional)</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="http://example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                {/* City */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</label>
                  <select
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Address */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Address</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Hospital address details"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                {/* State & Pincode */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Karnataka"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6-digit PIN"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                {/* Lat & Lng */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
                  <input
                    type="text"
                    name="lat"
                    required
                    value={formData.lat}
                    onChange={handleChange}
                    placeholder="15.3647"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
                  <input
                    type="text"
                    name="lng"
                    required
                    value={formData.lng}
                    onChange={handleChange}
                    placeholder="75.1240"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Login Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="hospital@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                {/* Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name / Contact Person */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {selectedRole === 'blood_bank' ? 'Contact Person Name' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-500" />
                    </span>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={selectedRole === 'blood_bank' ? 'Enter contact person name' : 'Enter full name'}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                    />
                  </div>
                </div>

                {/* Hospital/Bank Name (Only for Blood Bank) */}
                {selectedRole === 'blood_bank' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Hospital / Blood Bank Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Landmark className="h-4 w-4 text-slate-500" />
                      </span>
                      <input
                        type="text"
                        name="bankName"
                        required
                        value={formData.bankName}
                        onChange={handleChange}
                        placeholder="Hospital or Blood Bank name"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                    />
                  </div>
                </div>

                {/* City (Dropdown) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    City
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-slate-500" />
                    </span>
                    <select
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c} className="bg-slate-900 text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {formData.password && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-medium">Strength:</span>
                        <span
                          className={`font-bold ${
                            strength.score === 1 ? 'text-red-400' : strength.score === 2 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {strength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-350 ${strength.color}`} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-xs font-bold flex items-center justify-center gap-1.5 mt-2 animate-pulse error-text">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#C0152A] hover:bg-[#a01021] disabled:bg-red-900 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-red-700/10 hover:shadow-red-700/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 text-sm text-slate-400">
          <span>Already have an account? </span>
          <Link to="/auth/login" className="text-red-500 font-bold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

