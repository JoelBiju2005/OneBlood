import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Check, Home, Heart, BadgeCheck, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export default function DonateSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Redirect if direct access without payment details state
    if (!state) {
      navigate('/donate', { replace: true });
      return;
    }

    // Confetti burst on load — crimson and white only, 3 seconds
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const colors = ['#C0152A', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, [state, navigate]);

  if (!state) return null;

  const { receiptId, paymentId, amount, donorName, donorEmail } = state;

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptId);
    setCopied(true);
    toast.success('Receipt ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center px-4 py-24 relative overflow-hidden">
      
      {/* Radial Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[500px] rounded-full bg-ob-red-700/[0.06] blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10">
        
        {/* Draw-on Animated SVG Checkmark */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-ob-red-700/10 border border-ob-red-700/20 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-ob-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              viewBox="0 0 24 24"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message Header */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-black mb-2"
        >
          Thank you, {donorName}!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-neutral-400 text-sm sm:text-base mb-8"
        >
          Your donation of <span className="text-ob-red-500 font-bold">₹{amount.toLocaleString('en-IN')}</span> has been received.
        </motion.p>

        {/* Invoice Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-neutral-900/60 border border-ob-glass-border rounded-2xl p-6 mb-8 text-left"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-ob-glass-border pb-3.5">
              <span className="text-neutral-400 font-medium">Receipt ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-ob-red-500 font-bold select-all">{receiptId}</span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
                  title="Copy Receipt ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-ob-glass-border pb-3.5">
              <span className="text-neutral-400 font-medium">Payment ID</span>
              <span className="font-mono text-neutral-200 select-all">{paymentId}</span>
            </div>

            <div className="flex items-center justify-between border-b border-ob-glass-border pb-3.5">
              <span className="text-neutral-400 font-medium">Amount</span>
              <span className="font-bold text-neutral-100">₹{amount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-400 font-medium">Status</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <BadgeCheck className="w-4 h-4" />
                <span>Paid</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Description and confirmation details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4 mb-10 text-xs sm:text-sm text-neutral-400 leading-relaxed font-light"
        >
          <p className="flex items-center justify-center gap-2 text-neutral-300">
            <Mail className="w-4 h-4 text-ob-red-500" />
            <span>A confirmation email with your receipt has been sent to <strong>{donorEmail}</strong>.</span>
          </p>
          <p>
            Your generosity helps cover blood transfusion costs for patients
            who cannot afford them. Thank you for being part of OneBlood.
          </p>
        </motion.div>

        {/* Buttons / Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            to="/"
            className="flex-1 bg-neutral-900 border border-ob-glass-border text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-neutral-800 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/donate"
            className="flex-1 bg-ob-red-700 hover:bg-ob-red-600 text-white font-bold py-3.5 px-6 rounded-xl transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>Donate Again</span>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
