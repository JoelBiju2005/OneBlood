import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, Users, MapPin, Search, ArrowRight, HeartPulse } from 'lucide-react';
import Logo from '../components/shared/Logo';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import HallOfFameSection from '../components/shared/HallOfFameSection';

const AnimatedNumber = ({ value, suffix = "" }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (end === 0) return;
    
    const duration = 1500; // ms
    const incrementTime = Math.max(Math.floor(duration / end), 15);
    
    const timer = setInterval(() => {
      start += Math.max(Math.ceil(end / 100), 1);
      if (start >= end) {
        clearInterval(timer);
        setCurrent(end);
      } else {
        setCurrent(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{current.toLocaleString()}{suffix}</span>;
};

const LandingPage = () => {
  const { user, login } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDonors: 1240,
    totalBanks: 37,
    requestsFulfilled: 890,
    livesHelped: 2600,
  });

  const handleQuickLogin = async (onebloodId, email, password) => {
    try {
      await login(onebloodId, email, password);
      toast.success('Logged in successfully!');
      navigate('/home', { replace: true });
    } catch (err) {
      toast.error('Quick login failed. Make sure DB is seeded!');
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/public');
        if (res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch public stats:', err);
      }
    };
    fetchStats();
  }, []);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white min-h-[calc(100vh-80px)] flex flex-col justify-center transition-colors duration-300">
      {/* Dynamic decorative backdrop gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-red-600/10 dark:bg-red-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-slate-200 dark:bg-amber-500/5 blur-[120px] pointer-events-none" />


      {/* Main Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full font-sans">
        <div className="flex flex-col items-center justify-center text-center space-y-10">
          
          {/* Heading and Tagline */}
          <div className="space-y-8 flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 text-xs text-red-500 font-semibold"
            >
              <HeartPulse className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Real-time Blood Coordination Service</span>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] font-display">
                One Platform.<br />
                <span className="text-red-600 dark:text-red-500">Every Blood Need.</span>
              </h1>
              <p className="text-base sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Connect directly with active donors and local blood banks in South India. Request emergency units with instant AI letter validation and secure proximity alerts.
              </p>
            </motion.div>
 
            {/* Call To Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-6"
            >
              <Link 
                to={user ? "/home" : "/auth/signup?role=patient"}
                state={{ role: 'patient' }}
                className="px-10 py-5 text-lg rounded-full bg-oneblood-crimson hover:bg-red-700 text-white font-bold hover:shadow-lg hover:shadow-red-700/30 transition-all duration-200 flex items-center space-x-2.5 group"
              >
                <span>I Need Blood</span>
              </Link>
              <Link 
                to={user ? "/noticeboard" : "/auth/signup?role=donor"}
                state={{ role: 'donor' }}
                className="px-10 py-5 text-lg rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 keep-white text-white font-bold hover:shadow-lg hover:shadow-slate-700/30 transition-all duration-200 flex items-center space-x-2.5 group"
              >
                <span>I Want to Donate</span>
              </Link>
            </motion.div>
          </div>

          {/* Stats Visual (OneBlood at a Glance) */}
          <div className="w-full max-w-5xl mx-auto pt-12 relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 80 }}
              className="relative w-full bg-gradient-to-br from-white via-slate-100 to-white dark:from-slate-900 dark:via-red-950/20 dark:to-slate-900 border border-slate-200 dark:border-red-500/20 rounded-3xl p-8 lg:p-12 flex flex-col gap-8 shadow-md dark:shadow-2xl overflow-hidden group hover:border-slate-300 dark:hover:border-red-500/40 transition-all duration-300"
            >
              {/* Glow effects */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-red-600/5 dark:bg-red-600/10 blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-amber-500/5 blur-[60px] pointer-events-none" />
 
              {/* Header */}
              <div className="flex items-center justify-between relative z-10 border-b border-slate-200 dark:border-white/10 pb-6">
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-[4px] text-red-600 dark:text-red-500/80">Live Network</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">OneBlood at a Glance</h3>
                </div>
                <Logo size="lg" showText={false} />
              </div>
 
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center hover:border-red-500/40 transition-all">
                  <p className="text-4xl lg:text-5xl font-black text-red-600 dark:text-red-500"><AnimatedNumber value={stats.totalDonors} /></p>
                  <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-wider font-semibold">Donors Active</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center hover:border-blue-500/40 transition-all">
                  <p className="text-4xl lg:text-5xl font-black text-blue-600 dark:text-blue-400"><AnimatedNumber value={stats.totalBanks} /></p>
                  <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-wider font-semibold">Blood Banks</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center hover:border-amber-500/40 transition-all">
                  <p className="text-4xl lg:text-5xl font-black text-amber-600 dark:text-amber-500"><AnimatedNumber value={stats.requestsFulfilled} /></p>
                  <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-wider font-semibold">Requests Fulfilled</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center hover:border-emerald-500/40 transition-all">
                  <p className="text-4xl lg:text-5xl font-black text-emerald-600 dark:text-emerald-400"><AnimatedNumber value={stats.livesHelped} /></p>
                  <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-wider font-semibold">Lives Helped</p>
                </div>
              </div>
 
              {/* Bottom tagline */}
              <div className="pt-4 text-center relative z-10">
                <p className="text-sm italic text-slate-700 dark:text-slate-300 font-medium">
                  "Protecting hope through one coordinated blood network."
                </p>
              </div>
            </motion.div>
          </div>
        </div>



        {/* Feature section cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
        >
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-left hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all">
            <Shield className="w-8 h-8 text-red-500 mb-4" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Claude AI Verification</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every request requires a prescription letter upload, scanned instantly by Anthropic's Claude API to guarantee authenticity and prevent spam.
            </p>
          </motion.div>
 
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-left hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all">
            <Activity className="w-8 h-8 text-amber-500 mb-4" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Proximity Broadcasts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Proximity filters automatically target matching donors and local blood banks within a 10km to 25km radius for immediate dispatch responses.
            </p>
          </motion.div>
 
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-left hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none transition-all">
            <Users className="w-8 h-8 text-emerald-500 mb-4" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Donor Privacy Lock</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Donor contact information is encrypted and completely hidden from public listings, revealed only after the donor accepts a specific emergency.
            </p>
          </motion.div>
        </motion.div>

        {/* Blood Donation Knowledge Base */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-24 space-y-12 max-w-5xl mx-auto"
        >
          <div className="text-center space-y-3">
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-[#C0152A] font-black uppercase tracking-wider rounded-full text-xs">
              Education & Safety
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
              Understanding Blood Donation
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Basic knowledge, safety guidelines, health advantages, and the different ways you can save lives.
            </p>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Donation Safety */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6 text-left shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-red-500/15 border border-red-500/20 text-red-500 rounded-2xl w-fit">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Donation Safety & Guidelines</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Donating blood is completely safe. Every donation uses a new, sterile, disposable needle that is discarded immediately after use.
                </p>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C0152A] font-bold">✓</span>
                    <span><strong>Eligibility:</strong> Age 18–65, weight ≥ 45 kg, and in generally good health.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C0152A] font-bold">✓</span>
                    <span><strong>Preparation:</strong> Eat a healthy meal, drink plenty of water, and get 8 hours of sleep before donating.</span>
                  </li>
                </ul>
              </div>
            </div>
 
            {/* Column 2: Health Advantages */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6 text-left shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-2xl w-fit">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Health Advantages</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Saving lives has outstanding biological and psychological rewards for the donor as well.
                </p>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                    <span><strong>Regulates Iron:</strong> Helps maintain healthy iron concentrations, reducing the risk of heart disease.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                    <span><strong>Cell Renewal:</strong> Stimulates the production of fresh red blood cells in the bone marrow.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                    <span><strong>Joy of Giving:</strong> Proven psychological benefits from helping those undergoing emergency medical procedures.</span>
                  </li>
                </ul>
              </div>
            </div>
 
            {/* Column 3: Types of Donation */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6 text-left shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/15 border border-amber-500/20 text-amber-500 dark:text-amber-400 rounded-2xl w-fit">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Types of Donations</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your blood is separated into multiple life-saving components depending on patients' medical needs:
                </p>
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/5">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-slate-800 dark:text-white font-bold block">Whole Blood</span>
                    The most common type. Includes red cells, plasma, and platelets. Used for trauma, surgeries, and anemia.
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-slate-800 dark:text-white font-bold block">Platelets (Apheresis)</span>
                    Crucial for cancer patients undergoing chemotherapy, organ transplants, and massive blood loss. Can be done every 7 days.
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-slate-800 dark:text-white font-bold block">Plasma / RBCs</span>
                    Plasma contains clotting factors and proteins used for severe burns and shock. Red blood cells (RBCs) target oxygen delivery.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Hall of Fame section */}
        <HallOfFameSection />
      </div>
    </div>
  );
};

export default LandingPage;
