import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { HeartPulse, MapPin, ShieldAlert, ChevronRight, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
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
  html: `<div class="w-8 h-8 rounded-full bg-oneblood-crimson/20 border border-oneblood-crimson flex items-center justify-center text-oneblood-crimson shadow-xl animate-pulse"><div class="w-3 h-3 bg-oneblood-crimson rounded-full"></div></div>`,
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

const getCityCoords = (cityName) => {
  const defaultCoords = [12.9716, 77.5946];
  if (!cityName) return defaultCoords;
  const mapping = {
    'Bengaluru': [12.9716, 77.5946],
    'Hubballi': [15.3647, 75.1240],
    'Dharwad': [15.4589, 75.0078],
    'Belagavi': [15.8497, 74.4977],
    'Mangaluru': [12.9141, 74.8560],
    'Mysuru': [12.2958, 76.6394],
    'Hyderabad': [17.3850, 78.4867],
    'Secunderabad': [17.4399, 78.5020],
    'Vijayawada': [16.5062, 80.6480],
    'Visakhapatnam': [17.6868, 83.2185],
    'Guntur': [16.3067, 80.4365],
    'Tirupati': [13.6288, 79.4192],
    'Warangal': [17.9689, 79.5941],
    'Manipal': [13.3409, 74.7864],
    'Davangere': [14.4644, 75.9218],
    'Shivamogga': [13.9299, 75.5681],
    'Amalapuram': [16.5787, 82.0061]
  };
  return mapping[cityName] || defaultCoords;
};

const calculateAge = (dobString) => {
  if (!dobString) return '';
  const birthDate = new Date(dobString);
  const today = new Date();
  let calculatedAge = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    calculatedAge--;
  }
  return calculatedAge.toString();
};

const DonorRegistrationPage = () => {
  const { user, registerDonorProfile } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('male');
  const [weight, setWeight] = useState('65');
  const [age, setAge] = useState('25');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(user?.city || 'Bengaluru');
  const [pincode, setPincode] = useState('');
  
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [coords, setCoords] = useState(() => getCityCoords(user?.city));
  const [gpsLabel, setGpsLabel] = useState('📍 Fetching location...');

  // Eligibility declaration checklist
  const [eligibility, setEligibility] = useState({
    above18: false,
    healthyWeight: false,
    noInfections: false,
    noTattoosRecent: false,
    notMisleadingSeeker: false,
    takeDonationSeriously: false,
  });

  const [hasDonatedBefore, setHasDonatedBefore] = useState('no');
  const [lastDonated, setLastDonated] = useState('');
  const [medicalConditionsText, setMedicalConditionsText] = useState('');
  const [bioText, setBioText] = useState('');

  // Fetch coordinates on step 2 load
  useEffect(() => {
    if (step === 2) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords([pos.coords.latitude, pos.coords.longitude]);
          setGpsLabel('📍 Precise GPS position set');
        },
        () => {
          // If GPS fails, fall back to the selected city coordinates rather than IP
          const cityCoords = getCityCoords(user?.city);
          setCoords(cityCoords);
          setGpsLabel(`📍 GPS failed. Using ${user?.city || 'Bengaluru'} center.`);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [step, user?.city]);

  const handleNext = () => {
    if (step === 1) {
      if (!dob) {
        toast.error('Please enter your date of birth.');
        return;
      }
    }
    if (step === 2) {
      if (!address || !pincode) {
        toast.error('Please enter your full address and pincode.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !eligibility.above18 || 
      !eligibility.healthyWeight || 
      !eligibility.noInfections || 
      !eligibility.noTattoosRecent ||
      !eligibility.notMisleadingSeeker ||
      !eligibility.takeDonationSeriously
    ) {
      toast.error('You must agree to all declarations and trust guidelines to complete registration.');
      return;
    }

    setLoading(true);
    try {
      const donorData = {
        bloodGroup,
        age: parseInt(age, 10),
        weight: parseInt(weight, 10),
        gender,
        address,
        city,
        pincode,
        lat: coords[0].toString(),
        lng: coords[1].toString(),
        preferredContactMethod: 'call',
        bio: bioText,
        lastDonated: hasDonatedBefore === 'yes' && lastDonated ? lastDonated : null,
        medicalConditions: medicalConditionsText ? medicalConditionsText.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      await registerDonorProfile(donorData);
      toast.success('Profile completed successfully! Welcome, Hero.');
      navigate('/dashboard/donor');
    } catch (err) {
      toast.error(err.message || 'Failed to complete profile registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-oneblood-midnight px-4 py-12">
      {/* Visual background layers */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-oneblood-crimson/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-oneblood-gold/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/60 border border-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl space-y-8">
        
        {/* Top stepper indicator */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400">
            <span className={step >= 1 ? 'text-oneblood-crimson' : ''}>STEP 1: Personal Details</span>
            <span className={step >= 2 ? 'text-oneblood-crimson' : ''}>STEP 2: Location & Group</span>
            <span className={step >= 3 ? 'text-oneblood-crimson' : ''}>STEP 3: Medical Check</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
            <div className={`h-full bg-oneblood-crimson transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 text-left animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-display text-white">Let's start with the basics</h2>
              <p className="text-xs text-slate-400">Please provide your personal information to match you accurately.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                <input 
                  type="date" 
                  value={dob}
                  onChange={(e) => {
                    const newDob = e.target.value;
                    setDob(newDob);
                    const calc = calculateAge(newDob);
                    if (calc) {
                      setAge(calc);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age (Calculated)</label>
                <input 
                  type="number" 
                  value={age}
                  readOnly
                  placeholder="Calculated from DOB"
                  className="w-full px-3 py-2.5 bg-slate-950/50 border border-white/5 rounded-xl text-xs text-slate-400 focus:outline-none cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (kg)</label>
                <input 
                  type="number" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>



            <button 
              onClick={handleNext}
              className="w-full py-3 bg-oneblood-crimson hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>Next: Location & Blood Group</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-left animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-display text-white">Find Your coordinates & Blood group</h2>
              <p className="text-xs text-slate-400">Patients in need require location proximity to coordinate emergencies.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Group</label>
              <div className="grid grid-cols-4 gap-2">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bg)}
                    className={`py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${bloodGroup === bg ? 'border-oneblood-crimson bg-oneblood-crimson/15 text-white' : 'border-white/10 bg-slate-950/60 text-slate-400 hover:bg-white/5'}`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Street Address</label>
              <input 
                type="text" 
                placeholder="Apartment/Building, Street Name, Landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pincode</label>
              <input 
                type="text" 
                placeholder="6-digit postal code"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            {/* Leaflet map pin selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Pin coordinates on map</span>
                <span className="text-oneblood-crimson">{gpsLabel}</span>
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

            <div className="flex space-x-3">
              <button 
                onClick={handlePrev}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button 
                onClick={handleNext}
                className="flex-1 py-3 bg-oneblood-crimson hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6 text-left animate-fadeIn">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-display text-white">Donor eligibility checklist</h2>
              <p className="text-xs text-slate-400">Please review these declarations. Check boxes to declare authenticity.</p>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Medical Eligibility & Trust Agreements</span>
              <div className="space-y-3 bg-slate-950/40 p-4 border border-white/5 rounded-xl">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={eligibility.above18}
                    onChange={(e) => setEligibility({ ...eligibility, above18: e.target.checked })}
                    className="mt-1 accent-oneblood-crimson rounded border-white/10 bg-slate-950" 
                  />
                  <span className="text-xs text-slate-300 leading-snug">I am between 18 and 65 years of age.</span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={eligibility.healthyWeight}
                    onChange={(e) => setEligibility({ ...eligibility, healthyWeight: e.target.checked })}
                    className="mt-1 accent-oneblood-crimson rounded border-white/10 bg-slate-950" 
                  />
                  <span className="text-xs text-slate-300 leading-snug">I weigh at least 45 kg and feel completely healthy.</span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={eligibility.noInfections}
                    onChange={(e) => setEligibility({ ...eligibility, noInfections: e.target.checked })}
                    className="mt-1 accent-oneblood-crimson rounded border-white/10 bg-slate-950" 
                  />
                  <span className="text-xs text-slate-300 leading-snug">I do not suffer from any infectious diseases (such as HIV, Hepatitis B/C, etc.).</span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={eligibility.noTattoosRecent}
                    onChange={(e) => setEligibility({ ...eligibility, noTattoosRecent: e.target.checked })}
                    className="mt-1 accent-oneblood-crimson rounded border-white/10 bg-slate-950" 
                  />
                  <span className="text-xs text-slate-300 leading-snug">I have not had any tattoos, acupuncture, or ear piercings in the last 6 months.</span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={eligibility.notMisleadingSeeker}
                    onChange={(e) => setEligibility({ ...eligibility, notMisleadingSeeker: e.target.checked })}
                    className="mt-1 accent-oneblood-crimson rounded border-white/10 bg-slate-950" 
                  />
                  <span className="text-xs text-slate-300 leading-snug font-medium text-oneblood-gold">
                    I pledge not to mislead, spoof, or fool seekers. The information I provide is completely accurate and I will maintain valid status.
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={eligibility.takeDonationSeriously}
                    onChange={(e) => setEligibility({ ...eligibility, takeDonationSeriously: e.target.checked })}
                    className="mt-1 accent-oneblood-crimson rounded border-white/10 bg-slate-950" 
                  />
                  <span className="text-xs text-slate-300 leading-snug font-medium text-oneblood-gold">
                    I promise to take each donation request seriously, keep my availability updated, and act responsibly to help save lives during emergencies.
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Blood Donation History</span>
              <div className="bg-slate-950/40 p-4 border border-white/5 rounded-xl space-y-4">
                <div className="space-y-2">
                  <span className="text-xs text-slate-300 font-semibold block">Have you donated blood before?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHasDonatedBefore('no')}
                      className={`flex-1 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        hasDonatedBefore === 'no' 
                          ? 'border-oneblood-crimson bg-oneblood-crimson/15 text-white' 
                          : 'border-white/10 bg-slate-950/60 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      No, first time donor
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasDonatedBefore('yes')}
                      className={`flex-1 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        hasDonatedBefore === 'yes' 
                          ? 'border-oneblood-crimson bg-oneblood-crimson/15 text-white' 
                          : 'border-white/10 bg-slate-950/60 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      Yes, I have donated
                    </button>
                  </div>
                </div>

                {hasDonatedBefore === 'yes' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">When was your last donation?</label>
                    <input 
                      type="date" 
                      max={new Date().toISOString().split('T')[0]}
                      value={lastDonated}
                      onChange={(e) => setLastDonated(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Health Profile & Bio</span>
              <div className="bg-slate-950/40 p-4 border border-white/5 rounded-xl space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Health Considerations / Medical Conditions</label>
                  <textarea 
                    rows="2"
                    placeholder="E.g., Mild asthma, penicillin allergy (comma separated, or leave blank if none)"
                    value={medicalConditionsText}
                    onChange={(e) => setMedicalConditionsText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none resize-none"
                  />
                  <span className="text-[9px] text-slate-500">Provide any conditions or allergies a seeker or medical team should know.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Short Bio / Willingness Note</label>
                  <input 
                    type="text"
                    placeholder="E.g., Ready to help in critical emergencies. Available on weekends."
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-oneblood-crimson/10 border border-oneblood-crimson/20 rounded-xl flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-oneblood-crimson shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-300 leading-normal">
                <strong>Matching Trust:</strong> Providing false medical information is a liability. Your contact details are only shared after you manually accept an emergency request.
              </p>
            </div>

            <div className="flex space-x-3">
              <button 
                type="button"
                onClick={handlePrev}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-oneblood-crimson hover:bg-red-700 disabled:bg-red-900 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-oneblood-gold" />
                    <span>Complete Donor Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default DonorRegistrationPage;
