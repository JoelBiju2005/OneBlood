import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Droplet, Users, Phone, Share2, ArrowRight, LayoutDashboard } from 'lucide-react';

const ACTION_MESSAGES = {
  can_donate: { 
    icon: Droplet, 
    title: 'Thank you for volunteering!', 
    body: 'The seeker will be notified that you can donate. They will reach out to coordinate with you soon.' 
  },
  know_someone: { 
    icon: Users, 
    title: 'Referral noted!', 
    body: 'Thank you for connecting them. Please pass along the notice to whoever you have in mind.' 
  },
  contacted: { 
    icon: Phone, 
    title: 'Glad you reached out!', 
    body: 'Your response has been recorded. The seeker has been notified that you made contact.' 
  },
  shared: { 
    icon: Share2, 
    title: 'Sharing is saving lives!', 
    body: 'You have helped spread this request further. Every share could bring the right donor.' 
  },
};

export default function NoticeBoardResponsePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const msg = ACTION_MESSAGES[state?.action] || ACTION_MESSAGES['can_donate'];
  const IconComponent = msg.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-16 px-4 font-sans relative transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.04)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.08)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="glass-card max-w-lg w-full p-8 text-center space-y-6 relative border border-slate-200/80 dark:border-white/5 bg-white/70 dark:bg-slate-900/40 rounded-3xl shadow-xl dark:shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/25 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
          <IconComponent className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-heading text-slate-900 dark:text-white">{msg.title}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-body leading-relaxed">
            {msg.body}
          </p>
        </div>

        <div className="p-4 bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl text-xs text-slate-500 dark:text-slate-400 font-body leading-relaxed">
          Your voluntary response is recorded securely. You can review and manage your coordinate rooms from your dashboard.
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <button 
            onClick={() => navigate('/noticeboard')}
            className="py-3 px-4 bg-oneblood-crimson hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-red-700/15 flex items-center justify-center gap-1.5"
          >
            <span>Requests Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => navigate('/home/donor')}
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
