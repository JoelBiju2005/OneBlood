import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Copy, Share2, ArrowRight, Check, Sparkles, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const SuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timerCancelled, setTimerCancelled] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  const shareMenuRef = useRef(null);

  const isNewUser = location.state?.isNewUser;
  const onebloodId = location.state?.onebloodId || user?.onebloodId || '';
  const name = location.state?.name || user?.name || 'User';
  const role = location.state?.role || user?.role || 'seeker';

  // Guard: if user is not authenticated, redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/auth/login', { replace: true });
    }
  }, [user, navigate]);

  // Set Page Title
  useEffect(() => {
    if (onebloodId) {
      document.title = `Welcome to OneBlood — ${onebloodId}`;
    }
  }, [onebloodId]);

  // Primary CTA route mapping
  const getPrimaryRoute = () => {
    if (!isNewUser) return '/home';
    if (role === 'donor') return '/donor/register';
    if (role === 'seeker') return '/search';
    if (role === 'blood_bank') return '/home';
    return '/home';
  };

  const getPrimaryLabel = () => {
    if (role === 'donor') return 'Complete Setup';
    if (role === 'seeker') return 'Find blood near me';
    if (role === 'blood_bank') return 'Go to Dashboard';
    return 'Go to Home';
  };

  // Countdown timer logic
  useEffect(() => {
    // Disabled auto-redirect to let new user stay on welcome page to see OneBlood ID and complete setup
    return;
  }, []);

  // Auto-redirect for logged-in user welcome back
  useEffect(() => {
    if (isNewUser) return;

    const timer = setTimeout(() => {
      navigate('/home', { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [isNewUser, navigate]);

  // Cancel timer on any user interaction
  const handleInteraction = () => {
    setTimerCancelled(true);
  };

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    handleInteraction();
    navigator.clipboard.writeText(onebloodId);
    setCopied(true);
    toast.success('OneBlood ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    handleInteraction();
    const shareText = `My OneBlood ID is ${onebloodId}. You can find or donate blood at OneBlood!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My OneBlood ID',
          text: shareText,
          url: window.location.origin
        });
        toast.success('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowShareMenu(true);
        }
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const handleWhatsAppShare = () => {
    handleInteraction();
    setShowShareMenu(false);
    const text = encodeURIComponent(`My OneBlood ID is ${onebloodId}. Join me on OneBlood to save lives!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (!isNewUser) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 px-4 py-16 font-sans">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#C0152A]/10 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-slate-900 blur-[150px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="bg-[#111] border border-[#C0152A]/30 rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-6"
               style={{ boxShadow: '0 0 40px rgba(192,21,42,0.15)' }}>
            
            <div className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
              <Check className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Successfully Logged In
              </h1>
              <p className="text-slate-400 text-lg">
                Welcome back, {name}!
              </p>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-10 h-10 border-4 border-[#C0152A] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-mono">
                Redirecting to home dashboard...
              </p>
            </div>

            <button
              onClick={() => navigate('/home', { replace: true })}
              className="w-full py-3.5 bg-[#C0152A] hover:bg-[#a01021] rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-700/20"
            >
              <span>Go to Home</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const firstName = name.split(' ')[0];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 px-4 py-16 font-sans">
      {/* Visual Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#C0152A]/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-slate-900 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 animate-fade-in">
        <div className="bg-[#111] border border-[#C0152A]/30 rounded-3xl p-8 md:p-10 shadow-2xl relative"
             style={{ boxShadow: '0 0 40px rgba(192,21,42,0.15)' }}>
          
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
              <Check className="w-8 h-8" strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              You're now part of OneBlood
            </h1>
            <p className="text-slate-400 text-lg">
              Welcome, {firstName}!
            </p>
            <p className="text-slate-500 text-sm">
              Your account has been created successfully.
            </p>
          </div>

          {/* Monospace Crimson ID Card */}
          <div className="bg-black/40 border border-[#C0152A]/40 rounded-2xl p-6 md:p-8 mb-8 text-center relative overflow-hidden"
               style={{ boxShadow: '0 0 25px rgba(192,21,42,0.1)' }}>
            <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-3">
              Your OneBlood ID
            </div>
            
            <div className="font-mono text-3xl md:text-4xl font-extrabold text-[#C0152A] tracking-[0.2em] select-all my-4 pl-4">
              {onebloodId}
            </div>

            <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">
              Save this ID. You can use it to log in alongside your email & password.
            </p>

            <div className="flex flex-row justify-center items-center gap-3 relative" ref={shareMenuRef}>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">✓ Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C0152A]/10 hover:bg-[#C0152A]/20 border border-[#C0152A]/30 text-white font-bold text-sm transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-red-400" />
                <span>Share</span>
              </button>

              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <div className="absolute top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-fade-in">
                  <button
                    onClick={handleCopy}
                    className="w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/5 transition-all flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy to clipboard</span>
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/5 transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share on WhatsApp</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description of ID */}
          <div className="border-t border-white/5 pt-6 mb-8 text-center md:text-left">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2">
              What your ID means:
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              This is your permanent identity on OneBlood. It's how donors and seekers recognise each other, and how you'll always be identified on this platform.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="space-y-4">
            <button
              onClick={() => {
                handleInteraction();
                navigate(getPrimaryRoute(), { replace: true });
              }}
              className="w-full py-4 bg-[#C0152A] hover:bg-[#a01021] rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-700/20"
            >
              <span>{getPrimaryLabel()}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center">
              <button
                onClick={() => {
                  handleInteraction();
                  navigate('/home', { replace: true });
                }}
                className="text-xs text-slate-400 hover:text-white transition-all font-semibold"
              >
                Skip for now — take me home
              </button>
            </div>
          </div>

          {/* Auto-redirect countdown disabled */}

        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
