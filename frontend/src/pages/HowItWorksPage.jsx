import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldAlert, Heart, Landmark, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

const HowItWorksPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqData = [
    {
      q: 'Is OneBlood free to use?',
      a: 'Yes, OneBlood is completely free for patients, individual donors, and registered hospitals/blood banks. We do not charge anything for coordination or matching.'
    },
    {
      q: 'How do I know a request is genuine?',
      a: 'Every request requires a doctor\'s letter, which our AI verified system cross-analyzes for authenticity, checking details like hospital names, doctor names, and registration keys. Verified requests display an authenticity flag.'
    },
    {
      q: 'Can I remain anonymous?',
      a: 'Donors are shown only by first name and last initial in search lists. Your contact information and full name are completely hidden until you explicitly choose to accept a specific request.'
    },
    {
      q: 'What blood components are available?',
      a: 'Our platform coordinates Whole Blood, PRBC (Packed Red Blood Cells), Fresh Frozen Plasma, Platelets, Cryoprecipitate, and SDP (Single Donor Platelets).'
    },
    {
      q: 'Is my phone number safe?',
      a: 'Absolutely. Phone numbers and email addresses are encrypted in our databases and are never shown publicly. Only the seeker of a request you have explicitly accepted can view your contact details.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Decorative gradients */}
      <div className="absolute top-10 right-0 w-[40vw] h-[40vw] rounded-full bg-red-600/5 blur-[130px] pointer-events-none" />

      {/* Hero Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex p-3 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-500 mb-2">
          <HeartPulse className="w-8 h-8 text-red-500 animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
          How OneBlood Works
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          OneBlood connects people who need blood with those who can give — in real time, across Karnataka, Andhra Pradesh, and Telangana.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Section 1 — For seekers (step by step) */}
        <div className="space-y-8 text-left">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2 pb-2 border-b border-white/5">
            <Heart className="w-5 h-5 text-amber-500" />
            <span>For Seekers (Looking for Blood)</span>
          </h2>

          <div className="relative pl-8 space-y-8 border-l-2 border-dashed border-red-600/35">
            {/* Step 1 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-red-600/40 rounded-full flex items-center justify-center text-xs font-bold text-red-500">
                1
              </span>
              <h3 className="text-sm font-bold text-white">Create Request & Upload Letter</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide basic blood requirements and upload a doctor's prescription/requisition letter. Our AI OCR scans and verifies the document details immediately.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-red-600/40 rounded-full flex items-center justify-center text-xs font-bold text-red-500">
                2
              </span>
              <h3 className="text-sm font-bold text-white">Geospatial Scanning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our platform scans and locates matching eligible donors and registered blood bank inventories within your coordination radius.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-red-600/40 rounded-full flex items-center justify-center text-xs font-bold text-red-500">
                3
              </span>
              <h3 className="text-sm font-bold text-white">Alert Dispatch</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matched donors receive instant real-time push alerts on their dashboards, via Socket.IO connections, and notification emails.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-red-600/40 rounded-full flex items-center justify-center text-xs font-bold text-red-500">
                4
              </span>
              <h3 className="text-sm font-bold text-white">Acceptance & Chat Unlock</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Once a donor accepts your request, direct in-app chat rooms and encrypted contact details unlock.
              </p>
            </div>

            {/* Step 5 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-red-600/40 rounded-full flex items-center justify-center text-xs font-bold text-red-500">
                5
              </span>
              <h3 className="text-sm font-bold text-white">Coordinate & Save a Life</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Coordinate transport logistics or schedule a time to meet at the hospital directly.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2 — For donors (step by step) */}
        <div className="space-y-8 text-left">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2 pb-2 border-b border-white/5">
            <HeartPulse className="w-5 h-5 text-red-500" />
            <span>For Donors (Ready to Donate)</span>
          </h2>

          <div className="relative pl-8 space-y-8 border-l-2 border-dashed border-emerald-600/35">
            {/* Step 1 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-emerald-600/40 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400">
                1
              </span>
              <h3 className="text-sm font-bold text-white">Register & Complete Profile</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up and configure your blood group, city coordinates, and contact preferences.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-emerald-600/40 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400">
                2
              </span>
              <h3 className="text-sm font-bold text-white">Set Availability</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Toggle yourself active on the platform. Eligible status is guarded by the medical 56-day hold interval.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-emerald-600/40 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400">
                3
              </span>
              <h3 className="text-sm font-bold text-white">Receive Emergency Alerts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get real-time push alerts when someone nearby submits a verified matching request.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-emerald-600/40 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400">
                4
              </span>
              <h3 className="text-sm font-bold text-white">Review Request Details</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect hospital location, required components, and the AI analysis report of the doctor's verification letter.
              </p>
            </div>

            {/* Step 5 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-emerald-600/40 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400">
                5
              </span>
              <h3 className="text-sm font-bold text-white">Accept & Share Contact</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Accepting is a manual confirmation that unlocks your first name, initial, phone number, and a direct 1:1 chat room for coordination.
              </p>
            </div>

            {/* Step 6 */}
            <div className="relative space-y-1">
              <span className="absolute -left-12 top-0.5 w-8 h-8 bg-slate-900 border border-emerald-600/40 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400">
                6
              </span>
              <h3 className="text-sm font-bold text-white">Donate & Gain Impact</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete your donation, log your action, earn visual badges, and count your lifetime impact metrics!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 — For blood banks */}
      <div className="max-w-4xl mx-auto bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-md text-left flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-blue-400" />
            <span>For Blood Banks & Hospitals</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Registered banks can list component inventory, manage low stock alerts, receive coordinates requests from local patients, and run donation campaigns.
          </p>
        </div>
        <Link
          to="/auth/signup"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shrink-0"
        >
          Register your bank &rarr;
        </Link>
      </div>

      {/* Section 4 — Safety & Privacy */}
      <div className="max-w-4xl mx-auto text-left space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2 pb-2 border-b border-white/5">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Safety & Privacy Standards</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl space-y-2">
            <h4 className="text-sm font-bold text-white">Private Contacts</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Donor phone numbers and details are completely hidden in all listings. They are only exposed to verified requesters once the donor accepts.
            </p>
          </div>

          <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl space-y-2">
            <h4 className="text-sm font-bold text-white">AI-Verified Requests</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We verify and extract medical letters to reduce prank calls, scams, and double requests on our server.
            </p>
          </div>

          <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl space-y-2">
            <h4 className="text-sm font-bold text-white">Encrypted Logs</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All communications, chat messages, and user registration data are securely encrypted in transit and stored in MongoDB Atlas database.
            </p>
          </div>
        </div>
      </div>

      {/* Section 5 — FAQ */}
      <div className="max-w-3xl mx-auto text-left space-y-6">
        <h2 className="text-xl font-bold text-white text-center">Frequently Asked Questions</h2>

        <div className="bg-slate-900 border border-white/5 rounded-3xl divide-y divide-white/5 overflow-hidden">
          {faqData.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="transition-colors hover:bg-white/5">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                >
                  <span className="text-sm font-bold text-white">{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="p-6 pt-0 text-xs text-slate-400 leading-relaxed animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
