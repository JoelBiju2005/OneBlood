import React from 'react';
import { HeartPulse, Shield, MapPin, Activity, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AboutPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 90, damping: 14 } }
  };

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-80px)] flex flex-col justify-center py-16 px-4 transition-colors duration-300">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/[0.02] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/[0.01] blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10 w-full">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[#C0152A] mb-2 shadow-sm">
            <HeartPulse className="w-8 h-8 text-[#C0152A] animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight font-display">
            About <span className="text-[#C0152A]">OneBlood</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            OneBlood is a state-of-the-art real-time blood coordination network designed to bridge the gap between emergency seekers, active individual donors, and local blood banks.
          </p>
        </motion.div>

        {/* Pillars / Features */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-3 hover:border-slate-355 dark:hover:border-white/10 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2.5 w-fit bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#C0152A] rounded-xl shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-850 dark:text-white">Advanced AI Scanning</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Every emergency blood request is automatically parsed and verified using Anthropic's Claude API. Requesters simply upload the doctor's letter, and the AI extracts required blood type, hospital, patient details, and verifies validity to eliminate fraudulent posts.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-3 hover:border-slate-355 dark:hover:border-white/10 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2.5 w-fit bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-amber-500 rounded-xl shadow-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-855 dark:text-white">Geospatial Routing & ETA</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                We leverage MongoDB's 2dsphere indexing and OpenSource Routing Machine (OSRM) to pinpoint matching donors or blood banks, calculate precise travel routing, estimate ETAs, and display clean path overlays on a customizable Leaflet map layer.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-3 hover:border-slate-355 dark:hover:border-white/10 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2.5 w-fit bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-450 rounded-xl shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-855 dark:text-white">Gated Contact Privacy</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Donor contact information is protected at all costs. Requesters can see distance and blood group matches, but phone numbers, WhatsApp links, and emails remain encrypted and locked. They are revealed only when the donor accepts the request in real time.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-3 hover:border-slate-355 dark:hover:border-white/10 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-2.5 w-fit bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-blue-450 rounded-xl shadow-sm">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-855 dark:text-white">Real-time Coordination</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Using Socket.IO and Resend email alerts, matching donors receive instant alerts. Requesters can track confirmations and immediately dial unlocked contacts to coordinate transport or blood transfer.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-md"
        >
          <div className="text-left space-y-1">
            <h4 className="text-lg font-bold text-slate-850 dark:text-white font-display">Want to start saving lives?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Join our growing network of donors, patients, and healthcare providers.</p>
          </div>
          <div className="flex gap-4">
            <Link 
              to="/auth/signup" 
              className="px-6 py-3 bg-[#C0152A] hover:bg-red-750 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/search" 
              className="px-6 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-705 dark:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
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
