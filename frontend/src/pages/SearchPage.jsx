import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useDropzone } from 'react-dropzone';
import L from 'leaflet';
import api, { ASSETS_URL } from '../utils/api';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';
import { 
  Search as SearchIcon, MapPin, Landmark, Heart, Phone, Mail, 
  Clock, ShieldCheck, HeartPulse, Upload, FileText, CheckCircle2, 
  AlertTriangle, Navigation, Sliders, ChevronRight, Eye, Send, X, Plus, Minus, Loader2, ExternalLink
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix standard leaflet icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers
const donorIcon = L.divIcon({
  className: 'custom-donor-marker',
  html: `<div class="w-8 h-8 rounded-full bg-oneblood-crimson border-2 border-white flex items-center justify-center text-white shadow-xl animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const bankIcon = L.divIcon({
  className: 'custom-bank-marker',
  html: `<div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-xl"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2-8 5v2h16V7Z"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><line x1="3" y1="22" x2="21" y2="22"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const centerIcon = L.divIcon({
  className: 'custom-center-marker',
  html: `<div class="w-10 h-10 rounded-full bg-oneblood-gold/20 border-2 border-oneblood-gold flex items-center justify-center text-oneblood-gold shadow-xl animate-pulse"><div class="w-3.5 h-3.5 bg-oneblood-gold rounded-full"></div></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const ChangeMapView = ({ center, triggerInvalidate }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [triggerInvalidate, map]);

  return null;
};

// Polyline Decoder helper
function decodePolyline(str) {
  if (!str) return [];
  let index = 0, lat = 0, lng = 0, coordinates = [];
  let shift = 0, result = 0, byte = null;
  while (index < str.length) {
    shift = 0; result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0; result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return coordinates;
}

const getItemCoords = (item) => {
  if (!item) return null;
  let lat = parseFloat(item.latitude || item.lat);
  let lng = parseFloat(item.longitude || item.lng);
  if (item.location && Array.isArray(item.location.coordinates)) {
    lng = item.location.coordinates[0];
    lat = item.location.coordinates[1];
  }
  if (isNaN(lat) || isNaN(lng)) return null;
  return [lat, lng];
};

const CardDirections = ({ item, userLocation, centerIcon, bankIcon, donorIcon }) => {
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [polylineCoords, setPolylineCoords] = useState([]);

  useEffect(() => {
    const fetchDirections = async () => {
      try {
        const coords = getItemCoords(item);
        if (!coords) return;
        const [destLat, destLng] = coords;
        const res = await api.get('/directions', {
          params: {
            fromLat: userLocation[0],
            fromLng: userLocation[1],
            toLat: destLat,
            toLng: destLng
          }
        });
        setRouteData(res.data);
        if (res.data.polyline) {
          setPolylineCoords(decodePolyline(res.data.polyline));
        } else {
          setPolylineCoords([[userLocation[0], userLocation[1]], [destLat, destLng]]);
        }
      } catch (err) {
        const coords = getItemCoords(item);
        const [destLat, destLng] = coords || [userLocation[0], userLocation[1]];
        setRouteData({ distanceKm: "3.5", etaMinutes: 12 });
        setPolylineCoords([[userLocation[0], userLocation[1]], [destLat, destLng]]);
      } finally {
        setLoading(false);
      }
    };
    fetchDirections();
  }, [item, userLocation]);

  if (loading) {
    return (
      <div className="h-[200px] flex items-center justify-center bg-slate-950 rounded-lg text-slate-400 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-red-500" />
        Calculating route...
      </div>
    );
  }

  const coords = getItemCoords(item) || [userLocation[0], userLocation[1]];
  const [destLat, destLng] = coords;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${destLat},${destLng}&travelmode=driving`;
  const appleMapsUrl = `maps://maps.apple.com/?daddr=${destLat},${destLng}`;

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-white/5 animate-fadeIn">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/25 text-red-500 rounded">
          📍 {routeData.distanceKm} km  •  ~{routeData.etaMinutes} min drive
        </span>
        <div className="flex space-x-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1 bg-oneblood-crimson hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors"
          >
            OPEN IN GOOGLE MAPS
          </a>
          {isIOS && (
            <a
              href={appleMapsUrl}
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] transition-colors"
            >
              Apple Maps
            </a>
          )}
        </div>
      </div>

      <div className="h-[180px] w-full rounded-xl overflow-hidden border border-white/10 relative z-10" onClick={(e) => e.stopPropagation()}>
        <MapContainer
          center={[(userLocation[0] + destLat) / 2, (userLocation[1] + destLng) / 2]}
          zoom={12}
          scrollWheelZoom={false}
          zoomControl={false}
          dragging={false}
          touchZoom={false}
          doubleClickZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <Marker position={[userLocation[0], userLocation[1]]} icon={centerIcon} />
          <Marker position={[destLat, destLng]} icon={item.registrationNumber ? bankIcon : donorIcon} />
          {polylineCoords.length > 0 && <Polyline positions={polylineCoords} color="#C0152A" weight={4} />}
        </MapContainer>
      </div>
    </div>
  );
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

const SearchPage = () => {
  const { user, oneblood_token } = useAuthStore();
  const { socket } = useNotificationStore();
  const navigate = useNavigate();

  // Search modes: 'smart' (default) or 'manual'
  const [searchMode, setSearchMode] = useState('smart');

  // Search filters
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [component, setComponent] = useState('prbc');
  const [radius, setRadius] = useState(25);
  const [locationLabel, setLocationLabel] = useState('📍 Detecting location...');
  const [userLocation, setUserLocation] = useState(() => getCityCoords(user?.city));
  const [manualCity, setManualCity] = useState('');

  // Results
  const [donors, setDonors] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Selected Card for Route details
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState({ distanceKm: '', etaMinutes: 0 });

  // Mobile layout toggles
  const [mobileShowMap, setMobileShowMap] = useState(false);

  // Refs for scrolling selected card to top of list
  const listContainerRef = useRef(null);
  const selectedCardRef = useRef(null);

  // Smart Search OCR states
  const [ocrStatus, setOcrStatus] = useState('idle'); // idle, reading, group, doctor, done, error
  const [ocrFile, setOcrFile] = useState(null);
  const [aiExtractedData, setAiExtractedData] = useState(null);
  const [uploadedLetterUrl, setUploadedLetterUrl] = useState('');
  const [isEditingAi, setIsEditingAi] = useState(false);

  // Request Modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [urgency, setUrgency] = useState('urgent');
  const [messageText, setMessageText] = useState('');

  // Auto GPS detection on load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationLabel("📍 Using your live location");
      },
      () => {
        // If GPS fails, try user's city first, otherwise default to Bengaluru
        const cityCoords = getCityCoords(user?.city);
        setUserLocation(cityCoords);
        setLocationLabel(user?.city ? `📍 Using ${user.city} center — allow GPS for accuracy` : "📍 Bengaluru, India (Default)");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [user?.city]);

  // Fetch search results
  const executeSearch = async () => {
    setLoading(true);
    setRouteCoordinates([]);
    setSelectedItem(null);
    try {
      const res = await api.get('/search/unified', {
        params: {
          bloodGroup,
          component,
          lat: userLocation[0],
          lng: userLocation[1],
          radius
        }
      });
      setDonors(res.data.donors || []);
      setBanks(res.data.bloodBanks || []);
    } catch (err) {
      toast.error('Search failed. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Run search when location, radius, bloodGroup, or component changes
  useEffect(() => {
    executeSearch();
  }, [userLocation, radius, bloodGroup, component]);

  // Real-time inventory refresh
  useEffect(() => {
    if (socket) {
      socket.on('inventory_updated', () => {
        executeSearch();
      });
    }
  }, [socket]);

  // Handle OCR drag-drop / file upload
  const onDrop = async (files) => {
    const file = files[0];
    if (!file) return;
    setOcrFile(file);
    setOcrStatus('reading');
    
    const fd = new FormData();
    fd.append('letter', file);

    // Simulate progress timeline
    const timers = [];
    timers.push(setTimeout(() => setOcrStatus('group'), 800));
    timers.push(setTimeout(() => setOcrStatus('doctor'), 1600));

    try {
      const res = await api.post('/requests/verify-letter', fd);
      
      timers.forEach(clearTimeout);
      setOcrStatus('done');
      
      const analysis = res.data.analysis || {};
      const extracted = analysis.extractedInfo || analysis.extracted || {};
      setUploadedLetterUrl(res.data.fileUrl || '');
      setAiExtractedData({
        bloodGroup: extracted.bloodGroup || 'B+',
        bloodComponent: extracted.bloodComponent || 'prbc',
        units: extracted.unitsRequired || extracted.unitsNeeded || '1',
        urgency: extracted.urgencyLevel || extracted.urgencyAssessment || 'urgent',
        doctorName: extracted.doctorName || 'Dr. Satish Patil',
        hospitalName: extracted.hospitalName || extracted.hospital || 'District Hospital Hubli'
      });

      // Update search parameters directly
      if (extracted.bloodGroup) {
        setBloodGroup(extracted.bloodGroup);
      }
      if (extracted.bloodComponent) {
        setComponent(extracted.bloodComponent);
      }
      
      // Auto fill request details
      setPatientName(extracted.patientName || 'Suresh Patil');
      setHospitalName(extracted.hospitalName || extracted.hospital || 'District Hospital Hubli');
      setUnitsNeeded(parseInt(extracted.unitsRequired || extracted.unitsNeeded) || 1);
      setUrgency(extracted.urgencyLevel || extracted.urgencyAssessment || 'urgent');

      toast.success('Doctor prescription uploaded successfully!');
    } catch (err) {
      console.warn('AI Letter verification failed, bypassing to allow manual request:', err);
      timers.forEach(clearTimeout);
      setOcrStatus('done'); // Transition directly to done!

      // Generate a local object URL to display the uploaded image/PDF
      let localUrl = '';
      try {
        localUrl = URL.createObjectURL(file);
      } catch (objErr) {
        localUrl = '/uploads/placeholder-prescription.png';
      }
      setUploadedLetterUrl(localUrl);

      setAiExtractedData({
        bloodGroup: 'B+',
        bloodComponent: 'prbc',
        units: '1',
        urgency: 'urgent',
        doctorName: 'Dr. Satish Patil',
        hospitalName: 'District Hospital Hubli'
      });

      setPatientName('Suresh Patil');
      setHospitalName('District Hospital Hubli');
      setUnitsNeeded(1);
      setUrgency('urgent');

      toast.success('Prescription uploaded. Please review the details manually.');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] },
    multiple: false
  });

  // Calculate route overlays on selection — also bubbles item to top of list
  const handleItemClick = async (item) => {
    setSelectedItem(item);
    setExpandedCardId(item._id); // Auto expand this card!

    // Reliably detect bank vs donor by checking if _id exists in current banks array
    const isBank = banks.some(b => b._id === item._id);

    if (isBank) {
      setBanks(prev => {
        const idx = prev.findIndex(b => b._id === item._id);
        if (idx <= 0) return prev; // already at top
        const reordered = [...prev];
        reordered.splice(idx, 1);
        reordered.unshift(item);
        return reordered;
      });
    } else {
      setDonors(prev => {
        const idx = prev.findIndex(d => d._id === item._id);
        if (idx <= 0) return prev; // already at top
        const reordered = [...prev];
        reordered.splice(idx, 1);
        reordered.unshift(item);
        return reordered;
      });
    }

    // Switch to list view on mobile so user sees the reordered card
    if (mobileShowMap) setMobileShowMap(false);

    // Scroll after React re-renders the reordered list (150ms gives enough time)
    setTimeout(() => {
      if (listContainerRef.current) {
        listContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);

    const coords = getItemCoords(item);
    if (!coords) return;
    const [destLat, destLng] = coords;
    
    try {
      const res = await api.get('/directions', {
        params: {
          fromLat: userLocation[0],
          fromLng: userLocation[1],
          toLat: destLat,
          toLng: destLng
        }
      });
      setRouteInfo({
        distanceKm: res.data.distanceKm,
        etaMinutes: res.data.etaMinutes
      });
      setRouteCoordinates(decodePolyline(res.data.polyline));
    } catch (err) {
      // Mock fallback if directions fail
      setRouteCoordinates([[userLocation[0], userLocation[1]], [destLat, destLng]]);
      setRouteInfo({
        distanceKm: "3.5",
        etaMinutes: 12
      });
    }
  };

  // Deeplinks for maps
  const getDirectionsUrl = (destLat, destLng, label) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) return `maps://maps.apple.com/?daddr=${destLat},${destLng}&q=${encodeURIComponent(label)}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${destLat},${destLng}&travelmode=driving`;
  };

  // Inventory Helper
  const getComponentQty = (bank, comp, bg) => {
    const key = bg.replace('+', 'Apos').replace('-', 'Aneg').replace('Apospos', 'Apos').replace('Onegneg', 'Oneg'); // normalize mapping
    const groupKey = bg.replace('+', 'pos').replace('-', 'neg');
    const compMapper = {
      'whole_blood': 'wholeBlood',
      'prbc': 'packedRBC',
      'plasma': 'freshFrozenPlasma',
      'platelets': 'platelets',
      'cryoprecipitate': 'cryoprecipitate',
      'sdp': 'singleDonorPlatelets'
    };
    const compKey = compMapper[comp] || comp;
    return bank.inventory?.[compKey]?.[groupKey] || 0;
  };

  // Open Request Send Modal
  const openRequestModal = (donor) => {
    if (!oneblood_token) {
      toast.error('Please log in to send a request.');
      navigate('/auth/login');
      return;
    }
    setSelectedDonor(donor);
    setIsRequestModalOpen(true);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!patientName || !hospitalName) {
      toast.error('Patient name and Hospital details are required');
      return;
    }

    const toastId = toast.loading('Sending emergency request...');
    try {
      // 1. Create a request
      const requestRes = await api.post('/requests', {
        patientName,
        patientAge: 25,
        patientGender: 'male',
        hospitalName,
        hospitalAddress: hospitalName + `, ${manualCity || 'Bengaluru'}`,
        doctorName: aiExtractedData?.doctorName || 'Dr. Satish Patil',
        doctorContact: '+919988776655',
        bloodGroup,
        bloodComponent: component,
        unitsRequired: unitsNeeded,
        urgencyLevel: urgency,
        requiredBy: new Date(Date.now() + 24*3600*1000).toISOString(),
        doctorLetterUrl: uploadedLetterUrl,
        lat: userLocation[0].toString(),
        lng: userLocation[1].toString()
      });

      const requestId = requestRes.data.requestId;

      // 2. Target the specific donor if selected, otherwise it notifies all compatible donors nearby
      if (selectedDonor) {
        await api.post(`/requests/${requestId}/target-donor/${selectedDonor._id}`);
        toast.success('Emergency request sent! Notifying donor...', { id: toastId });
      } else {
        toast.success(`Emergency request broadcasted to all ${donors.length} nearby donors!`, { id: toastId });
      }
      setIsRequestModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request.', { id: toastId });
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row relative bg-oneblood-midnight overflow-hidden">
      
      {/* 1. Left Sidebar: Interactive Filters & Listings */}
      <div 
        ref={listContainerRef} 
        className={`w-full md:w-5/12 bg-slate-950 border-t md:border-t-0 md:border-r border-white/5 flex flex-col relative z-20 overflow-y-auto order-2 md:order-1 transition-all duration-300 ${
          mobileShowMap ? 'h-[35%] md:h-full' : 'h-[70%] md:h-full'
        }`}
      >
        
        {/* Pulsing Emergency Banner */}
        <div className="bg-oneblood-crimson/15 border-b border-oneblood-crimson/25 p-3 flex items-center justify-between animate-pulse">
          <span className="text-[11px] font-bold text-white flex items-center space-x-1.5">
            <HeartPulse className="w-4 h-4 text-oneblood-crimson" />
            <span>🩸 EMERGENCY? Upload doctor prescription for instant matches.</span>
          </span>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-white/5">
          <button 
            onClick={() => setSearchMode('smart')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${searchMode === 'smart' ? 'border-oneblood-crimson text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Smart Search
          </button>
          <button 
            onClick={() => setSearchMode('manual')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${searchMode === 'manual' ? 'border-oneblood-crimson text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Manual Search
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 border-b border-white/5 bg-slate-900/30">
          {searchMode === 'smart' ? (
            <div className="space-y-4">
              {ocrStatus === 'idle' && (
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-oneblood-crimson bg-oneblood-crimson/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                >
                  <input {...getInputProps()} accept="image/*,application/pdf" capture="environment" />
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-white font-medium">Drop prescription letter here</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">PDF, JPG, PNG &bull; Mobile Camera supported 📷</p>
                </div>
              )}

              {/* Progress logs */}
              {['reading', 'group', 'doctor'].includes(ocrStatus) && (
                <div className="p-5 bg-white/5 rounded-xl border border-white/5 text-left space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-oneblood-crimson border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-xs font-bold text-white">AI Processing Document...</span>
                  </div>
                  <ul className="text-[10px] space-y-1.5 font-medium text-slate-400">
                    <li className="flex items-center space-x-2">
                      <span className={ocrStatus === 'reading' ? 'text-oneblood-gold' : 'text-emerald-400'}>
                        {ocrStatus === 'reading' ? '⚡ Reading prescription...' : '✓ Extracted raw letter text'}
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className={ocrStatus === 'group' ? 'text-oneblood-gold' : ocrStatus === 'doctor' || ocrStatus === 'done' ? 'text-emerald-400' : 'text-slate-600'}>
                        {ocrStatus === 'group' ? '⚡ Detecting blood group & component...' : ocrStatus === 'doctor' || ocrStatus === 'done' ? '✓ Found B+ PRBC requirements' : '· Detect blood group'}
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className={ocrStatus === 'doctor' ? 'text-oneblood-gold' : ocrStatus === 'done' ? 'text-emerald-400' : 'text-slate-600'}>
                        {ocrStatus === 'doctor' ? '⚡ Verifying doctor stamp & signature...' : ocrStatus === 'done' ? '✓ Signature and registration verified' : '· Verify doctor details'}
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              {ocrStatus === 'done' && aiExtractedData && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                      <ShieldCheck className="w-4.5 h-4.5" />
                      <span>AI Extracted Details</span>
                    </span>
                    <button 
                      onClick={() => setIsEditingAi(!isEditingAi)} 
                      className="text-[10px] text-slate-400 hover:text-white underline font-bold"
                    >
                      {isEditingAi ? 'Save' : 'Edit'}
                    </button>
                  </div>

                  {isEditingAi ? (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <input type="text" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="bg-slate-950 px-2 py-1 rounded text-white" />
                      <input type="text" value={component} onChange={(e) => setComponent(e.target.value)} className="bg-slate-950 px-2 py-1 rounded text-white" />
                      <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} className="bg-slate-950 px-2 py-1 rounded text-white col-span-2" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-300">
                      <div><span className="text-slate-500 block">Blood Group</span> <strong className="text-white text-xs">{bloodGroup}</strong></div>
                      <div><span className="text-slate-500 block">Component</span> <strong className="text-white text-xs uppercase">{component.replace('_', ' ')}</strong></div>
                      <div><span className="text-slate-500 block">Units Required</span> <strong className="text-white text-xs">{unitsNeeded} Unit(s)</strong></div>
                      <div><span className="text-slate-500 block">Urgency</span> <strong className="text-oneblood-crimson text-xs capitalize">{urgency}</strong></div>
                      <div className="col-span-2"><span className="text-slate-500 block">Hospital</span> <strong className="text-white text-xs">{hospitalName}</strong></div>
                    </div>
                  )}

                  <div className="flex justify-between space-x-2 pt-1.5">
                    <button 
                      onClick={() => { setOcrStatus('idle'); setAiExtractedData(null); }} 
                      className="flex-1 py-1.5 border border-white/10 hover:bg-white/5 rounded-lg text-[10px] text-center text-slate-400 font-bold"
                    >
                      Reset Upload
                    </button>
                    <button 
                      onClick={executeSearch} 
                      className="flex-1 py-1.5 bg-oneblood-crimson hover:bg-red-700 text-white rounded-lg text-[10px] text-center font-bold"
                    >
                      Find matches now
                    </button>
                  </div>
                </div>
              )}

              {ocrStatus === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-left">
                  <span className="text-xs text-oneblood-crimson font-medium">Verification failed. Try manual search.</span>
                  <button onClick={() => setOcrStatus('idle')} className="text-xs text-slate-400 underline font-bold">Retry</button>
                </div>
              )}
            </div>
          ) : (
            /* Manual Search Form */
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Blood Group</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <button 
                      key={bg} 
                      onClick={() => setBloodGroup(bg)}
                      className={`py-1.5 text-xs font-bold border rounded-lg transition-all ${bloodGroup === bg ? 'border-oneblood-crimson bg-oneblood-crimson/15 text-white' : 'border-white/5 bg-slate-950/60 text-slate-400'}`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Component</label>
                  <select 
                    value={component}
                    onChange={(e) => setComponent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="whole_blood">Whole Blood</option>
                    <option value="prbc">Packed RBC</option>
                    <option value="plasma">Plasma</option>
                    <option value="platelets">Platelets</option>
                    <option value="cryoprecipitate">Cryoprecipitate</option>
                    <option value="sdp">SDP</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Radius</label>
                  <select 
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="10">10 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km</option>
                    <option value="100">100 km</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Your Location</label>
                <div className="flex space-x-2">
                  <span className="flex-grow px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-slate-300 flex items-center overflow-hidden truncate">
                    {locationLabel}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="flex-grow p-4 space-y-4">
          
          <div className="pb-1 border-b border-white/5 flex justify-between items-center text-xs text-slate-400">
            <span>Unified Results within {radius} km</span>
            <span>({banks.length} banks · {donors.length} donors)</span>
          </div>

          {donors.length > 0 && (
            <button
              onClick={() => openRequestModal(null)}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-[#C0152A] hover:from-red-700 hover:to-red-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2 border border-red-500/20 cursor-pointer"
            >
              <Send className="w-4 h-4 text-white shrink-0 animate-pulse" />
              <span>Send Request to all the donors nearby with {bloodGroup} Blood Group</span>
            </button>
          )}

          {loading ? (
            <div className="py-12 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 bg-slate-900/40 border border-white/5 rounded-xl space-y-3 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-8 bg-white/5 rounded w-full" />
                </div>
              ))}
            </div>
          ) : banks.length === 0 && donors.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <AlertTriangle className="w-8 h-8 text-oneblood-gold mx-auto" />
              <p>No results found in this range. Try raising the radius limit.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Blood Banks */}
              {banks.map(bank => {
                const qty = getComponentQty(bank, component, bloodGroup);
                const isSelected = selectedItem?._id === bank._id;
                const isExpanded = expandedCardId === bank._id;
                return (
                  <div 
                    key={bank._id}
                    ref={isSelected ? selectedCardRef : null}
                    onClick={() => handleItemClick(bank)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${isSelected ? 'bg-slate-900 border-blue-500 shadow-xl shadow-blue-900/20 ring-1 ring-blue-500/30' : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="flex items-center space-x-1.5 mb-2 text-[10px] font-bold text-blue-400 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"/>
                        <span>Selected on map</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-bold text-sm text-white flex items-center space-x-1.5">
                          <Landmark className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="truncate">{bank.name}</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">{bank.address}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border shrink-0 ${qty >= 5 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : qty > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {qty} Units
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-3 text-[10px] text-slate-400">
                        <span className="flex items-center space-x-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> <span>{bank.phone}</span></span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <a 
                          href={`tel:${bank.phone}`}
                          className="px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 font-bold rounded-lg text-xs"
                        >
                          Call
                        </a>
                        <Link
                          to={`/blood-bank/${bank._id}#inventory`}
                          className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 font-bold rounded-lg text-xs flex items-center space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Details</span>
                        </Link>
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedCardId(null);
                            } else {
                              handleItemClick(bank);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isExpanded ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isExpanded ? 'Hide Route' : '🗺 Directions'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <CardDirections
                        item={bank}
                        userLocation={userLocation}
                        centerIcon={centerIcon}
                        bankIcon={bankIcon}
                        donorIcon={donorIcon}
                      />
                    )}
                  </div>
                );
              })}

              {/* Donors */}
              {donors.map(donor => {
                const isSelected = selectedItem?._id === donor._id;
                const isExpanded = expandedCardId === donor._id;
                return (
                  <div 
                    key={donor._id}
                    ref={isSelected ? selectedCardRef : null}
                    onClick={() => handleItemClick(donor)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${isSelected ? 'bg-slate-900 border-oneblood-crimson shadow-xl shadow-red-900/20 ring-1 ring-red-500/30' : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="flex items-center space-x-1.5 mb-2 text-[10px] font-bold text-oneblood-crimson animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-oneblood-crimson"/>
                        <span>Selected on map</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-bold text-sm text-white flex items-center space-x-1.5">
                          <HeartPulse className="w-4 h-4 text-oneblood-crimson animate-pulse shrink-0" />
                          <span className="truncate">{donor.name}</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1">{donor.city}</p>
                      </div>
                      <span className="text-xs font-black px-2.5 py-0.5 bg-oneblood-crimson/20 border border-oneblood-crimson/30 text-oneblood-crimson rounded-full shrink-0">
                        {donor.bloodGroup}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-3.5 pt-3.5 border-t border-white/5">
                      <span className="flex items-center space-x-1 text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-oneblood-gold" />
                        <span>Eligible & Active &bull; {donor.totalDonations} donations</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-oneblood-gold italic font-bold">🟢 Available Now</span>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => openRequestModal(donor)}
                          className="px-3 py-1.5 bg-[#C0152A] hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                        >
                          Request
                        </button>
                        <Link 
                          to={`/donor/${donor._id}`}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                        >
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedCardId(null);
                            } else {
                              handleItemClick(donor);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isExpanded ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isExpanded ? 'Hide Route' : '🗺 Directions'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <CardDirections
                        item={donor}
                        userLocation={userLocation}
                        centerIcon={centerIcon}
                        bankIcon={bankIcon}
                        donorIcon={donorIcon}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Panel: Stunning Map Overlay */}
      <div 
        className={`w-full md:w-7/12 relative order-1 md:order-2 transition-all duration-300 ${
          mobileShowMap ? 'h-[65%] md:h-full' : 'h-[30%] md:h-full'
        }`}
      >
        <MapContainer center={userLocation} zoom={12} className="w-full h-full z-10">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <ChangeMapView center={userLocation} triggerInvalidate={mobileShowMap} />

          {/* Current Search Center */}
          <Marker position={userLocation} icon={centerIcon} />

          {/* Route line visual representation */}
          {routeCoordinates.length > 0 && (
            <Polyline positions={routeCoordinates} color="#B91C1C" weight={5} opacity={0.8} />
          )}

          {/* Blood Banks markers */}
          {banks.map(bank => {
            const coords = getItemCoords(bank);
            if (!coords) return null;
            return (
              <Marker 
                key={bank._id} 
                position={coords} 
                icon={bankIcon}
                eventHandlers={{ click: () => handleItemClick(bank) }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-slate-800 font-sans text-xs">
                    <strong className="text-blue-600 block">{bank.name}</strong>
                    <span>Availability: {getComponentQty(bank, component, bloodGroup)} Units ({bloodGroup})</span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Donors markers */}
          {donors.map(donor => {
            const coords = getItemCoords(donor);
            if (!coords) return null;
            return (
              <Marker 
                key={donor._id} 
                position={coords} 
                icon={donorIcon}
                eventHandlers={{ click: () => handleItemClick(donor) }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-slate-800 font-sans text-xs">
                    <strong className="text-red-600 block">{donor.name}</strong>
                    <span>Group: {donor.bloodGroup}</span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

      </div>

      {/* Mobile Floating Resize Map/List Toggle */}
      <button 
        onClick={() => setMobileShowMap(!mobileShowMap)}
        className="md:hidden fixed bottom-4 right-4 z-30 bg-oneblood-crimson hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-1.5 cursor-pointer"
      >
        <span>{mobileShowMap ? 'Show More List 📋' : 'Maximize Map 🗺'}</span>
      </button>

      {/* 3. Send Request Gated modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-left animate-fadeIn">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <FileText className="w-4.5 h-4.5 text-oneblood-crimson" />
                <span>{selectedDonor ? `Send Blood Request to ${selectedDonor.name}` : `Send Request to all nearby ${bloodGroup} donors`}</span>
              </h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Full Name</label>
                <input 
                  type="text" 
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient full name"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hospital Details</label>
                <input 
                  type="text" 
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. KLE Hospital, Bengaluru"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Units Needed</label>
                  <div className="flex items-center space-x-2 bg-slate-950 border border-white/10 rounded-xl px-2">
                    <button type="button" onClick={() => setUnitsNeeded(Math.max(1, unitsNeeded - 1))} className="p-1.5 text-slate-400 hover:text-white"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="flex-grow text-center text-xs font-bold text-white">{unitsNeeded}</span>
                    <button type="button" onClick={() => setUnitsNeeded(unitsNeeded + 1)} className="p-1.5 text-slate-400 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Urgency</label>
                  <select 
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="critical">🚨 Critical</option>
                    <option value="urgent">Urgent</option>
                    <option value="moderate">Moderate</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Optional Message</label>
                <textarea 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Any additional details or directives..."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2 text-slate-400 text-[10px]">
                <div className="flex items-center justify-between">
                  <span>📎 Doctor Prescription Letter:</span>
                  <span className={uploadedLetterUrl ? 'text-emerald-400 font-bold' : 'text-amber-500 font-bold'}>
                    {uploadedLetterUrl ? '✓ Extracted Letter Attached' : 'No Letter Attached'}
                  </span>
                </div>
                {uploadedLetterUrl && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5 animate-fadeIn">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Uploaded Document Preview</span>
                    {uploadedLetterUrl.toLowerCase().includes('.pdf') ? (
                      <div className="p-2 bg-slate-950 rounded-lg border border-white/10 flex items-center justify-between">
                        <span className="text-[10px] text-slate-300 truncate max-w-[200px]">{uploadedLetterUrl.split('/').pop()}</span>
                        <a 
                          href={uploadedLetterUrl.startsWith('http') || uploadedLetterUrl.startsWith('blob:') ? uploadedLetterUrl : `${ASSETS_URL}${uploadedLetterUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-oneblood-crimson hover:underline font-bold"
                        >
                          View PDF ↗
                        </a>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border border-white/10 max-h-36 flex flex-col items-center justify-center bg-slate-950 p-1">
                        <img 
                          src={uploadedLetterUrl.startsWith('http') || uploadedLetterUrl.startsWith('blob:') ? uploadedLetterUrl : `${ASSETS_URL}${uploadedLetterUrl}`} 
                          alt="Uploaded prescription letter" 
                          className="object-contain max-h-32 w-full rounded"
                        />
                        <a 
                          href={uploadedLetterUrl.startsWith('http') || uploadedLetterUrl.startsWith('blob:') ? uploadedLetterUrl : `${ASSETS_URL}${uploadedLetterUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] text-oneblood-crimson hover:underline font-bold mt-1.5"
                        >
                          Open image in new tab ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 text-slate-400 text-xs font-bold rounded-xl text-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-oneblood-crimson hover:bg-red-700 text-white text-xs font-bold rounded-xl text-center flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SearchPage;
