import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const OTPVerifyPage = ({ email: propEmail, onVerified }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp, error: authError } = useAuthStore();

  // Get email from props, or location state (if navigated here), or default empty
  const email = propEmail || location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      setError('No email found for verification. Please register again.');
    }
  }, [email]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    // Only accept numeric inputs
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Keep only last digit
    setOtp(newOtp);

    // Auto advance
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const pasteArray = pasteData.split('');
      setOtp(pasteArray);
      inputRefs.current[5].focus();
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    setError('');
    setMessage('');
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await verifyOtp(email, otpCode);
      setMessage('Email verified successfully!');
      
      if (onVerified) {
        onVerified(user);
      } else {
        // Fallback default routing
        setTimeout(() => {
          if (user.role === 'donor') {
            navigate(user.donorProfileComplete ? '/home/donor' : '/donor/register');
          } else if (user.role === 'seeker') {
            navigate('/home/seeker');
          } else if (user.role === 'blood_bank') {
            navigate('/dashboard/bank');
          } else {
            navigate('/search');
          }
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    setMessage('');
    try {
      await resendOtp(email);
      setMessage('Verification code resent successfully!');
      setTimer(45);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to resend code. Please try again.');
    }
  };

  const formattedEmail = () => {
    if (!email) return 'your email';
    const parts = email.split('@');
    if (parts[0].length <= 2) return email;
    return `${parts[0].substring(0, 2)}***@${parts[1]}`;
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-[#07070A] px-4 py-12 transition-colors duration-300">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/[0.03] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/[0.015] blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] p-10 rounded-3xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 dark:bg-white/[0.03] border border-red-100 dark:border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#C0152A] dark:text-[#FF4D6A]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
          </svg>
        </div>

        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">Check your inbox</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
          We sent a 6-digit verification code to <span className="font-semibold text-slate-700 dark:text-slate-300">{formattedEmail()}</span>
        </p>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/[0.05] text-red-750 dark:text-red-400 rounded-2xl text-xs border border-red-100 dark:border-red-500/20 text-left">
            {error}
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/[0.05] text-emerald-750 dark:text-emerald-400 rounded-2xl text-xs border border-emerald-100 dark:border-emerald-500/20 text-left">
            {message}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                ref={(el) => (inputRefs.current[idx] = el)}
                className="w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] focus:border-[#C0152A] dark:focus:border-[#FF4D6A] focus:outline-none transition-colors text-slate-800 dark:text-white"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#C0152A] to-[#FF4D6A] text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-750/20 hover:shadow-red-755/35 disabled:opacity-50 disabled:cursor-not-allowed mb-4 keep-white"
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Didn't get it?{' '}
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-[#C0152A] dark:text-[#FF4D6A] hover:underline font-bold focus:outline-none"
            >
              Resend code &rarr;
            </button>
          ) : (
            <span>
              Resend in <span className="font-semibold text-slate-755 dark:text-slate-300">00:{timer.toString().padStart(2, '0')}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerifyPage;
