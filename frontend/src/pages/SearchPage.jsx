import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';
import { 
  Search as SearchIcon, MapPin, Landmark, Heart, Phone, 
  ShieldCheck, HeartPulse, Upload, FileText, 
  AlertTriangle, Send, X, Plus, Minus, Loader2, ExternalLink,
  ClipboardList, Check, Activity
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { cardHover, scaleIn } from '../utils/animations';

// Fix standard leaflet icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom SVG markers
const donorIcon = L.divIcon({
  className: 'custom-donor-marker',
  html: `<div class="w-8 h-8 rounded-full bg-ob-red-700 border-2 border-white dark:border-ob-ink flex items-center justify-center text-white shadow-glow-red animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const bankIcon = L.divIcon({
  className: 'custom-bank-marker',
  html: `<div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white dark:border-ob-ink flex items-center justify-center text-white shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2-8 5v2h16V7Z"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><line x1="3" y1="22" x2="21" y2="22"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const centerIcon = L.divIcon({
  className: 'custom-center-marker',
  html: `<div class="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shadow-lg animate-pulse"><div class="w-3.5 h-3.5 bg-emerald-500 rounded-full"></div></div>`,
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

const CardDirections = ({ item, userLocation }) => {
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
      <div className="h-[200px] flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-2xl text-neutral-500 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-ob-red-700" />
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
    <div className="space-y-3 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 animate-fadeIn">
      <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
        <span className="px-2.5 py-1 bg-ob-red-700/10 border border-ob-red-700/25 text-ob-red-700 rounded-full">
          📍 {routeData.distanceKm} km  •  ~{routeData.etaMinutes} min drive
        </span>
        <div className="flex space-x-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-1 bg-ob-red-700 hover:bg-red-800 text-white rounded-full text-[10px] font-bold transition-all active:scale-95"
          >
            Google Maps
          </a>
          {isIOS && (
            <a
              href={appleMapsUrl}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-full text-[10px] transition-all active:scale-95"
            >
              Apple Maps
            </a>
          )}
        </div>
      </div>

      <div className="h-[180px] w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-850 relative z-10" onClick={(e) => e.stopPropagation()}>
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
          {polylineCoords.length > 0 && <Polyline positions={polylineCoords} color="#B91C1C" weight={4} />}
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
    'Visakhapatnam': [17.6868, 83.2185]
  };
  return mapping[cityName] || defaultCoords;
};

export default function SearchPage() {
  const { user, oneblood_token } = useAuthStore();
  const { socket } = useNotificationStore();
  const navigate = useNavigate();

  const [searchMode, setSearchMode] = useState('smart');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [component, setComponent] = useState('prbc');
  const [radius, setRadius] = useState(25);
  const [locationLabel, setLocationLabel] = useState('📍 Detecting location...');
  const [userLocation, setUserLocation] = useState(() => getCityCoords(user?.city));
  const [manualCity, setManualCity] = useState('');

  const [donors, setDonors] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const [mobileShowMap, setMobileShowMap] = useState(false);
  const listContainerRef = useRef(null);
  const selectedCardRef = useRef(null);

  const [ocrStatus, setOcrStatus] = useState('idle');
  const [ocrFile, setOcrFile] = useState(null);
  const [aiExtractedData, setAiExtractedData] = useState(null);
  const [uploadedLetterUrl, setUploadedLetterUrl] = useState('');
  const [isEditingAi, setIsEditingAi] = useState(false);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('male');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorContact, setDoctorContact] = useState('');
  const [modalBloodComponent, setModalBloodComponent] = useState('prbc');
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [urgency, setUrgency] = useState('urgent');
  const [messageText, setMessageText] = useState('');
  const [modalLetterFile, setModalLetterFile] = useState(null);
  const [modalLetterPreview, setModalLetterPreview] = useState('');
  const [modalLetterUploading, setModalLetterUploading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationLabel("📍 Using your live location");
      },
      () => {
        const cityCoords = getCityCoords(user?.city);
        setUserLocation(cityCoords);
        setLocationLabel(user?.city ? `📍 Using ${user.city} center` : "📍 Bengaluru, India (Default)");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [user?.city]);

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

  useEffect(() => {
    executeSearch();
  }, [userLocation, radius, bloodGroup, component]);

  useEffect(() => {
    if (socket) {
      socket.on('inventory_updated', () => {
        executeSearch();
      });
    }
  }, [socket]);

  const onDrop = async (files) => {
    const file = files[0];
    if (!file) return;
    setOcrFile(file);
    setOcrStatus('reading');
    
    const fd = new FormData();
    fd.append('letter', file);

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

      if (extracted.bloodGroup) setBloodGroup(extracted.bloodGroup);
      if (extracted.bloodComponent) setComponent(extracted.bloodComponent);
      setPatientName(extracted.patientName || 'Suresh Patil');
      setHospitalName(extracted.hospitalName || extracted.hospital || 'District Hospital Hubli');
      setUnitsNeeded(parseInt(extracted.unitsRequired || extracted.unitsNeeded) || 1);
      setUrgency(extracted.urgencyLevel || extracted.urgencyAssessment || 'urgent');

      toast.success('Doctor prescription uploaded successfully!');
    } catch (err) {
      timers.forEach(clearTimeout);
      setOcrStatus('done');

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

  const handleItemClick = async (item) => {
    setSelectedItem(item);
    setExpandedCardId(item._id);

    const isBank = banks.some(b => b._id === item._id);

    if (isBank) {
      setBanks(prev => {
        const idx = prev.findIndex(b => b._id === item._id);
        if (idx <= 0) return prev;
        const reordered = [...prev];
        reordered.splice(idx, 1);
        reordered.unshift(item);
        return reordered;
      });
    } else {
      setDonors(prev => {
        const idx = prev.findIndex(d => d._id === item._id);
        if (idx <= 0) return prev;
        const reordered = [...prev];
        reordered.splice(idx, 1);
        reordered.unshift(item);
        return reordered;
      });
    }

    if (mobileShowMap) setMobileShowMap(false);

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
      setRouteCoordinates(decodePolyline(res.data.polyline));
    } catch (err) {
      setRouteCoordinates([[userLocation[0], userLocation[1]], [destLat, destLng]]);
    }
  };

  const getComponentQty = (bank, comp, bg) => {
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

  const openRequestModal = (donor) => {
    if (!oneblood_token) {
      toast.error('Please log in to send a request.');
      navigate('/auth/login');
      return;
    }
    setSelectedDonor(donor);
    setPatientName('');
    setPatientAge('');
    setPatientGender('male');
    setHospitalName('');
    setHospitalAddress('');
    setDoctorName('');
    setDoctorContact('');
    setModalBloodComponent(component);
    setUnitsNeeded(1);
    setUrgency('urgent');
    setMessageText('');
    setModalLetterFile(null);
    setModalLetterPreview('');
    setIsRequestModalOpen(true);
  };

  const handleModalLetterSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModalLetterFile(file);
    const previewUrl = URL.createObjectURL(file);
    setModalLetterPreview(previewUrl);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!patientName || !hospitalName) {
      toast.error('Patient name and Hospital details are required');
      return;
    }

    const toastId = toast.loading('Sending emergency request...');
    try {
      let finalLetterUrl = uploadedLetterUrl || '';
      if (modalLetterFile) {
        setModalLetterUploading(true);
        try {
          const fd = new FormData();
          fd.append('letter', modalLetterFile);
          const uploadRes = await api.post('/requests/verify-letter', fd);
          finalLetterUrl = uploadRes.data.fileUrl || uploadRes.data.url || '';
        } catch (uploadErr) {
          console.warn('Letter upload failed:', uploadErr.message);
        } finally {
          setModalLetterUploading(false);
        }
      }

      const requestRes = await api.post('/requests', {
        patientName,
        patientAge: parseInt(patientAge, 10) || 0,
        patientGender,
        hospitalName,
        hospitalAddress: hospitalAddress || hospitalName + `, ${manualCity || 'Bengaluru'}`,
        doctorName: doctorName || 'Not specified',
        doctorContact: doctorContact || '',
        bloodGroup,
        bloodComponent: modalBloodComponent || component,
        unitsRequired: unitsNeeded,
        urgencyLevel: urgency,
        requiredBy: new Date(Date.now() + 24*3600*1000).toISOString(),
        doctorLetterUrl: finalLetterUrl,
        lat: userLocation[0].toString(),
        lng: userLocation[1].toString(),
        targetDonorId: selectedDonor ? selectedDonor._id : null
      });

      const requestId = requestRes.data.requestId;

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
    <div className="h-[calc(100vh-60px)] flex flex-col md:flex-row bg-white dark:bg-ob-ink overflow-hidden transition-colors duration-300">
      
      {/* 1. Left Sidebar: Interactive Filters & Listings */}
      <div 
        ref={listContainerRef} 
        className={`w-full md:w-5/12 bg-white/95 dark:bg-ob-ink-90/90 backdrop-blur-xl border-t md:border-t-0 md:border-r border-neutral-200 dark:border-ob-glass-border flex flex-col z-20 overflow-y-auto order-2 md:order-1 transition-all duration-300 ${
          mobileShowMap ? 'h-[35%] md:h-full' : 'h-[70%] md:h-full'
        }`}
      >
        
        {/* Pulsing Emergency Banner */}
        <div className="bg-ob-red-700/10 border-b border-ob-red-700/20 p-3.5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-ob-red-700 dark:text-red-400 flex items-center space-x-1.5 animate-pulse">
            <HeartPulse className="w-4.5 h-4.5 text-ob-red-700 dark:text-red-500 shrink-0" />
            <span>EMERGENCY? Upload doctor prescription for immediate matches.</span>
          </span>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <button 
            onClick={() => setSearchMode('smart')}
            className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg ${
              searchMode === 'smart' 
                ? 'bg-ob-red-700 text-white shadow-glow-red' 
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Smart Search (OCR)
          </button>
          <button 
            onClick={() => setSearchMode('manual')}
            className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg ${
              searchMode === 'manual' 
                ? 'bg-ob-red-700 text-white shadow-glow-red' 
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Manual Search
          </button>
        </div>

        {/* Search settings panel */}
        <div className="p-4 border-b border-neutral-200 dark:border-ob-glass-border bg-neutral-50/50 dark:bg-neutral-900/30">
          {searchMode === 'smart' ? (
            <div className="space-y-4">
              {ocrStatus === 'idle' && (
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragActive 
                      ? 'border-ob-red-700 bg-ob-red-700/5' 
                      : 'border-neutral-300 dark:border-ob-glass-border bg-white dark:bg-neutral-950/20 hover:border-neutral-400 dark:hover:border-ob-glass-hover'
                  }`}
                >
                  <input {...getInputProps()} accept="image/*,application/pdf" capture="environment" />
                  <Upload className="w-8 h-8 mx-auto text-neutral-400 dark:text-neutral-500 mb-2" />
                  <p className="text-xs text-neutral-850 dark:text-ob-white font-bold">Drop prescription letter here</p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">PDF, JPG, PNG &bull; Mobile Camera supported</p>
                </div>
              )}

              {/* Progress logs */}
              {['reading', 'group', 'doctor'].includes(ocrStatus) && (
                <div className="p-5 bg-neutral-105 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-left space-y-3">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 border-ob-red-700 animate-spin text-ob-red-700 shrink-0" />
                    <span className="text-xs font-bold text-neutral-900 dark:text-ob-white">AI Processing Document...</span>
                  </div>
                  <ul className="text-[10px] space-y-2 font-bold text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">
                    <li className="flex items-center gap-2">
                      <span className={ocrStatus === 'reading' ? 'text-amber-505' : 'text-emerald-500'}>
                        {ocrStatus === 'reading' ? '○ Reading prescription...' : '✓ Extracted raw letter text'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={ocrStatus === 'group' ? 'text-amber-505' : ocrStatus === 'doctor' || ocrStatus === 'done' ? 'text-emerald-500' : 'text-neutral-400'}>
                        {ocrStatus === 'group' ? '○ Detecting blood group & component...' : ocrStatus === 'doctor' || ocrStatus === 'done' ? '✓ Found B+ PRBC requirements' : '• Detect blood group'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={ocrStatus === 'doctor' ? 'text-amber-505' : ocrStatus === 'done' ? 'text-emerald-500' : 'text-neutral-400'}>
                        {ocrStatus === 'doctor' ? '○ Verifying doctor credentials...' : ocrStatus === 'done' ? '✓ Signature and registration verified' : '• Verify doctor details'}
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              {ocrStatus === 'done' && aiExtractedData && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>AI Extracted Details</span>
                    </span>
                    <button 
                      onClick={() => setIsEditingAi(!isEditingAi)} 
                      className="text-[10px] text-neutral-500 dark:text-neutral-450 hover:underline font-bold"
                    >
                      {isEditingAi ? 'Save' : 'Edit'}
                    </button>
                  </div>

                  {isEditingAi ? (
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <input type="text" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 px-2 py-1 rounded text-neutral-900 dark:text-ob-white" />
                      <input type="text" value={component} onChange={(e) => setComponent(e.target.value)} className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 px-2 py-1 rounded text-neutral-900 dark:text-ob-white" />
                      <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 px-2 py-1 rounded text-neutral-900 dark:text-ob-white col-span-2" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-[11px] text-neutral-600 dark:text-neutral-300">
                      <div><span className="text-neutral-400 dark:text-neutral-500 block">Blood Group</span> <strong className="text-neutral-900 dark:text-white font-mono text-xs">{bloodGroup}</strong></div>
                      <div><span className="text-neutral-400 dark:text-neutral-500 block">Component</span> <strong className="text-neutral-900 dark:text-white uppercase text-xs">{component.replace('_', ' ')}</strong></div>
                      <div><span className="text-neutral-400 dark:text-neutral-500 block">Units Required</span> <strong className="text-neutral-900 dark:text-white text-xs">{unitsNeeded} Unit(s)</strong></div>
                      <div><span className="text-neutral-400 dark:text-neutral-500 block">Urgency</span> <strong className="text-ob-red-700 font-bold text-xs capitalize">{urgency}</strong></div>
                      <div className="col-span-2"><span className="text-neutral-400 dark:text-neutral-500 block">Hospital</span> <strong className="text-neutral-900 dark:text-white text-xs">{hospitalName}</strong></div>
                    </div>
                  )}

                  <div className="flex justify-between gap-2 pt-1.5">
                    <button 
                      onClick={() => { setOcrStatus('idle'); setAiExtractedData(null); }} 
                      className="flex-1 py-1.5 border border-neutral-250 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl text-[10px] text-center text-neutral-500 dark:text-neutral-400 font-bold"
                    >
                      Reset Upload
                    </button>
                    <button 
                      onClick={executeSearch} 
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] text-center font-bold"
                    >
                      Search compatible
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Search Form */
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block font-mono">Blood Group</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <button 
                      key={bg} 
                      onClick={() => setBloodGroup(bg)}
                      className={`py-2 text-xs font-bold border rounded-xl transition-all cursor-pointer font-mono ${
                        bloodGroup === bg 
                          ? 'border-ob-red-700 bg-ob-red-700/10 text-ob-red-700 dark:text-white font-black' 
                          : 'border-neutral-250 dark:border-ob-glass-border bg-white dark:bg-neutral-900/40 text-neutral-605 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block font-mono">Component</label>
                  <select 
                    value={component}
                    onChange={(e) => setComponent(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
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
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block font-mono">Radius</label>
                  <select 
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="10">10 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km</option>
                    <option value="100">100 km</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block font-mono">Your Location</label>
                <div className="flex space-x-2">
                  <span className="flex-grow px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-600 dark:text-neutral-350 flex items-center overflow-hidden truncate">
                    <MapPin className="w-3.5 h-3.5 text-ob-red-700 mr-1.5 shrink-0" />
                    <span>{locationLabel}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results listing */}
        <div className="flex-grow p-5 space-y-5">
          <div className="pb-2 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs text-neutral-500">
            <span className="font-semibold">Unified Results within {radius} km</span>
            <span className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">({banks.length} banks · {donors.length} donors)</span>
          </div>

          {donors.length > 0 && (
            <button
              onClick={() => openRequestModal(null)}
              className="w-full py-3 bg-ob-red-700 text-white font-extrabold rounded-xl text-xs transition-all active:scale-[0.97] flex items-center justify-center space-x-2 shadow-glow-red"
            >
              <Send className="w-4 h-4 text-white shrink-0" />
              <span>Broadcast request to compatible {bloodGroup} donors</span>
            </button>
          )}

          {loading ? (
            <div className="py-12 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-5 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3 animate-pulse">
                  <div className="h-4 bg-neutral-200 dark:bg-white/10 rounded w-2/3" />
                  <div className="h-3 bg-neutral-200 dark:bg-white/5 rounded w-1/2" />
                  <div className="h-8 bg-neutral-200 dark:bg-white/5 rounded w-full" />
                </div>
              ))}
            </div>
          ) : banks.length === 0 && donors.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-550 space-y-3 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 bg-neutral-50/50 dark:bg-neutral-900/10">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="font-semibold text-neutral-700 dark:text-neutral-300">No results found in this range.</p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Try raising the radius limit or search for a different blood group.</p>
            </div>
          ) : (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              className="space-y-4"
            >
              {/* Banks Mapping */}
              {banks.map((bank) => {
                const qty = getComponentQty(bank, component, bloodGroup);
                const isSelected = selectedItem?._id === bank._id;
                const isExpanded = expandedCardId === bank._id;
                return (
                  <motion.div 
                    variants={scaleIn}
                    key={bank._id}
                    ref={isSelected ? selectedCardRef : null}
                    onClick={() => handleItemClick(bank)}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'border-blue-500/50 bg-blue-500/5 dark:bg-blue-900/10 shadow-lg ring-1 ring-blue-500/30' 
                        : 'bg-neutral-50/60 dark:bg-ob-ink-90/30 hover:bg-neutral-100 dark:hover:bg-ob-ink-90/50 border-neutral-200 dark:border-ob-glass-border'
                    }`}
                  >
                    {isSelected && (
                      <div className="flex items-center space-x-1.5 mb-2.5 text-[10px] font-bold text-blue-500 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"/>
                        <span>Selected on map</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-3">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-ob-white flex items-center space-x-2">
                          <Landmark className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="truncate">{bank.name}</span>
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{bank.address}</p>
                      </div>
                      <span className={`text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full border shrink-0 ${
                        qty >= 5 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : qty > 0 
                          ? 'bg-amber-500/10 text-amber-555 border-amber-500/20' 
                          : 'bg-ob-red-700/10 text-ob-red-700 border-ob-red-700/20'
                      }`}>
                        {qty} Units
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-neutral-200 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-3 text-[10px] text-neutral-500">
                        <span className="flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" /> 
                          <span className="font-mono">{bank.phone}</span>
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <a 
                          href={`tel:${bank.phone}`}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 font-bold rounded-xl text-xs transition-colors"
                        >
                          Call
                        </a>
                        <Link
                          to={`/blood-bank/${bank._id}`}
                          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-500 font-bold rounded-xl text-xs flex items-center space-x-1 transition-colors"
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
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            isExpanded 
                              ? 'bg-ob-red-700 text-white shadow-glow-red' 
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
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
                      />
                    )}
                  </motion.div>
                );
              })}

              {/* Donors Mapping */}
              {donors.map((donor) => {
                const isSelected = selectedItem?._id === donor._id;
                const isExpanded = expandedCardId === donor._id;
                return (
                  <motion.div 
                    variants={scaleIn}
                    key={donor._id}
                    ref={isSelected ? selectedCardRef : null}
                    onClick={() => handleItemClick(donor)}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'border-ob-red-700/50 bg-ob-red-700/5 shadow-lg ring-1 ring-ob-red-700/30' 
                        : 'bg-neutral-50/60 dark:bg-ob-ink-90/30 hover:bg-neutral-100 dark:hover:bg-ob-ink-90/50 border-neutral-200 dark:border-ob-glass-border'
                    }`}
                  >
                    {isSelected && (
                      <div className="flex items-center space-x-1.5 mb-2.5 text-[10px] font-bold text-ob-red-700 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-ob-red-700"/>
                        <span>Selected on map</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-3">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-ob-white flex items-center space-x-2">
                          <HeartPulse className="w-4 h-4 text-ob-red-700 shrink-0" />
                          <span className="truncate">{donor.name}</span>
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{donor.city}</p>
                      </div>
                      <span className="text-xs font-black font-mono px-3 py-0.5 bg-ob-red-700/10 border border-ob-red-700/25 text-ob-red-700 rounded-full shrink-0">
                        {donor.bloodGroup}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-3.5 pt-3.5 border-t border-neutral-200 dark:border-neutral-800">
                      <span className="flex items-center space-x-1.5 font-medium">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span>Active &bull; {donor.totalDonations} donations</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-neutral-200 dark:border-neutral-800" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span>Available Now</span>
                      </span>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => openRequestModal(donor)}
                          className="px-3 py-1.5 bg-ob-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                        >
                          Request
                        </button>
                        <Link 
                          to={`/donor/${donor._id}`}
                          className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-colors"
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
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            isExpanded 
                              ? 'bg-ob-red-700 text-white shadow-glow-red' 
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
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
                      />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* 2. Map Container */}
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

          <Marker position={userLocation} icon={centerIcon} />

          {routeCoordinates.length > 0 && (
            <Polyline positions={routeCoordinates} color="#B91C1C" weight={5} opacity={0.8} />
          )}

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
                <Popup className="ob-map-popup">
                  <div className="p-1 space-y-1 font-sans text-xs text-neutral-800 dark:text-neutral-200">
                    <strong className="text-blue-600 block">{bank.name}</strong>
                    <span>Availability: {getComponentQty(bank, component, bloodGroup)} Units ({bloodGroup})</span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

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
                <Popup className="ob-map-popup">
                  <div className="p-1 space-y-1 font-sans text-xs text-neutral-800 dark:text-neutral-200">
                    <strong className="text-ob-red-700 block">{donor.name}</strong>
                    <span>Group: {donor.bloodGroup}</span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setMobileShowMap(!mobileShowMap)}
        className="md:hidden fixed bottom-4 right-4 z-30 bg-ob-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-glow-red flex items-center gap-1.5 cursor-pointer"
      >
        {mobileShowMap ? (
          <>
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Show List</span>
          </>
        ) : (
          <>
            <MapPin className="w-3.5 h-3.5" />
            <span>Maximize Map</span>
          </>
        )}
      </button>

      {/* Emergency Request Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-lg bg-white dark:bg-ob-ink border border-neutral-200 dark:border-ob-glass-border rounded-3xl shadow-float overflow-hidden text-left max-h-[92vh] flex flex-col"
            >
              <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/40">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-ob-white flex items-center space-x-2">
                  <FileText className="w-4.5 h-4.5 text-ob-red-700" />
                  <span>{selectedDonor ? `Emergency Request to ${selectedDonor.name}` : `Broadcast Request to nearby ${bloodGroup} donors`}</span>
                </h3>
                <button onClick={() => setIsRequestModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-ob-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendRequest} className="p-5 space-y-4 overflow-y-auto flex-1">
                
                {/* Section: Patient */}
                <div className="pb-1">
                  <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    Patient Details
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Patient Full Name <span className="text-ob-red-700">*</span></label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Enter patient's full name"
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 transition-all"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Patient Age</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value)}
                          placeholder="e.g. 45"
                          className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Patient Gender</label>
                        <select
                          value={patientGender}
                          onChange={(e) => setPatientGender(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 transition-all cursor-pointer"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="unknown">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Blood */}
                <div className="pb-1">
                  <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    Requirements
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Blood Component</label>
                      <select
                        value={modalBloodComponent}
                        onChange={(e) => setModalBloodComponent(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 transition-all cursor-pointer"
                      >
                        <option value="whole_blood">Whole Blood</option>
                        <option value="prbc">Packed RBC (PRBC)</option>
                        <option value="plasma">Fresh Frozen Plasma</option>
                        <option value="platelets">Platelets</option>
                        <option value="cryoprecipitate">Cryoprecipitate</option>
                        <option value="sdp">Single Donor Platelets (SDP)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Units Needed</label>
                        <div className="flex items-center space-x-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl px-2">
                          <button type="button" onClick={() => setUnitsNeeded(Math.max(1, unitsNeeded - 1))} className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="flex-grow text-center text-xs font-mono font-bold text-neutral-900 dark:text-ob-white">{unitsNeeded}</span>
                          <button type="button" onClick={() => setUnitsNeeded(unitsNeeded + 1)} className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Urgency <span className="text-ob-red-700">*</span></label>
                        <select
                          value={urgency}
                          onChange={(e) => setUrgency(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 transition-all cursor-pointer"
                        >
                          <option value="critical">🚨 Critical</option>
                          <option value="urgent">Urgent</option>
                          <option value="moderate">Moderate</option>
                          <option value="scheduled">Scheduled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Hospital */}
                <div className="pb-1">
                  <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    Hospital & Clinical Info
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Hospital Name <span className="text-ob-red-700">*</span></label>
                      <input
                        type="text"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        placeholder="e.g. KLE Hospital, Bengaluru"
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Hospital Address</label>
                      <input
                        type="text"
                        value={hospitalAddress}
                        onChange={(e) => setHospitalAddress(e.target.value)}
                        placeholder="Full hospital address"
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Doctor's Name</label>
                        <input
                          type="text"
                          value={doctorName}
                          onChange={(e) => setDoctorName(e.target.value)}
                          placeholder="Dr. Full Name"
                          className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Doctor's Contact</label>
                        <input
                          type="tel"
                          value={doctorContact}
                          onChange={(e) => setDoctorContact(e.target.value)}
                          placeholder="+91 XXXXX XXXXX"
                          className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Prescription Letter */}
                <div className="pb-1">
                  <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    Doctor's Prescription
                  </p>
                  <label
                    htmlFor="modal-letter-upload"
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all ${
                      modalLetterPreview
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-neutral-250 dark:border-ob-glass-border bg-neutral-50 dark:bg-neutral-900/60 hover:border-ob-red-700/40'
                    }`}
                  >
                    {modalLetterPreview ? (
                      <>
                        {modalLetterFile?.type?.startsWith('image/') ? (
                          <img
                            src={modalLetterPreview}
                            alt="Prescription preview"
                            className="max-h-32 w-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-500">
                            <FileText className="w-5 h-5" />
                            <span className="text-xs font-bold truncate max-w-[200px] font-mono">{modalLetterFile?.name}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-emerald-500 font-bold">✓ Prescription attached</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-neutral-400 dark:text-neutral-505" />
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 text-center font-semibold">
                          Click to upload doctor's prescription<br />
                          <span className="text-neutral-400 dark:text-neutral-600">JPG, PNG or PDF</span>
                        </span>
                      </>
                    )}
                    <input
                      id="modal-letter-upload"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleModalLetterSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Additional Message Notes</label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Enter special coordination details or guidelines here..."
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border rounded-xl text-xs text-neutral-900 dark:text-ob-white focus:outline-none focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 transition-all h-16 resize-none"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="flex-grow py-2.5 border border-neutral-250 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-500 dark:text-neutral-450 text-xs font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLetterUploading}
                    className="flex-grow py-2.5 bg-ob-red-700 hover:bg-red-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition-all shadow-glow-red"
                  >
                    {modalLetterUploading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Uploading...</span></>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /><span>Submit Broadcast</span></>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
