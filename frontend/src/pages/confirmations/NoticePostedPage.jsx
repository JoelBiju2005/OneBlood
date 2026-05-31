import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NoticePostedPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const notice = state?.notice;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-16 px-4 font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.08)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="glass-card max-w-lg w-full p-8 text-center space-y-6 relative border border-white/5 bg-slate-900/40 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/25 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
          📋
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-heading text-white">Your Need Is Now Live!</h1>
          <p className="text-slate-400 text-sm font-body leading-relaxed">
            Your blood request for <strong className="text-white">{notice?.patientName || 'the patient'}</strong> has been successfully posted to the OneBlood Requests Board.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <span className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-black">
            🩸 {notice?.bloodGroup || 'Any'}
          </span>
          <span className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold">
            🏥 {notice?.hospital || 'Hospital'}
          </span>
          <span className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-bold uppercase">
            ⚡ {notice?.urgency || 'URGENT'}
          </span>
        </div>

        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-slate-300 font-body leading-relaxed">
          Donors across the platform can now see your need and respond. You will be notified when someone expresses interest.
        </div>

        {notice?.doctorLetterUrl ? (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
            <span>✅</span> Doctor's letter uploaded — your post is marked Verified
          </div>
        ) : (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
            <span>⚠️</span> No doctor's letter — your post is marked Unverified. Consider adding one.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4">
          <button 
            onClick={() => navigate('/noticeboard')}
            className="py-3 px-4 bg-oneblood-crimson hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-red-700/15"
          >
            View Requests Board
          </button>
          <button 
            onClick={() => navigate('/home/seeker')}
            className="py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl border border-white/5 transition-all duration-200 cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
