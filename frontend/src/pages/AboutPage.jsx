import React from 'react';
import { HeartPulse, Shield, MapPin, Activity, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="relative overflow-hidden bg-slate-950 min-h-[calc(100vh-80px)] flex flex-col justify-center py-16 px-4">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/5 blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10 w-full">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-500 mb-2">
            <HeartPulse className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight font-display">
            About <span className="text-red-500">OneBlood</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            OneBlood is a state-of-the-art real-time blood coordination network designed to bridge the gap between emergency seekers, active individual donors, and local blood banks.
          </p>
        </div>

        {/* Pillars / Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="p-3 w-fit bg-red-500/10 text-red-400 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Advanced AI Scanning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every emergency blood request is automatically parsed and verified using Anthropic's Claude API. Requesters simply upload the doctor's letter, and the AI extracts required blood type, hospital, patient details, and verifies validity to eliminate fraudulent posts.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="p-3 w-fit bg-amber-500/10 text-amber-400 rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Geospatial Routing & ETA</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We leverage MongoDB's 2dsphere indexing and OpenSource Routing Machine (OSRM) to pinpoint matching donors or blood banks, calculate precise travel routing, estimate ETAs, and display clean path overlays on a customizable Leaflet map layer.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="p-3 w-fit bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Gated Contact Privacy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Donor contact information is protected at all costs. Requesters can see distance and blood group matches, but phone numbers, WhatsApp links, and emails remain encrypted and locked. They are revealed only when the donor accepts the request in real time.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="p-3 w-fit bg-blue-500/10 text-blue-400 rounded-xl">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Real-time Coordination</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Using Socket.IO and Resend email alerts, matching donors receive instant alerts. Requesters can track confirmations and immediately dial unlocked contacts to coordinate transport or blood transfer.
            </p>
          </div>
        </div>

        {/* CTA section */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-left space-y-1">
            <h4 className="text-lg font-bold text-white">Want to start saving lives?</h4>
            <p className="text-xs text-slate-400">Join our growing network of donors, patients, and healthcare providers.</p>
          </div>
          <div className="flex gap-4">
            <Link 
              to="/auth/signup" 
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5 transition-all shadow-lg shadow-red-700/10"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/search" 
              className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-white transition-all"
            >
              Search Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
