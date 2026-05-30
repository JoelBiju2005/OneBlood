import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, MessageSquare, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DonorResponseConfirmPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const requestId = state?.requestId;

  useEffect(() => {
    // Confetti burst on load (crimson & white only)
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 28, spread: 360, ticks: 50, zIndex: 60 };
    const colors = ['#C0152A', '#ffffff', '#ff4d4d'];

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 45 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 },
        colors
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 },
        colors
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-16 px-4 font-sans relative">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.08)_0%,transparent_60%)] pointer-events-none" />
      
      <div 
        className="glass-card max-w-lg w-full p-10 text-center space-y-6 relative border border-[#C0152A]/30 rounded-3xl shadow-2xl"
        style={{ boxShadow: '0 0 40px rgba(192,21,42,0.15)' }}
      >
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-heading text-white">Emergency Request Accepted!</h1>
          <p className="text-slate-400 text-sm font-body leading-relaxed">
            Thank you for volunteering! Your contact details have been unlocked for the patient, and you can now communicate directly via the chat coordinates.
          </p>
        </div>

        <div className="p-5 bg-black/40 border border-[#C0152A]/20 rounded-2xl text-xs text-slate-300 font-body leading-relaxed text-left space-y-2">
          <p className="font-bold text-white uppercase tracking-wider text-[10px] text-red-500">Coordination Room Rules:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400">
            <li>Verify hospital requirements and timing before traveling.</li>
            <li>Maintain clear and polite communication with the requestor.</li>
            <li>Confirm eligibility guidelines for recent health changes or travel.</li>
          </ul>
        </div>

        <div className="flex flex-col space-y-3 pt-4">
          {requestId && (
            <button 
              onClick={() => navigate(`/chat/${requestId}`)}
              className="w-full py-4 bg-[#C0152A] hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-700/25"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Coordinate Chat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => navigate('/home/donor')}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl border border-white/5 transition-all duration-200 cursor-pointer"
          >
            Go back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
