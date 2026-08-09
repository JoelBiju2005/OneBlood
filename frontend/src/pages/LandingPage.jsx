import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Activity, Users, MapPin, ArrowRight, HeartPulse, FileSearch, Handshake, ChevronDown, Quote, Zap, Scan, Route, Lock, BadgeCheck } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import HallOfFameSection from '../components/shared/HallOfFameSection';
import BloodCompatibilityMatrix from '../components/shared/BloodCompatibilityMatrix';
import useCountUp from '../utils/useCountUp';
import { fadeUp, fadeIn, staggerContainer, scaleIn, fadeUpSlow, staggerGrid, revealFromBelow } from '../utils/animations';

const StatCard = ({ label, value, colorClass, suffix = "" }) => {
  const { count, ref } = useCountUp(value, 2000);
  return (
    <motion.div
      variants={scaleIn}
      ref={ref} 
      className="bg-white/80 dark:bg-ob-ink-90/50 border border-neutral-200 dark:border-ob-glass-border rounded-2xl p-6 text-center hover:border-neutral-300 dark:hover:border-ob-glass-hover hover:scale-[1.02] duration-300 transition-all shadow-sm dark:shadow-none group"
    >
      <p className={`text-4xl lg:text-5xl font-mono font-black ${colorClass} group-hover:scale-105 transition-transform`}>
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 uppercase tracking-wider font-semibold">
        {label}
      </p>
    </motion.div>
  );
};

const FeatureStep = ({ icon: Icon, step, title, description, accent = false, delay = 0 }) => (
  <motion.div
    variants={revealFromBelow}
    className="flex flex-col items-center text-center relative z-10 group"
  >
    <motion.div
      whileHover={{ y: -4, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`w-18 h-18 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
        accent
          ? 'bg-ob-red-700 text-white shadow-glow-red'
          : 'bg-neutral-100 dark:bg-ob-ink-70 border border-neutral-200 dark:border-ob-glass-border text-neutral-900 dark:text-ob-white group-hover:border-ob-red-700/40'
      }`}
      style={{ width: '4.5rem', height: '4.5rem' }}
    >
      <Icon className="w-7 h-7" />
    </motion.div>
    <span className={`text-xs font-mono font-bold uppercase tracking-[3px] mb-3 ${
      accent ? 'text-ob-red-700 dark:text-ob-red-500' : 'text-neutral-400 dark:text-neutral-500'
    }`}>
      Step {step}
    </span>
    <h3 className="text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-ob-white mb-3">{title}</h3>
    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
      {description}
    </p>
  </motion.div>
);

export default function LandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDonors: 1240,
    totalBanks: 37,
    requestsFulfilled: 890,
    livesHelped: 2600,
  });

  const [activeBloodGroupIndex, setActiveBloodGroupIndex] = useState(0);
  const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);

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

    // Cycle blood groups for problem section
    const interval = setInterval(() => {
      setActiveBloodGroupIndex((prev) => (prev + 1) % bloodGroups.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden bg-white dark:bg-ob-ink text-neutral-800 dark:text-ob-white min-h-screen transition-colors duration-300">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-ob-red-700/[0.04] dark:bg-ob-red-700/[0.03] blur-[120px] pointer-events-none animate-orb-float" />
      <div className="absolute bottom-[20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-neutral-200/[0.1] dark:bg-amber-500/[0.02] blur-[150px] pointer-events-none" />
      <div className="absolute top-[50%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-purple-500/[0.02] blur-[120px] pointer-events-none" />
      
      {/* ═══════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 z-10 w-full">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-12"
        >
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6 flex flex-col items-center"
          >
            {/* Headline */}
            <motion.h1 
              variants={fadeUp}
              className="text-5xl sm:text-7xl lg:text-8xl font-display font-black tracking-tight text-neutral-900 dark:text-ob-white leading-[1.05]"
            >
              Every Second Counts.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ob-red-700 to-red-400 text-glow-red">Every Drop Saves.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={fadeUp}
              className="text-base sm:text-lg lg:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed font-light"
            >
              A high-precision emergency network matching verified blood donors to real-time local emergencies. AI-powered validation, cryptographic tracking, and zero bureaucracy — when minutes define lives.
            </motion.p>
          </motion.div>

          {/* Dual CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link 
              to={user ? "/home" : "/auth/signup?role=seeker"}
              state={{ role: 'seeker' }}
              className="px-8 py-4 text-base rounded-full bg-ob-red-700 text-white font-bold hover:shadow-[0_0_30px_rgba(192,21,42,0.5)] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 flex items-center space-x-2 group shadow-glow-red"
            >
              <span>Request Emergency Blood</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to={user ? "/noticeboard" : "/auth/signup?role=donor"}
              state={{ role: 'donor' }}
              className="px-8 py-4 text-base rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-ob-glass-hover dark:hover:bg-neutral-800 border border-neutral-200 dark:border-ob-glass-border text-neutral-800 dark:text-ob-white font-semibold active:scale-[0.97] transition-all duration-200 hover:scale-[1.02]"
            >
              <span>Become a Registered Donor</span>
            </Link>
            <Link 
              to="/donate"
              className="px-8 py-4 text-base rounded-full border border-[#F59E0B] text-[#F59E0B] font-semibold active:scale-[0.97] transition-all duration-200 hover:scale-[1.02] hover:bg-[#F59E0B] hover:text-neutral-900"
            >
              <span>Donate Financially</span>
            </Link>
          </motion.div>

          {/* Stats Ticker */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="w-full max-w-5xl pt-10"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <StatCard label="Registered Donors" value={stats.totalDonors} colorClass="text-ob-red-700 dark:text-ob-red-500" />
              <StatCard label="Affiliated Banks" value={stats.totalBanks} colorClass="text-blue-600 dark:text-blue-400" />
              <StatCard label="Dispatches Fulfilled" value={stats.requestsFulfilled} colorClass="text-amber-500" />
              <StatCard label="Lives Protected" value={stats.livesHelped} colorClass="text-emerald-500" />
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1 }}
            className="absolute bottom-6 flex flex-col items-center gap-1.5"
          >
            <span className="text-[10px] tracking-[0.25em] uppercase font-mono">Discover Platform</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          2. THE PROBLEM SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 border-y border-neutral-200 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-ob-ink-90/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            variants={fadeUpSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="lg:col-span-7 space-y-6"
          >
            <span className="px-3 py-1.5 bg-ob-red-700/10 dark:bg-ob-red-700/20 text-ob-red-700 dark:text-ob-red-500 text-xs font-mono rounded font-semibold uppercase tracking-[3px]">
              The Reality
            </span>
            <h2 className="text-4xl lg:text-5xl font-display text-neutral-900 dark:text-ob-white leading-tight">
              India's Hidden Healthcare Crisis
            </h2>
            <div className="flex gap-4">
              <Quote className="w-10 h-10 text-ob-red-700/40 shrink-0" />
              <blockquote className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 italic font-light leading-relaxed">
                India faces an annual deficit of over 2 million blood units. In critical surgeries, accidents, and postpartum emergencies, finding a compatible donor is a race against a clock measured in minutes — not hours.
              </blockquote>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed max-w-2xl pl-14">
              Traditional coordination depends on phone trees and social media broadcasts — methods that are slow, insecure, and highly localized. OneBlood replaces this chaos with structured, AI-verified emergency dispatching across a verified donor network.
            </p>
          </motion.div>
          
          <motion.div
            variants={revealFromBelow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="lg:col-span-5 flex flex-col items-center justify-center p-8 rounded-3xl bg-neutral-100 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border shadow-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.04),transparent_70%)] pointer-events-none" />
            <h4 className="text-xs uppercase font-mono font-bold tracking-[3px] text-neutral-400 dark:text-neutral-500 mb-6">
              Vital Recipient Compatibility
            </h4>
            <div className="grid grid-cols-4 gap-3 w-full">
              {bloodGroups.map((group, idx) => {
                const isActive = idx === activeBloodGroupIndex;
                return (
                  <motion.div
                    key={group}
                    animate={{ 
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isActive ? 'rgb(185, 28, 28)' : 'rgba(0,0,0,0)',
                      borderColor: isActive ? 'rgb(185, 28, 28)' : 'rgba(128,128,128,0.2)'
                    }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                    className={`h-16 rounded-xl flex items-center justify-center border font-mono text-lg font-black transition-all ${
                      isActive 
                        ? 'text-white shadow-glow-red z-10' 
                        : 'text-neutral-400 dark:text-neutral-600 border-neutral-300 dark:border-neutral-800'
                    }`}
                  >
                    {group}
                  </motion.div>
                );
              })}
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-6 font-mono">
              * Red cells require exact biological matching
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. HOW IT WORKS SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <motion.div
          variants={fadeUpSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center space-y-4 mb-20"
        >
          <span className="px-3 py-1.5 bg-ob-red-700/10 dark:bg-ob-red-700/20 text-ob-red-700 dark:text-ob-red-500 text-xs font-mono rounded font-semibold uppercase tracking-[3px]">
            Precision Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-neutral-900 dark:text-ob-white">
            Three Steps. Infinite Lifelines.
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
            Engineered to remove friction, verify identity instantly, and match donors in under 30 seconds.
          </p>
        </motion.div>

        <motion.div 
          variants={staggerGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {/* Timeline Connector Line */}
          <div className="hidden md:block absolute top-[28%] left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-neutral-200 dark:border-neutral-800/80 pointer-events-none z-0" />

          <FeatureStep
            icon={Scan}
            step="01"
            title="Upload & Verify"
            description="Upload the doctor's prescription. Claude AI instantly validates authenticity via OCR, extracting blood type, hospital, and urgency — stopping spam and protecting precious donor slots."
            accent
          />
          <FeatureStep
            icon={MapPin}
            step="02"
            title="Match & Broadcast"
            description="The geospatial engine searches compatible blood groups within a 25km radius. A push broadcast triggers immediately to verified donors, keeping all contact details encrypted."
          />
          <FeatureStep
            icon={Handshake}
            step="03"
            title="Confirm & Dispatch"
            description="Donor accepts the request, a unique Match ID (MOB-XXXXXXX) is generated, and live tracking begins. The hospital confirms receipt to close the loop — all in real-time."
          />
        </motion.div>

        {/* Learn more link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ob-red-700 dark:text-ob-red-500 hover:gap-3 transition-all duration-300"
          >
            See the full 6-step protocol
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          4. BLOOD COMPATIBILITY MATRIX SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 border-t border-neutral-200 dark:border-neutral-800/60 bg-neutral-50/30 dark:bg-ob-ink-90/10">
        <div className="max-w-6xl mx-auto space-y-12">
          <motion.div
            variants={fadeUpSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center space-y-4"
          >
            <span className="px-3 py-1.5 bg-ob-red-700/10 dark:bg-ob-red-700/20 text-ob-red-700 dark:text-ob-red-500 text-xs font-mono rounded font-semibold uppercase tracking-wider">
              Clinical Standard
            </span>
            <h2 className="text-3xl sm:text-4xl font-display text-neutral-900 dark:text-ob-white">
              Interactive Compatibility Tool
            </h2>
            <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
              Understand which blood types can be safely donated and received — powered by clinical matching logic.
            </p>
          </motion.div>
          
          <BloodCompatibilityMatrix />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. TRUST & NETWORK INTEGRITY SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <motion.div
          variants={fadeUpSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="lg:col-span-5 space-y-6 lg:sticky lg:top-24"
        >
          <span className="px-3 py-1.5 bg-ob-red-700/10 dark:bg-ob-red-700/20 text-ob-red-700 dark:text-ob-red-500 text-xs font-mono rounded font-semibold uppercase tracking-[3px]">
            Network Integrity
          </span>
          <h2 className="text-3xl sm:text-4xl font-display text-neutral-900 dark:text-ob-white">
            Trust Earned Through Action
          </h2>
          <div className="space-y-4 text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
            <p>
              OneBlood operates on complete transparency. Our security models ensure that patient documents and donor health matrices are kept AES-256 encrypted and separate from global search indexing.
            </p>
            <p>
              By partnering with verified local blood banks and government emergency lines, we bridge critical system gaps in real-time — creating a unified supply chain for life-saving resources.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="p-5 rounded-2xl bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border"
            >
              <p className="text-3xl font-bold text-neutral-900 dark:text-ob-white font-mono">100%</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 font-semibold uppercase tracking-wider">AI-Verified Inquiries</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="p-5 rounded-2xl bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border"
            >
              <p className="text-3xl font-bold text-neutral-900 dark:text-ob-white font-mono">&lt; 5 Min</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 font-semibold uppercase tracking-wider">Match Dispatch Time</p>
            </motion.div>
          </div>
        </motion.div>

        <div className="lg:col-span-7 space-y-8">
          <HallOfFameSection />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6. CTA BANNER
      ═══════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-neutral-200 dark:border-neutral-800/60 bg-gradient-to-br from-ob-red-950 via-ob-red-900 to-ob-red-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.4),transparent_90%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ob-red-700/20 rounded-full blur-[150px] pointer-events-none" />
        
        <motion.div
          variants={revealFromBelow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-4xl mx-auto text-center space-y-8 relative z-10"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black leading-tight text-white">
            Your blood could save a life today.
          </h2>
          <p className="text-sm sm:text-base text-red-200 max-w-2xl mx-auto leading-relaxed">
            Every day, thousands of patients await critical matches. Registering takes less than two minutes. Let's make sure no request goes unanswered.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link 
              to={user ? "/home" : "/auth/signup?role=donor"}
              state={{ role: 'donor' }}
              className="px-8 py-4 text-base rounded-full bg-white text-ob-red-900 font-bold hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 shadow-lg"
            >
              Register to Donate
            </Link>
            <Link 
              to={user ? "/home" : "/auth/signup?role=seeker"}
              state={{ role: 'seeker' }}
              className="px-8 py-4 text-base rounded-full bg-transparent hover:bg-white/10 border border-white/20 text-white font-semibold active:scale-[0.97] transition-all duration-200 hover:border-white/40"
            >
              Request Assistance
            </Link>
          </div>
        </motion.div>
      </section>
      
    </div>
  );
}
