import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ArrowLeft, ShieldAlert } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="relative overflow-hidden bg-slate-950 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-16 px-4">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/5 blur-[130px] pointer-events-none" />

      <div className="text-center space-y-6 relative z-10 w-full max-w-md bg-slate-900/60 border border-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
        <div className="inline-flex p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full animate-bounce">
          <ShieldAlert className="w-12 h-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold text-white tracking-wider font-mono">404</h1>
          <h2 className="text-xl font-bold text-white font-display">Route Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            to="/" 
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-1.5 transition-all shadow-lg shadow-red-700/10"
          >
            <HeartPulse className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center space-x-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
