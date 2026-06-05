import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse, ShieldAlert, Heart, Landmark, ShieldCheck,
  ChevronDown, ChevronUp, FileText, Fingerprint, Activity,
  CheckCircle2, Hospital, Building2, ArrowRight,
  MapPin, Bell, UserCheck, FlaskConical, BadgeCheck, BarChart3,
  Megaphone, Target, Printer, Droplet, Users, Phone, Share2,
  Check, LayoutDashboard
} from 'lucide-react';

const Step = ({ number, title, description, color = 'red', badge, children }) => {
  const colors = {
    red: 'border-red-600/40 text-red-600 dark:text-red-500 bg-red-500/5',
    emerald: 'border-emerald-600/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5',
    blue: 'border-blue-600/40 text-blue-600 dark:text-blue-400 bg-blue-500/5',
    purple: 'border-purple-600/40 text-purple-600 dark:text-purple-400 bg-purple-500/5',
  };

  return (
    <div className="relative space-y-2">
      <span className={`absolute -left-12 top-0.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${colors[color]}`}>
        {number}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        {badge && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400 font-mono font-bold tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      {children && (
        <div className="mt-2 p-3 bg-slate-100/50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const HowItWorksPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqData = [
    {
      q: 'What is a OneBlood ID?',
      a: 'Every user — whether a seeker, donor, blood bank, or hospital — receives a unique OneBlood ID (OB-XXXXXXX) upon registration. This ID is permanently tied to your account and is displayed on all match documents, so all parties can verify identities at a glance. You can copy your ID from your dashboard at any time.'
    },
    {
      q: 'What is a Match ID (MOB-XXXXXXX)?',
      a: 'When a seeker approves a donor response and selects a destination, the system automatically generates a unique Match ID in the format MOB-XXXXXXX. This ID tracks the entire donation journey — from approval, to blood bank stage (if applicable), to hospital receipt. It appears on the PDF match slip, in-app notifications, and on all four dashboards (seeker, donor, blood bank, hospital).'
    },
    {
      q: 'How does the progress bar work?',
      a: 'Once a match is created, a live progress bar is visible on all 4 dashboards. For donations routed through a blood bank first, there are 4 stages: Match Confirmed → Collected at Bank → En-route to Hospital → Donation Received. For direct hospital donations, there are 3 stages. The blood bank marks their stage complete; only after that can the hospital mark the donation received — which fully completes the record and moves it to Past Donations history.'
    },
    {
      q: 'Is the doctor\'s letter verified by AI?',
      a: 'When using the Smart Search / OCR flow, the letter goes through an automated analysis that extracts hospital name, doctor name, blood group, units needed, and urgency level. However, the direct "Send Request" modal lets you manually fill in all details and simply upload the letter as an attachment without AI verification — the document is stored securely and visible to the donor and matched facility.'
    },
    {
      q: 'Can I choose a specific donor?',
      a: 'Yes. On the Search Map, you can click on any donor pin and send them a direct, exclusive request. The request goes only to that donor and appears in their "Requests Sent to You" section. Alternatively, you can broadcast to all nearby eligible donors with a single click.'
    },
    {
      q: 'What blood components are supported?',
      a: 'OneBlood coordinates: Whole Blood, Packed RBC (PRBC), Fresh Frozen Plasma, Platelets, Cryoprecipitate, and Single Donor Platelets (SDP). Blood banks can maintain real-time inventory for all 8 blood groups × 6 components.'
    },
    {
      q: 'Is my phone number safe?',
      a: 'Yes. Phone numbers and emails are encrypted in our database and never publicly visible. Donor contact is shared only with the specific seeker after the seeker formally approves that donor. Blood bank and hospital contacts are visible on their public profile pages only to authenticated users.'
    },
    {
      q: 'How is the donation marked as complete?',
      a: 'A donation is only marked complete when the destination hospital marks it as "Donation Received". If there is a blood bank transit stop, the blood bank must first mark their stage as "Collected at Bank" — only then can the hospital finalise the record. This ensures accurate tracking and prevents premature completion.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 space-y-20 transition-colors duration-300">
      {/* Decorative gradients */}
      <div className="absolute top-10 right-0 w-[40vw] h-[40vw] rounded-full bg-red-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[30vw] h-[30vw] rounded-full bg-blue-600/4 blur-[120px] pointer-events-none" />

      {/* ── Hero Header ── */}
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex p-3 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-600 dark:text-red-500 mb-2">
          <HeartPulse className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight">
          How OneBlood Works
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A real-time, end-to-end blood coordination platform. Every step — from request to receipt — is tracked, documented, and confirmed across all four parties.
        </p>

        {/* Key Identity callout */}
        <div className="inline-flex flex-wrap items-center justify-center gap-4 mt-4 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Fingerprint className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span><span className="font-bold text-slate-900 dark:text-white">OneBlood ID</span> — OB-XXXXXXX</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <BadgeCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span><span className="font-bold text-slate-900 dark:text-white">Match ID</span> — MOB-XXXXXXX</span>
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <BarChart3 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span><span className="font-bold text-slate-900 dark:text-white">Progress Bar</span> — Live Sync</span>
          </div>
        </div>
      </div>

      {/* ── Seeker + Donor Columns ── */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">

        {/* Section 1 — For Seekers */}
        <div className="space-y-8 text-left">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-white/5">
            <Heart className="w-5 h-5 text-amber-500" />
            <span>For Seekers (Looking for Blood)</span>
          </h2>

          <div className="relative pl-8 space-y-8 border-l-2 border-dashed border-red-500/30">

            <Step number="1" color="red" title="Register & Get Your OneBlood ID"
              description="Sign up with your details. Instantly receive a unique OneBlood ID (OB-XXXXXXX) that identifies you across the platform and on all official match documents.">
              <span className="font-mono text-amber-600 dark:text-amber-400">Your ID: OB-3742819 (example)</span>
            </Step>

            <Step number="2" color="red" title="Submit a Blood Request"
              description="On the Search Map or from your dashboard, fill in the patient's details — name, age, gender, blood group, component type, units needed, urgency level, hospital details, and doctor's information. Attach the doctor's prescription letter as supporting evidence." />

            <Step number="3" color="red" title="Geospatial Matching & Alert Dispatch"
              description="The system scans for eligible donors within your set radius using geospatial queries. Matched donors receive instant real-time push notifications and email alerts with full request details.">
              <span>You can also target a <span className="text-slate-900 dark:text-white font-semibold">specific donor</span> directly from the map by clicking their pin — the request goes exclusively to them.</span>
            </Step>

            <Step number="4" color="red" title="Donor Responds — You Review & Approve"
              description="Donors who can help will accept the request. You'll receive a notification. On your dashboard under 'Requests Sent', you'll see all responses. You then select:"
              badge="KEY STEP">
              <ul className="space-y-2 list-none">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-slate-700 dark:text-white font-semibold">Which donor to approve</span>
                </li>
                <li className="flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-red-500" />
                  <span className="text-slate-700 dark:text-white font-semibold">Final destination hospital</span>
                </li>
                <li className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-700 dark:text-white font-semibold">Optional: transit blood bank</span>
                </li>
              </ul>
            </Step>

            <Step number="5" color="red" title="Match ID Generated & PDF Match Slip Issued"
              description="The moment you approve, the system generates a unique Match ID (MOB-XXXXXXX). A detailed PDF match slip is produced containing:"
              badge="MOB-XXXXXXX">
              <ul className="space-y-2 list-none">
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Your OneBlood ID and patient details</span>
                </li>
                <li className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-red-500" />
                  <span>Donor OneBlood ID, address, and eligibility check</span>
                </li>
                <li className="flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-slate-400" />
                  <span>Destination hospital and transit blood bank details</span>
                </li>
                <li className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Official verification notice</span>
                </li>
              </ul>
              <p className="pt-1 text-slate-500 dark:text-slate-500">The PDF is emailed to all parties and available for download from every dashboard.</p>
            </Step>

            <Step number="6" color="red" title="Track via Live Progress Bar"
              description="Your seeker dashboard shows a real-time progress bar for your active donation. The stages depend on the route chosen:">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Match Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-600 dark:text-purple-400 text-[9px] font-black flex items-center justify-center shrink-0">2</span>
                  <span className="text-slate-700 dark:text-slate-300">Collected at Blood Bank <span className="text-slate-400 dark:text-slate-600">(if transit route)</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-600 dark:text-blue-400 text-[9px] font-black flex items-center justify-center shrink-0">3</span>
                  <span className="text-slate-700 dark:text-slate-300">En-route to Hospital</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 text-[9px] font-black flex items-center justify-center shrink-0">4</span>
                  <span className="text-slate-700 dark:text-slate-300">Donation Received — <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Fully Complete</span></span>
                </div>
              </div>
            </Step>

            <Step number="7" color="red" title="Moved to Past Donations"
              description="Once the hospital confirms receipt, the match is fully closed and stored in your Past Donations history — accessible from your seeker dashboard and the Active Donations page. All 4 parties (seeker, donor, blood bank, hospital) retain a full record." />

          </div>
        </div>

        {/* Section 2 — For Donors */}
        <div className="space-y-8 text-left">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-white/5">
            <HeartPulse className="w-5 h-5 text-red-500" />
            <span>For Donors (Ready to Donate)</span>
          </h2>

          <div className="relative pl-8 space-y-8 border-l-2 border-dashed border-emerald-500/30">

            <Step number="1" color="emerald" title="Register & Complete Your Donor Profile"
              description="Sign up and fill in your blood group, age, weight, city, and contact preferences. You receive a unique OneBlood ID (OB-XXXXXXX) which identifies you on all match slips and communications.">
              <span>The system automatically enforces the <span className="text-slate-900 dark:text-white font-semibold">56-day cooldown rule</span> — your eligibility date is tracked and displayed on your dashboard.</span>
            </Step>

            <Step number="2" color="emerald" title="Set Your Availability"
              description="Toggle your availability on your Donor Home or Dashboard. When toggled ON, you're included in geospatial searches and can receive request notifications. Toggle OFF to pause without losing your profile." />

            <Step number="3" color="emerald" title="Receive Requests — Direct or Broadcast"
              description="You'll receive two types of requests in 'Requests Sent to You' on your dashboard:">
              <ul className="space-y-2 list-none">
                <li className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-700 dark:text-white font-semibold">Broadcast requests</span>
                </li>
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-500" />
                  <span className="text-slate-700 dark:text-white font-semibold">Exclusive requests</span>
                </li>
              </ul>
              <p className="pt-1 text-slate-500 dark:text-slate-500">Only requests explicitly addressed to you appear here — not all requests for your blood group.</p>
            </Step>

            <Step number="4" color="emerald" title="Review Full Patient & Hospital Details"
              description="Expand any incoming request to see: patient name, age, gender, blood component required, urgency level, hospital name and address, doctor's name, doctor's contact, and the attached prescription letter.">
              <span>You can view the prescription document (image or PDF) before deciding to accept.</span>
            </Step>

            <Step number="5" color="emerald" title="Accept the Request"
              description="Tapping Accept sends your response to the seeker. The seeker then reviews all responses and formally approves you. Once approved, you'll receive a notification with the Match ID and the PDF match slip."
              badge="Triggers Match ID">
              <span>Your contact details are shared with the seeker only after formal approval — not when you simply accept.</span>
            </Step>

            <Step number="6" color="emerald" title="Receive Match ID & PDF Slip"
              description="Upon seeker approval, you receive a notification containing the Match ID (MOB-XXXXXXX) and a downloadable PDF match slip. The slip includes both the seeker's and your own verified details, the donation route, and destination."
              badge="MOB-XXXXXXX">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 block">Example: Match ID MOB-4829371</span>
            </Step>

            <Step number="7" color="emerald" title="Track Progress on Your Dashboard"
              description="Your Donor Dashboard and Donor Home show a live progress bar for your active donation match. The stages update automatically as the blood bank and hospital mark their steps complete." />

            <Step number="8" color="emerald" title="Earn Badges & Impact Score"
              description="Every completed donation increases your lifetime total. Earn badges like First Drop, Life Saver, Century Club, and Guardian Angel based on your donation count. Each donation is estimated to save 3 lives." />

          </div>
        </div>
      </div>

      {/* ── Section 3: Blood Banks & Hospitals ── */}
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-white/5 max-w-6xl mx-auto">
          <Landmark className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <span>For Blood Banks & Hospitals</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Blood Banks */}
          <div className="bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-purple-500/10 rounded-2xl p-6 text-left space-y-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Blood Banks</h3>
            </div>
            <div className="relative pl-7 space-y-5 border-l-2 border-dashed border-purple-500/35 text-xs text-slate-600 dark:text-slate-400">
              {[
                {
                  n: '1',
                  t: 'Register & Set Up Bank Profile',
                  d: 'Create a blood bank account and fill in your registration number, address, and contact. You receive a OneBlood ID for the bank account.'
                },
                {
                  n: '2',
                  t: 'Manage Real-Time Inventory',
                  d: 'The inventory matrix on your dashboard shows all 8 blood groups × 6 blood components. Click any cell to edit the unit count — changes auto-save to the server after 1.5 seconds. Low stock triggers a visual alert banner.'
                },
                {
                  n: '3',
                  t: 'Receive Transit Match Assignments',
                  d: 'When a seeker routes a donation through your bank, you receive a notification. The Active Donations section on your dashboard shows the Match ID, donor, seeker, and destination hospital.'
                },
                {
                  n: '4',
                  t: 'Mark "Collected at Bank" — Advances Progress Bar',
                  d: 'Once the donor arrives and the blood is collected/processed at your bank, click "Mark as Collected at Bank". This advances the progress bar for all 4 parties and notifies the donor and hospital to proceed to the next stage.',
                  badge: 'Stage 1 Complete'
                },
                {
                  n: '5',
                  t: 'View Full Donation History',
                  d: 'Past donations routed through your bank are permanently stored in your history — visible on the Active Donations page under "Past" tab.'
                }
              ].map(s => (
                <div key={s.n} className="relative space-y-1">
                  <span className="absolute -left-10 top-0.5 w-7 h-7 bg-white dark:bg-slate-900 border border-purple-500/35 rounded-full flex items-center justify-center text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    {s.n}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.t}</h4>
                    {s.badge && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-mono font-bold">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
            <Link to="/auth/signup" className="inline-block mt-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all">
              Register your Blood Bank
            </Link>
          </div>

          {/* Hospitals */}
          <div className="bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-blue-500/10 rounded-2xl p-6 text-left space-y-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Hospital className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hospitals</h3>
            </div>
            <div className="relative pl-7 space-y-5 border-l-2 border-dashed border-blue-500/35 text-xs text-slate-600 dark:text-slate-400">
              {[
                {
                  n: '1',
                  t: 'Register Your Hospital',
                  d: 'Sign up as a hospital and provide your registration number, address, emergency contact, and specialisation. You receive a unique OneBlood ID for the institution.'
                },
                {
                  n: '2',
                  t: 'View Active Donation Matches',
                  d: 'The Active Donations section of your hospital dashboard shows all current matches assigned to your facility — with the Match ID, donor name, seeker name, blood group, units, and current stage.'
                },
                {
                  n: '3',
                  t: 'Track Progress Bar in Real Time',
                  d: 'The live progress bar on your dashboard advances as the blood bank completes their transit stage. If no bank is involved, the bar moves directly from "Match Confirmed" to your stage.'
                },
                {
                  n: '4',
                  t: 'Mark "Donation Received" — Fully Completes the Cycle',
                  d: 'Once the blood is physically received at the hospital and the transfusion/handover is done, click "Mark Donation Received at Hospital". This fully completes the match. It moves from Active to Past Donations on all 4 dashboards.',
                  badge: 'Final Stage'
                },
                {
                  n: '5',
                  t: 'Access Complete Donation History',
                  d: 'All past donations to your hospital — with full donor, seeker, blood bank details, Match ID, and timestamps — are preserved in your Past Donations history permanently.'
                }
              ].map(s => (
                <div key={s.n} className="relative space-y-1">
                  <span className="absolute -left-10 top-0.5 w-7 h-7 bg-white dark:bg-slate-900 border border-blue-500/35 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {s.n}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.t}</h4>
                    {s.badge && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono font-bold">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
            <Link to="/auth/signup" className="inline-block mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all">
              Register your Hospital
            </Link>
          </div>

        </div>
      </div>

      {/* ── Section 4: The Match ID Explainer ── */}
      <div className="max-w-4xl mx-auto bg-white/70 dark:bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-200 dark:border-white/5 rounded-3xl p-8 text-left space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <BadgeCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">The Match ID System — MOB-XXXXXXX</h2>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Every approved donation gets a unique, tamper-proof identifier</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="bg-slate-100/50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-2">
            <span className="font-mono text-amber-600 dark:text-amber-400 font-black text-sm block">MOB-4829371</span>
            <p>Generated <span className="text-slate-900 dark:text-white font-semibold">automatically</span> the instant a seeker approves a donor. No manual steps needed.</p>
          </div>
          <div className="bg-slate-100/50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-2">
            <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <p>Embedded in the <span className="text-slate-900 dark:text-white font-semibold">downloadable PDF match slip</span> along with all party details, addresses, and medical verification notes.</p>
          </div>
          <div className="bg-slate-100/50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-2">
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <p>Tracks the full journey — visible on <span className="text-slate-900 dark:text-white font-semibold">all 4 dashboards</span> (seeker, donor, blood bank, hospital) simultaneously via real-time sync.</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider font-bold">Donation Journey — with Blood Bank Transit</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { label: 'Match Confirmed', color: 'emerald', icon: '✓' },
              { label: '', arrow: true },
              { label: 'Collected at Bank', color: 'purple', icon: '2' },
              { label: '', arrow: true },
              { label: 'En-route to Hospital', color: 'amber', icon: '3' },
              { label: '', arrow: true },
              { label: 'Donation Received', color: 'blue', icon: '✓' },
            ].map((item, i) => item.arrow ? (
              <ArrowRight key={i} className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
            ) : (
              <div key={i} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 ${
                item.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                item.color === 'purple' ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400' :
                item.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
              }`}>
                <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">For direct hospital donations (no transit bank), Stage 2 is skipped — the bar moves from Match Confirmed → En-route → Received.</p>
        </div>
      </div>

      {/* ── Section 5: Safety & Privacy ── */}
      <div className="max-w-4xl mx-auto text-left space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2 pb-2 border-b border-slate-200 dark:border-white/5">
          <Heart className="w-5 h-5 text-emerald-500" />
          <span>Safety & Privacy Standards</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/75 dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-2xl space-y-2 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Private Contacts</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Donor phone numbers and emails are hidden from all public views. They are exposed only to the specific seeker who formally approved that donor after matching.
            </p>
          </div>
          <div className="bg-white/75 dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-2xl space-y-2 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Document Evidence</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Doctor's prescription letters are uploaded and stored securely. They are attached to the match PDF and visible to all matched parties, providing verifiable medical evidence of need.
            </p>
          </div>
          <div className="bg-white/75 dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-2xl space-y-2 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Encrypted Records</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              All user data, match records, and communications are stored securely. Donation history is permanently preserved for all 4 parties even after completion.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 6: FAQ ── */}
      <div className="max-w-3xl mx-auto text-left space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">Frequently Asked Questions</h2>

        <div className="bg-white/75 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl divide-y divide-slate-200 dark:divide-white/5 overflow-hidden shadow-sm">
          {faqData.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center p-6 text-left focus:outline-none gap-4"
                >
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs text-slate-600 dark:text-slate-400 leading-relaxed animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CTA Footer ── */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <p className="text-slate-600 dark:text-slate-400 text-sm">Ready to be part of the network?</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/auth/signup"
            className="px-6 py-3 bg-[#C0152A] hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-1.5"
          >
            <span>Register as Donor</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/search"
            className="px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl text-sm transition-all flex items-center gap-1.5"
          >
            <span>Search Blood Map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
};

export default HowItWorksPage;
