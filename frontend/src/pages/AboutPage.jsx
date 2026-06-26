import React from 'react';
import { HeartPulse, Shield, MapPin, Activity, HelpCircle, ArrowRight, Scan, Lock, Zap, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeUp, fadeUpSlow, staggerGrid, revealFromBelow, scaleIn } from '../utils/animations';

const PillarCard = ({ icon: Icon, title, description, iconColor, delay = 0 }) => (
  <motion.div
    variants={revealFromBelow}
    className="glass-panel-premium rounded-3xl p-7 md:p-8 space-y-4 hover:-translate-y-2 hover:shadow-raised transition-all duration-300 flex flex-col justify-between group"
  >
    <div className="space-y-4">
      <motion.div
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`p-3 w-fit bg-ob-ink-70 border border-ob-glass-border ${iconColor} rounded-xl group-hover:border-ob-red-700/30 transition-colors`}
      >
        <Icon className="w-6 h-6" />
      </motion.div>
      <h3 className="text-lg font-bold text-neutral-900 dark:text-ob-white">{title}</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        {description}
      </p>
    </div>
    <div className="flex items-center gap-2 text-xs text-ob-red-500 font-semibold pt-2 group-hover:gap-3 transition-all">
      <span>Learn more</span>
      <ArrowRight className="w-3.5 h-3.5" />
    </div>
  </motion.div>
);

const AboutPage = () => {
  const pillars = [
    {
      icon: Scan,
      title: "Advanced AI Document Scanning",
      description: "Every emergency blood request is automatically parsed and verified using Anthropic's Claude AI. Requesters upload the doctor's prescription, and the AI extracts required blood type, hospital, patient details, and verifies validity — eliminating fraudulent posts with 99.8% accuracy.",
      iconColor: "text-ob-red-500"
    },
    {
      icon: MapPin,
      title: "Geospatial Routing & Live ETA",
      description: "We leverage MongoDB's 2dsphere indexing and Open Source Routing Machine (OSRM) to pinpoint matching donors or blood banks within a 25km radius, calculate precise travel routing, estimate ETAs, and display clean path overlays on a customizable Leaflet map layer.",
      iconColor: "text-amber-400"
    },
    {
      icon: Lock,
      title: "Cryptographic Contact Privacy",
      description: "Donor contact information is protected with AES-256 encryption. Requesters see distance and blood group matches, but phone numbers, WhatsApp links, and emails remain locked. They are revealed only when the donor explicitly accepts a request — creating a mutual consent gateway.",
      iconColor: "text-emerald-400"
    },
    {
      icon: Zap,
      title: "Real-time Event Coordination",
      description: "Using Socket.IO for live bidirectional communication and Resend for email alerts, matching donors receive instant push notifications. Requesters track confirmations in real-time and can immediately coordinate transport once contacts are unlocked — all within seconds.",
      iconColor: "text-blue-400"
    }
  ];

  const techStack = [
    { label: "AI Engine", value: "Anthropic Claude" },
    { label: "Geo Engine", value: "MongoDB 2dsphere + OSRM" },
    { label: "Real-time", value: "Socket.IO" },
    { label: "Security", value: "AES-256 Encryption" },
    { label: "Maps", value: "Leaflet + CartoDB" },
    { label: "Notifications", value: "Resend Email API" },
  ];

  return (
    <div className="relative overflow-hidden bg-white dark:bg-ob-ink min-h-[calc(100vh-80px)] flex flex-col justify-center py-20 px-4 transition-colors duration-300">
      {/* Background orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-ob-red-700/[0.03] blur-[130px] pointer-events-none animate-orb-float" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-500/[0.02] blur-[130px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-16 relative z-10 w-full">
        
        {/* ─── Header ─── */}
        <motion.div 
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex p-3 bg-ob-ink-70 border border-ob-glass-border rounded-2xl text-ob-red-500 mb-2"
          >
            <HeartPulse className="w-9 h-9 text-ob-red-500" />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight text-neutral-900 dark:text-ob-white leading-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-ob-red-700 to-red-400 text-glow-red">OneBlood</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            OneBlood is a state-of-the-art real-time blood coordination network designed to bridge the gap between emergency seekers, verified individual donors, local blood banks, and hospital systems — creating a unified, AI-verified supply chain for life-saving resources.
          </p>
        </motion.div>

        {/* ─── Mission Statement ─── */}
        <motion.div
          variants={fadeUpSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="glass-panel-premium rounded-3xl p-8 md:p-10 text-center space-y-4"
        >
          <span className="text-xs font-mono font-bold uppercase tracking-[3px] text-ob-red-500">Our Mission</span>
          <p className="text-lg md:text-xl text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-3xl mx-auto font-light italic">
            "To ensure that no blood emergency goes unanswered. By combining AI verification, geospatial matching, and cryptographic privacy into a single platform, we're building the infrastructure for a world where finding a compatible donor takes seconds, not hours."
          </p>
        </motion.div>

        {/* ─── Platform Pillars ─── */}
        <div>
          <motion.div
            variants={fadeUpSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="px-3 py-1.5 bg-ob-red-700/10 dark:bg-ob-red-700/20 text-ob-red-700 dark:text-ob-red-500 text-xs font-mono rounded font-semibold uppercase tracking-[3px]">
              Platform Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-display text-neutral-900 dark:text-ob-white mt-4">
              Four Engineering Pillars
            </h2>
          </motion.div>

          <motion.div 
            variants={staggerGrid}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {pillars.map((pillar, idx) => (
              <PillarCard key={idx} {...pillar} delay={idx * 0.1} />
            ))}
          </motion.div>
        </div>

        {/* ─── Tech Stack Grid ─── */}
        <motion.div
          variants={fadeUpSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className="text-center mb-8">
            <h3 className="text-lg font-display text-neutral-900 dark:text-ob-white">Technology Stack</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {techStack.map((tech, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06 }}
                className="glass-panel-premium rounded-xl p-4 text-center hover:scale-[1.03] transition-all duration-200"
              >
                <p className="text-xs text-neutral-500 dark:text-neutral-500 uppercase tracking-wider font-mono mb-1">{tech.label}</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-ob-white">{tech.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── CTA Section ─── */}
        <motion.div 
          variants={revealFromBelow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="glass-panel-premium rounded-3xl p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden"
        >
          {/* CTA glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-ob-red-700/[0.08] rounded-full blur-[80px] pointer-events-none" />
          
          <div className="text-left space-y-2 relative z-10">
            <h4 className="text-xl font-bold text-neutral-900 dark:text-ob-white font-display">Ready to start saving lives?</h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Join our growing network of donors, patients, and healthcare providers. Registration takes less than 2 minutes.</p>
          </div>
          <div className="flex gap-4 relative z-10 shrink-0">
            <Link 
              to="/auth/signup" 
              className="px-7 py-3.5 bg-ob-red-700 hover:bg-red-800 rounded-full text-sm font-bold text-white flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow-red hover:shadow-[0_0_30px_rgba(192,21,42,0.5)]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/search" 
              className="px-7 py-3.5 bg-neutral-100 dark:bg-ob-glass-hover border border-neutral-200 dark:border-ob-glass-border hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full text-sm font-semibold text-neutral-700 dark:text-ob-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Search Map
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
