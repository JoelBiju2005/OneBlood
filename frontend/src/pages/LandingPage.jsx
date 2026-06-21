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
        staggerChildren: 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 90, damping: 14 } }
  };

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-[#07070A] text-slate-800 dark:text-white min-h-[calc(100vh-80px)] flex flex-col justify-center transition-colors duration-300">
      {/* Dynamic decorative backdrop gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-red-600/[0.03] dark:bg-red-600/[0.03] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-slate-200/[0.03] dark:bg-amber-500/[0.02] blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] left-[25%] w-[40vw] h-[40vw] rounded-full bg-red-500/[0.01] blur-[160px] pointer-events-none" />

      {/* Main Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full font-sans">
        <div className="flex flex-col items-center justify-center text-center space-y-12">
          
          {/* Heading and Tagline */}
          <div className="space-y-8 flex flex-col items-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="space-y-6"
            >
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.05] font-display">
                Every Drop Counts.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C0152A] to-[#FF4D6A]">Every Second Matters.</span>
              </h1>
              <p className="text-base sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-body font-light">
                Connecting blood seekers with donors in real-time. Our emergency coordination platform saves lives when every second is critical.
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
                to={user ? "/home" : "/auth/signup?role=seeker"}
                state={{ role: 'seeker' }}
                className="px-10 py-5 text-lg rounded-2xl bg-gradient-to-r from-[#C0152A] to-[#FF4D6A] text-white font-bold hover:shadow-lg hover:shadow-red-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center space-x-2.5 group keep-white"
              >
                <span>Find Blood Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to={user ? "/noticeboard" : "/auth/signup?role=donor"}
                state={{ role: 'donor' }}
                className="px-10 py-5 text-lg rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white font-bold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center space-x-2.5 group"
              >
                <span>Register as Donor</span>
              </Link>
            </motion.div>
          </div>

          {/* Stats Visual (OneBlood at a Glance) */}
          <div className="w-full max-w-5xl mx-auto pt-8 relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 70, damping: 14 }}
              className="relative w-full bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] rounded-3xl p-8 lg:p-12 flex flex-col gap-8 shadow-xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur-md overflow-hidden group hover:border-slate-300 dark:hover:border-white/[0.1] transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-center justify-between relative z-10 border-b border-slate-200 dark:border-white/[0.08] pb-6">
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-[4px] text-[#C0152A] dark:text-[#FF4D6A]">Live Network</p>
                  <h3 className="text-2xl font-extrabold text-slate-850 dark:text-white mt-1 font-display">OneBlood at a Glance</h3>
                </div>
                <Logo size="lg" showText={false} />
              </div>
 
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 text-center hover:border-[#C0152A]/30 dark:hover:border-[#C0152A]/30 hover:scale-[1.02] duration-300 transition-all">
                  <p className="text-4xl lg:text-5xl font-black text-[#C0152A] dark:text-[#FF4D6A]"><AnimatedNumber value={stats.totalDonors} /></p>
                  <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider font-semibold">Active Donors</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 text-center hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:scale-[1.02] duration-300 transition-all">
                  <p className="text-4xl lg:text-5xl font-black text-blue-600 dark:text-blue-400"><AnimatedNumber value={stats.totalBanks} /></p>
                  <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider font-semibold">Blood Banks</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 text-center hover:border-amber-500/30 dark:hover:border-amber-500/30 hover:scale-[1.02] duration-300 transition-all">
                  <p className="text-4xl lg:text-5xl font-black text-amber-500"><AnimatedNumber value={stats.requestsFulfilled} /></p>
                  <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider font-semibold">Requests Fulfilled</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 text-center hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:scale-[1.02] duration-300 transition-all">
                  <p className="text-4xl lg:text-5xl font-black text-emerald-500"><AnimatedNumber value={stats.livesHelped} /></p>
                  <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider font-semibold">Lives Helped</p>
                </div>
              </div>
 
              {/* Bottom tagline */}
              <div className="pt-4 text-center relative z-10">
                <p className="text-sm italic text-slate-650 dark:text-slate-350 font-medium">
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
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
        >
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#0F0F1A]/40 border border-slate-200 dark:border-white/[0.05] backdrop-blur-md rounded-2xl p-8 text-left hover:border-slate-300 dark:hover:border-oneblood-crimson/20 shadow-sm hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_20px_50px_rgba(192,21,42,0.08)] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-red-150 dark:bg-red-500/[0.05] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-[#C0152A]" />
            </div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-3">Claude AI Verification</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-body">
              Every request requires a prescription letter upload, scanned instantly by Anthropic's Claude API to guarantee authenticity and prevent spam.
            </p>
          </motion.div>
 
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#0F0F1A]/40 border border-slate-200 dark:border-white/[0.05] backdrop-blur-md rounded-2xl p-8 text-left hover:border-slate-300 dark:hover:border-amber-500/20 shadow-sm hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_20px_50px_rgba(245,158,11,0.08)] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-amber-150 dark:bg-amber-500/[0.05] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-3">Proximity Broadcasts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-body">
              Proximity filters automatically target matching donors and local blood banks within a 10km to 25km radius for immediate dispatch responses.
            </p>
          </motion.div>
 
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#0F0F1A]/40 border border-slate-200 dark:border-white/[0.05] backdrop-blur-md rounded-2xl p-8 text-left hover:border-slate-300 dark:hover:border-emerald-500/20 shadow-sm hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_20px_50px_rgba(16,185,129,0.08)] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-150 dark:bg-emerald-500/[0.05] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-3">Donor Privacy Lock</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-body">
              Donor contact information is encrypted and completely hidden from public listings, revealed only after the donor accepts a specific emergency.
            </p>
          </motion.div>
        </motion.div>

        {/* Blood Donation Knowledge Base */}
        <div className="mt-32 space-y-16 max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-3"
          >
            <span className="px-3 py-1.5 bg-[#C0152A]/[0.05] border border-[#C0152A]/10 text-[#C0152A] dark:text-[#FF4D6A] font-bold uppercase tracking-[2px] rounded-full text-[10px]">
              Education & Safety
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-850 dark:text-white font-display">
              Understanding Blood Donation
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-body">
              Basic knowledge, safety guidelines, health advantages, and the different ways you can save lives.
            </p>
          </motion.div>
 
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Column 1: Donation Safety */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#0F0F1A]/40 border border-slate-200 dark:border-white/[0.05] rounded-3xl p-8 text-left shadow-sm hover:border-slate-300 dark:hover:border-white/[0.1] hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-[#C0152A] rounded-xl w-fit">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-850 dark:text-white">Donation Safety</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-body">
                  Donating blood is completely safe. Every donation uses a new, sterile, disposable needle that is discarded immediately after use.
                </p>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-3.5 pt-4 border-t border-slate-200 dark:border-white/[0.05]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C0152A] font-bold">✓</span>
                    <span><strong>Eligibility:</strong> Age 18–65, weight ≥ 45 kg, and in generally good health.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C0152A] font-bold">✓</span>
                    <span><strong>Preparation:</strong> Eat a healthy meal, drink plenty of water, and get 8 hours of sleep before donating.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
 
            {/* Column 2: Health Advantages */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#0F0F1A]/40 border border-slate-200 dark:border-white/[0.05] rounded-3xl p-8 text-left shadow-sm hover:border-slate-300 dark:hover:border-white/[0.1] hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-emerald-500 rounded-xl w-fit">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-850 dark:text-white">Health Advantages</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-body">
                  Saving lives has outstanding biological and psychological rewards for the donor as well.
                </p>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-3.5 pt-4 border-t border-slate-200 dark:border-white/[0.05]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Regulates Iron:</strong> Helps maintain healthy iron concentrations, reducing the risk of heart disease.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Cell Renewal:</strong> Stimulates the production of fresh red blood cells in the bone marrow.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Joy of Giving:</strong> Proven psychological benefits from helping those undergoing emergency medical procedures.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
 
            {/* Column 3: Types of Donation */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#0F0F1A]/40 border border-slate-200 dark:border-white/[0.05] rounded-3xl p-8 text-left shadow-sm hover:border-slate-300 dark:hover:border-white/[0.1] hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-amber-500 rounded-xl w-fit">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-850 dark:text-white">Types of Donations</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-body">
                  Your blood is separated into multiple life-saving components depending on patients' medical needs:
                </p>
                <div className="space-y-3.5 pt-4 border-t border-slate-200 dark:border-white/[0.05]">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-slate-850 dark:text-white font-bold block mb-0.5">Whole Blood</span>
                    The most common type. Includes red cells, plasma, and platelets. Used for trauma, surgeries, and anemia.
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-slate-850 dark:text-white font-bold block mb-0.5">Platelets (Apheresis)</span>
                    Crucial for cancer patients undergoing chemotherapy, organ transplants, and massive blood loss.
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-slate-850 dark:text-white font-bold block mb-0.5">Plasma / RBCs</span>
                    Plasma is used for severe burns and shock. Red blood cells (RBCs) target oxygen delivery.
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Hall of Fame section */}
        <HallOfFameSection />
      </div>
    </div>
  );
};

export default LandingPage;
