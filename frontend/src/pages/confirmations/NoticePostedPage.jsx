import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Droplet, Hospital, AlertTriangle, CheckCircle2, AlertCircle, ArrowRight, LayoutDashboard } from 'lucide-react';

export default function NoticePostedPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const notice = state?.notice;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-16 px-4 font-sans relative transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.04)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.08)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="glass-card max-w-lg w-full p-8 text-center space-y-6 relative border border-slate-200/80 dark:border-white/5 bg-white/70 dark:bg-slate-900/40 rounded-3xl shadow-xl dark:shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/25 rounded-full flex items-center justify-center mx-auto text-red-500 animate-bounce">
          <ClipboardCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-heading text-slate-900 dark:text-white">Your Need Is Now Live!</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-body leading-relaxed">
            Your blood request for <strong className="text-slate-900 dark:text-white">{notice?.patientName || 'the patient'}</strong> has been successfully posted to the OneBlood Requests Board.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <span className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-black flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5" />
            <span>{notice?.bloodGroup || 'Any'}</span>
          </span>
          <span className="px-3.5 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <Hospital className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{notice?.hospital || 'Hospital'}</span>
          </span>
          <span className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{notice?.urgency || 'URGENT'}</span>
          </span>
        </div>

        <div className="p-4 bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl text-xs text-slate-600 dark:text-slate-300 font-body leading-relaxed">
          Donors across the platform can now see your need and respond. You will be notified when someone expresses interest.
        </div>

        {notice?.doctorLetterUrl ? (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Doctor's letter uploaded — your post is marked Verified</span>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>No doctor's letter — your post is marked Unverified. Consider adding one.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4">
          <button 
            onClick={() => navigate('/noticeboard')}
            className="py-3 px-4 bg-oneblood-crimson hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-red-700/15 flex items-center justify-center gap-1.5"
          >
            <span>View Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => navigate('/home/seeker')}
            className="py-3 px-4 bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-300/50 dark:border-white/5 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
