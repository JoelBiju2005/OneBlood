import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  HeartPulse, Shield, FileText, Fingerprint, Activity,
  BadgeCheck, Hospital, ArrowRight, Radar, Route, Trophy,
  MapPin, UserCheck, ChevronDown, ChevronUp, HelpCircle,
  Scan, Handshake, Clock, Lock, Zap
} from 'lucide-react';
import BloodCompatibilityMatrix from '../components/shared/BloodCompatibilityMatrix';
import {
  massiveRevealLeft, massiveRevealRight, revealFromBelow,
  fadeUp, fadeUpSlow, staggerGrid, scaleIn, staggerContainerSlow
} from '../utils/animations';

/* ─── Massive Timeline Step ─── */
const TimelineStep = ({ step, index, totalSteps }) => {
  const isLeft = index % 2 === 0;
  const stepRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: stepRef,
    offset: ["start 0.85", "start 0.3"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [60, 0]);
  const x = useTransform(scrollYProgress, [0, 0.5], [isLeft ? -60 : 60, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.92, 1]);

  const iconMap = [Fingerprint, Scan, Radar, Handshake, Route, Trophy];
  const StepIcon = iconMap[index] || HeartPulse;

  const colorAccents = [
    'border-ob-red-700',
    'border-amber-500',
    'border-emerald-500',
    'border-blue-500',
    'border-purple-500',
    'border-ob-red-500',
  ];

  return (
    <div
      ref={stepRef}
      className={`relative flex flex-col md:flex-row items-center justify-between w-full ${
        index < totalSteps - 1 ? 'mb-32 md:mb-40' : ''
      } ${isLeft ? '' : 'md:flex-row-reverse'}`}
    >
      {/* Content card side */}
      <motion.div
        style={{ opacity, y, x, scale }}
        className={`w-full md:w-[46%] ${isLeft ? 'md:pr-10 md:text-right' : 'md:pl-10 md:text-left'}`}
      >
        <div className={`glass-panel-premium rounded-3xl p-8 md:p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-raised group border-t-4 ${colorAccents[index]}`}>
          {/* Step label + Icon row */}
          <div className={`flex items-center gap-3 mb-5 ${isLeft ? 'md:justify-end' : 'md:justify-start'}`}>
            <div className="w-11 h-11 rounded-xl bg-ob-ink-70 border border-ob-glass-border flex items-center justify-center group-hover:border-ob-red-700/40 transition-colors">
              <StepIcon className="w-5 h-5 text-ob-red-500" />
            </div>
            <span className="text-[11px] uppercase font-mono font-bold tracking-[3px] text-ob-red-500">
              {step.subtitle}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl md:text-[28px] font-display leading-snug text-ob-white mb-4">
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-[15px] md:text-base text-neutral-400 leading-relaxed">
            {step.description}
          </p>

          {/* Tag/chip */}
          {step.tag && (
            <div className={`inline-flex items-center gap-1.5 mt-6 px-3 py-1.5 rounded-pill bg-ob-ink-70 border border-ob-glass-border text-xs font-mono text-neutral-300`}>
              <Zap className="w-3 h-3 text-ob-red-500" />
              {step.tag}
            </div>
          )}
        </div>
      </motion.div>

      {/* Center node */}
      <div className="absolute left-6 md:left-1/2 transform -translate-x-1/2 z-30">
        <motion.div
          style={{ scale }}
          className="w-16 h-16 rounded-full bg-ob-ink border-[3px] border-ob-red-700 flex items-center justify-center font-mono text-lg font-black text-ob-red-500 animate-timeline-pulse shadow-glow-red"
        >
          {index + 1}
        </motion.div>
      </div>

      {/* Ghost illustration side */}
      <div className={`hidden md:flex w-[46%] items-center justify-center ${isLeft ? 'pl-10' : 'pr-10'}`}>
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.6], [0, 0.15]) }}
          className="w-full h-52 rounded-3xl border border-dashed border-ob-glass-border flex items-center justify-center"
        >
          <StepIcon className="w-16 h-16 text-neutral-600" strokeWidth={1} />
        </motion.div>
      </div>
    </div>
  );
};

/* ─── Architecture Node Card ─── */
const NodeCard = ({ node, index }) => {
  const borderColors = [
    'border-t-ob-red-700',
    'border-t-emerald-500',
    'border-t-purple-500',
    'border-t-blue-500'
  ];
  const iconColors = ['text-ob-red-500', 'text-emerald-400', 'text-purple-400', 'text-blue-400'];
  const icons = [UserCheck, HeartPulse, Shield, Hospital];
  const NodeIcon = icons[index];

  return (
    <motion.div
      variants={revealFromBelow}
      className={`glass-panel-premium rounded-3xl p-7 md:p-8 border-t-4 ${borderColors[index]} hover:shadow-raised hover:-translate-y-1 transition-all duration-300 flex flex-col`}
    >
      <div className={`w-12 h-12 rounded-full bg-ob-ink-70 border border-ob-glass-border flex items-center justify-center mb-5 ${iconColors[index]}`}>
        <NodeIcon className="w-5 h-5" />
      </div>
      <h4 className="text-lg font-bold text-ob-white mb-2">{node.name}</h4>
      <p className="text-sm text-neutral-400 leading-relaxed mb-4 flex-grow">{node.desc}</p>
      <div className="space-y-2">
        {node.features.map((feat, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-neutral-500">
            <BadgeCheck className="w-3.5 h-3.5 text-ob-red-500 shrink-0" />
            {feat}
          </div>
        ))}
      </div>
    </motion.div>
  );
};


export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const timelineSteps = [
    {
      title: "Cryptographic Registration",
      subtitle: "Identity & Onboarding",
      description: "Every participant — seeker, donor, hospital, or blood bank — is assigned a unique cryptographic OneBlood ID (OB-XXXXXXX) upon registration. All subsequent actions, matches, and communications are authenticated and permanently mapped to this persistent identity, creating a verifiable audit trail for every unit of blood.",
      tag: "OB-XXXXXXX"
    },
    {
      title: "AI-Powered Request Analysis",
      subtitle: "Claude OCR Validation",
      description: "When blood is needed, the doctor's prescription or hospital requisition letter is uploaded directly to the platform. Anthropic's Claude AI performs deep OCR analysis — extracting the hospital name, patient blood group, required units, and urgency level. The system automatically validates authenticity and filters out spam or fraudulent requests before any broadcast occurs.",
      tag: "99.8% Accuracy"
    },
    {
      title: "Geospatial Matching Engine",
      subtitle: "25km Proximity Broadcast",
      description: "OneBlood's geospatial engine scans all active, eligible donors within a configurable 25-kilometer radius of the requesting hospital. Compatible donors receive instant push notifications with request details. Crucially, personal donor coordinates, phone numbers, and contact details remain fully encrypted and hidden until mutual confirmation.",
      tag: "< 30 Second Match"
    },
    {
      title: "Mutual Confirmation & Match ID",
      subtitle: "Official Slip Generation",
      description: "When a seeker approves a donor's response, a unique Match ID (MOB-XXXXXXX) is cryptographically generated. The system automatically creates a downloadable PDF match slip — a formal document detailing the transit blood bank, donor identity, and destination hospital node. This document serves as the official coordination record.",
      tag: "MOB-XXXXXXX"
    },
    {
      title: "Synchronized Dispatch Tracking",
      subtitle: "Live Multi-Dashboard Sync",
      description: "The donation journey progresses through real-time synchronized milestones: Match Confirmed → Collected at Blood Bank → En-route to Hospital → Donation Received. All four participant dashboards — seeker, donor, blood bank, and hospital — update dynamically as each milestone is confirmed, providing complete transparency and accountability.",
      tag: "4-Stage Pipeline"
    },
    {
      title: "Delivery & Score Finalization",
      subtitle: "Badges & Medical Cooldown",
      description: "The hospital marks the donation as received, formally closing the transaction record. The donor earns performance achievement badges based on donation frequency and reliability. The system then automatically initiates and tracks the 56-day medical cooldown period, ensuring donor health compliance before eligibility for future donations.",
      tag: "56-Day Cooldown"
    }
  ];

  const architectureNodes = [
    {
      name: "Seeker Node",
      desc: "Individuals or families initiating emergency blood requests, tracking donor matches, and coordinating hospital deliveries.",
      features: ["AI-Verified Requests", "Real-time Donor Tracking", "PDF Match Slips"]
    },
    {
      name: "Donor Node",
      desc: "Registered donors responding to proximity-based alerts, coordinating availability, and building donation histories.",
      features: ["Smart Push Alerts", "Cooldown Tracking", "Achievement Badges"]
    },
    {
      name: "Blood Bank Node",
      desc: "Licensed facilities managing local inventory, validating transit stages, and confirming blood unit quality.",
      features: ["Inventory Sync", "Dispatch Routing", "Quality Validation"]
    },
    {
      name: "Hospital Node",
      desc: "Medical staff issuing critical requisitions and confirming receipt of matched blood to close the transaction loop.",
      features: ["AI OCR Uploads", "ETA Dashboards", "Receipt Confirmation"]
    }
  ];

  const faqData = [
    {
      q: 'What is a OneBlood ID and how is it generated?',
      a: 'Every user — whether a seeker, donor, blood bank, or hospital — receives a unique cryptographic OneBlood ID (OB-XXXXXXX) upon registration. This ID is permanently tied to your account, displayed on all match documents, and ensures all parties can verify identities instantly. The ID is generated using a secure hashing algorithm tied to your verified phone number and registration timestamp.'
    },
    {
      q: 'How does the Match ID (MOB-XXXXXXX) work?',
      a: 'When a seeker approves a donor response and selects a destination, the system automatically generates a unique Match ID in the format MOB-XXXXXXX. This ID tracks the entire donation journey — from initial approval, through the blood bank transit stage (if applicable), all the way to hospital receipt confirmation. It appears on all related documents including the downloadable PDF match slip.'
    },
    {
      q: 'What are the progress stages and how are they tracked?',
      a: 'Once a match is created, a live progress bar becomes visible across all 4 participant dashboards. For donations routed through a blood bank, there are 4 stages: Match Confirmed → Collected at Bank → En-route to Hospital → Donation Received. For direct hospital donations, there are 3 stages. Each stage requires explicit confirmation from the relevant party — the hospital confirms final receipt to complete the record.'
    },
    {
      q: 'How is donor privacy and contact information protected?',
      a: 'Donor phone numbers, email addresses, and WhatsApp contacts are AES-256 encrypted in our database and never publicly visible to any user. During the matching phase, seekers can only see distance and blood group compatibility. Contact information is decrypted and revealed only after the donor explicitly accepts a specific request, creating a mutual consent gateway.'
    },
    {
      q: 'How accurate is the AI document scanning?',
      a: 'Our integration with Anthropic\'s Claude AI achieves over 99.8% accuracy on standard medical requisition forms and doctor\'s prescriptions. The AI extracts blood type, units required, hospital name, and patient details. In rare cases of ambiguity — such as poor handwriting on physical forms — the request is automatically flagged for manual review before broadcasting to donors.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-ob-ink py-20 px-4 sm:px-6 lg:px-8 space-y-0 transition-colors duration-300 relative overflow-hidden">

      {/* ─── Background Orbs ─── */}
      <div className="absolute top-10 right-0 w-[50vw] h-[50vw] rounded-full bg-ob-red-700/[0.03] blur-[150px] pointer-events-none animate-orb-float" />
      <div className="absolute top-[40%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-purple-500/[0.02] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-20 right-[-5%] w-[30vw] h-[30vw] rounded-full bg-amber-500/[0.02] blur-[120px] pointer-events-none" />

      {/* ═══════════════════════════════════════════
          1. HERO HEADER
      ═══════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto text-center space-y-7 mb-32"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-block px-4 py-2 bg-ob-red-700/10 dark:bg-ob-red-700/20 border border-ob-red-700/20 text-ob-red-700 dark:text-ob-red-500 font-bold uppercase tracking-[3px] rounded-full text-xs"
        >
          Engineered for Emergencies
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-display font-black text-neutral-900 dark:text-ob-white leading-[1.05] tracking-tight"
        >
          How OneBlood{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-ob-red-700 to-red-400 text-glow-red">
            Works
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-base sm:text-lg lg:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed font-light"
        >
          A highly secure, AI-driven coordination platform that matches critical blood requests
          with qualified donors in real-time. Every step — from request to receipt — is tracked,
          documented, and confirmed across all four parties.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-2 pt-8"
        >
          <span className="text-[10px] tracking-[0.25em] uppercase font-mono text-neutral-500">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-neutral-500" />
          </motion.div>
        </motion.div>
      </motion.div>


      {/* ═══════════════════════════════════════════
          2. MASSIVE TIMELINE
      ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto mb-32 px-4 relative">
        {/* Section header */}
        <motion.div
          variants={fadeUpSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-24"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-neutral-900 dark:text-ob-white mb-4">
            The Lifesaving Protocol
          </h2>
          <div className="h-1 w-24 bg-ob-red-700 mx-auto rounded-full box-glow-red" />
        </motion.div>

        {/* Timeline container */}
        <div ref={containerRef} className="relative">
          {/* Central animated line (desktop) */}
          <div className="absolute left-6 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-[2px] bg-neutral-100 dark:bg-neutral-800/60 rounded-full z-0">
            <motion.div
              style={{ scaleY, originY: 0 }}
              className="w-full h-full timeline-line-glow rounded-full origin-top"
            />
          </div>

          {/* Timeline steps */}
          <div className="relative z-10 pl-14 md:pl-0">
            {timelineSteps.map((step, idx) => (
              <TimelineStep
                key={idx}
                step={step}
                index={idx}
                totalSteps={timelineSteps.length}
              />
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          3. ARCHITECTURE SECTION
      ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto py-20 px-4 border-t border-neutral-200 dark:border-neutral-800/60 mb-20">
        <motion.div
          variants={fadeUpSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center space-y-4 mb-16"
        >
          <span className="px-3 py-1.5 bg-ob-red-700/10 dark:bg-ob-red-700/20 text-ob-red-700 dark:text-ob-red-500 text-xs font-mono rounded font-semibold uppercase tracking-wider">
            Ecosystem Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-display text-neutral-900 dark:text-ob-white">
            Four Nodes, One Unified Interface
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            A distributed coordination topology serving four distinct operational pillars,
            ensuring seamless communication across the entire healthcare supply chain.
          </p>
        </motion.div>

        <motion.div
          variants={staggerGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {architectureNodes.map((node, idx) => (
            <NodeCard key={idx} node={node} index={idx} />
          ))}
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════
          4. BLOOD COMPATIBILITY SECTION
      ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto border-t border-neutral-200 dark:border-neutral-800/60 pt-20 pb-20">
        <motion.div
          variants={fadeUpSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center space-y-4 mb-12"
        >
          <span className="px-3 py-1.5 bg-ob-red-700/10 dark:bg-ob-red-700/20 text-ob-red-700 dark:text-ob-red-500 text-xs font-mono rounded font-semibold uppercase tracking-wider">
            Clinical Standard
          </span>
          <h2 className="text-3xl sm:text-4xl font-display text-neutral-900 dark:text-ob-white">
            Interactive Compatibility Matrix
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
            Understand which blood types can be safely donated and received — powered by clinical matching logic.
          </p>
        </motion.div>
        <BloodCompatibilityMatrix />
      </section>


      {/* ═══════════════════════════════════════════
          5. FAQ SECTION
      ═══════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto space-y-8 mb-24">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-display text-neutral-900 dark:text-ob-white flex items-center justify-center gap-3">
            <HelpCircle className="w-7 h-7 text-ob-red-700" />
            <span>System Inquiries</span>
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            Technical details on how OneBlood secures the supply chain.
          </p>
        </motion.div>

        <div className="glass-panel-premium rounded-3xl divide-y divide-neutral-200 dark:divide-white/[0.06] overflow-hidden">
          {faqData.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <motion.div
                key={index}
                initial={false}
                className="transition-colors hover:bg-white/[0.02]"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex justify-between items-center p-6 md:p-7 text-left focus:outline-none gap-4 group"
                >
                  <span className="text-sm md:text-base font-semibold text-neutral-900 dark:text-ob-white group-hover:text-ob-red-500 transition-colors">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-neutral-500 shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 md:px-7 pb-6 md:pb-7 text-sm md:text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          6. CTA FOOTER
      ═══════════════════════════════════════════ */}
      <motion.div
        variants={revealFromBelow}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="max-w-4xl mx-auto text-center space-y-6 pb-8 relative"
      >
        {/* CTA glow background */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[300px] bg-ob-red-700/[0.06] rounded-full blur-[100px]" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-display text-neutral-900 dark:text-ob-white">
          Ready to Join the Network?
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base max-w-xl mx-auto">
          Register as a donor or healthcare facility today. Every connection made on OneBlood
          has the potential to save a life.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            to="/auth/signup"
            className="px-8 py-4 bg-ob-red-700 hover:bg-red-800 text-white font-bold rounded-full text-sm sm:text-base hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 flex items-center gap-2 shadow-glow-red hover:shadow-[0_0_30px_rgba(192,21,42,0.5)]"
          >
            <span>Register Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/search"
            className="px-8 py-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-ob-glass-hover dark:hover:bg-neutral-800 border border-neutral-200 dark:border-ob-glass-border text-neutral-800 dark:text-ob-white font-semibold rounded-full text-sm sm:text-base hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
          >
            Search Live Map
          </Link>
        </div>
      </motion.div>

    </div>
  );
}
