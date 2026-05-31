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
    <div className="relative overflow-hidden bg-slate-950 min-h-[calc(100vh-80px)] flex flex-col justify-center">
      {/* Dynamic decorative backdrop gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* ── Logo Symbolism Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-b border-white/5 bg-gradient-to-r from-red-950/25 via-slate-950 to-slate-950 px-4 sm:px-8 py-5"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-5 sm:gap-10">
          {/* Logo large */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
            <Logo size="lg" showText={false} />
            <p className="text-[9px] font-black uppercase tracking-[3px] text-red-500/60">OneBlood</p>
          </div>

          {/* Symbolism pillars */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white/3 border border-white/7 rounded-2xl p-3 text-center hover:border-red-500/30 transition-all duration-300 group cursor-default">
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform duration-200">🩸</div>
              <p className="text-[10px] font-bold text-white">Blood Drop</p>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-snug hidden sm:block">Unified ecosystem around life-saving blood</p>
            </div>
            <div className="bg-white/3 border border-white/7 rounded-2xl p-3 text-center hover:border-slate-400/30 transition-all duration-300 group cursor-default">
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform duration-200">1️⃣</div>
              <p className="text-[10px] font-bold text-white">The "1"</p>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-snug hidden sm:block">One platform · one network · one response</p>
            </div>
            <div className="bg-white/3 border border-white/7 rounded-2xl p-3 text-center hover:border-amber-500/30 transition-all duration-300 group cursor-default">
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform duration-200">🕯️</div>
              <p className="text-[10px] font-bold text-white">The Flame</p>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-snug hidden sm:block">Hope · Life · Urgency in emergencies</p>
            </div>
            <div className="bg-white/3 border border-white/7 rounded-2xl p-3 text-center hover:border-emerald-500/30 transition-all duration-300 group cursor-default">
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform duration-200">🤲</div>
              <p className="text-[10px] font-bold text-white">The Hand</p>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-snug hidden sm:block">Human care · donors · protecting hope</p>
            </div>
          </div>

          {/* Brand tagline — desktop only */}
          <div className="hidden xl:flex flex-col items-end text-right flex-shrink-0 border-l border-white/8 pl-8">
            <p className="text-sm font-black text-white leading-tight">One Need.</p>
            <p className="text-sm font-black text-white leading-tight">One Response.</p>
            <p className="text-sm font-black text-red-500 leading-tight">One Life.</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading and Tagline */}
          <div className="lg:col-span-7 space-y-8 text-left">
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
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-display">
                One Platform.<br />
                <span className="text-red-500">Every Blood Need.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Connect directly with active donors and local blood banks in South India. Request emergency units with instant AI letter validation and secure proximity alerts.
              </p>
            </motion.div>

            {/* Call To Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <Link 
                to={user ? "/home" : "/auth/signup?role=patient"}
                state={{ role: 'patient' }}
                className="px-8 py-4 rounded-full bg-oneblood-crimson hover:bg-red-700 text-white font-bold hover:shadow-lg hover:shadow-red-700/30 transition-all duration-200 flex items-center space-x-2.5 group"
              >
                <span>🩸 I Need Blood</span>
              </Link>
              <Link 
                to={user ? "/noticeboard" : "/auth/signup?role=donor"}
                state={{ role: 'donor' }}
                className="px-8 py-4 rounded-full bg-oneblood-crimson hover:bg-red-700 text-white font-bold hover:shadow-lg hover:shadow-red-700/30 transition-all duration-200 flex items-center space-x-2.5 group"
              >
                <span>💉 I Want to Donate</span>
              </Link>
            </motion.div>

            {/* Quick stats row */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-white/10 max-w-xl"
            >
              <div>
                <p className="text-2xl font-bold text-red-500">
                  <AnimatedNumber value={stats.totalDonors} suffix="+" />
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Donors</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  <AnimatedNumber value={stats.totalBanks} />
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Blood Banks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">
                  <AnimatedNumber value={stats.requestsFulfilled} />
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Requests Fulfilled</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">
                  <AnimatedNumber value={stats.livesHelped} suffix="+" />
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Lives Helped</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Logo Symbolism Card */}
          <div className="lg:col-span-5 relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 80 }}
              className="relative w-full bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-900 border border-red-500/20 rounded-3xl p-8 flex flex-col gap-5 shadow-2xl overflow-hidden group hover:border-red-500/40 transition-all duration-300"
            >
              {/* Glow effects */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-red-600/8 blur-[60px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-amber-500/5 blur-[50px] pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[3px] text-red-500/80">Brand Story</p>
                  <h3 className="text-lg font-extrabold text-white mt-0.5">What Our Logo Says</h3>
                </div>
                <Logo size="md" showText={false} />
              </div>

              {/* Symbolism items */}
              <div className="space-y-2.5 relative z-10">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/4 border border-white/6 hover:border-red-500/25 transition-all">
                  <span className="text-xl flex-shrink-0">🩸</span>
                  <div>
                    <p className="text-xs font-bold text-white">The Blood Drop</p>
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5">A unified ecosystem around the life-saving resource — blood donation, availability, and emergency response.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/4 border border-white/6 hover:border-white/20 transition-all">
                  <span className="text-xl flex-shrink-0">1️⃣</span>
                  <div>
                    <p className="text-xs font-bold text-white">The "1" — OneBlood</p>
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5">One platform · one network · one response. The "One" literally sits at the center of everything.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/4 border border-white/6 hover:border-amber-500/25 transition-all">
                  <span className="text-xl flex-shrink-0">🕯️</span>
                  <div>
                    <p className="text-xs font-bold text-white">The Flame — Hope</p>
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5">The "1" becomes a candle: hope for those waiting, urgency in every second, life and remembrance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/4 border border-white/6 hover:border-emerald-500/25 transition-all">
                  <span className="text-xl flex-shrink-0">🤲</span>
                  <div>
                    <p className="text-xs font-bold text-white">The Hand — Human Care</p>
                    <p className="text-[10px] text-slate-400 leading-snug mt-0.5">A donor giving. Human support and protection — the hand holds the candle of hope steady.</p>
                  </div>
                </div>
              </div>

              {/* Bottom tagline */}
              <div className="border-t border-white/8 pt-4 text-center relative z-10">
                <p className="text-[11px] italic text-slate-300 font-medium">
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
          <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-left hover:border-white/10 transition-all">
            <Shield className="w-8 h-8 text-red-500 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Claude AI Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every request requires a prescription letter upload, scanned instantly by Anthropic's Claude API to guarantee authenticity and prevent spam.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-left hover:border-white/10 transition-all">
            <Activity className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Proximity Broadcasts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Proximity filters automatically target matching donors and local blood banks within a 10km to 25km radius for immediate dispatch responses.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 text-left hover:border-white/10 transition-all">
            <Users className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Donor Privacy Lock</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Understanding Blood Donation
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Basic knowledge, safety guidelines, health advantages, and the different ways you can save lives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Donation Safety */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 text-left backdrop-blur-md hover:border-white/10 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-red-500/15 border border-red-500/20 text-red-500 rounded-2xl w-fit">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Donation Safety & Guidelines</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Donating blood is completely safe. Every donation uses a new, sterile, disposable needle that is discarded immediately after use.
                </p>
                <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-white/5">
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
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 text-left backdrop-blur-md hover:border-white/10 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-2xl w-fit">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Health Advantages</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Saving lives has outstanding biological and psychological rewards for the donor as well.
                </p>
                <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-white/5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Regulates Iron:</strong> Helps maintain healthy iron concentrations, reducing the risk of heart disease.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Cell Renewal:</strong> Stimulates the production of fresh red blood cells in the bone marrow.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Joy of Giving:</strong> Proven psychological benefits from helping those undergoing emergency medical procedures.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 3: Types of Donation */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 text-left backdrop-blur-md hover:border-white/10 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-2xl w-fit">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Types of Donations</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your blood is separated into multiple life-saving components depending on patients' medical needs:
                </p>
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="text-[11px] text-slate-400">
                    <span className="text-white font-bold block">Whole Blood</span>
                    The most common type. Includes red cells, plasma, and platelets. Used for trauma, surgeries, and anemia.
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="text-white font-bold block">Platelets (Apheresis)</span>
                    Crucial for cancer patients undergoing chemotherapy, organ transplants, and massive blood loss. Can be done every 7 days.
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="text-white font-bold block">Plasma / RBCs</span>
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
