import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { Mail, KeyRound, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stage, setStage] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Initialize email if user is logged in
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Mask helper - shows first 2 chars + *** + domain
  const maskEmail = (emailStr) => {
    if (!emailStr) return '';
    const [local, domain] = emailStr.split('@');
    if (local.length <= 2) {
      return `${local}***@${domain}`;
    }
    return `${local.slice(0, 2)}***@${domain}`;
  };

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Stage 1: Request OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      toast.error('Email address is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        toast.success('A 6-digit OTP code has been sent to the registered email.');
        setStage('otp');
        setCooldown(60);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }, 100);
      } else {
        toast.error(res.data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to process request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 2: Verify OTP
  const handleVerifyOtp = async (otpValueString) => {
    const finalOtp = otpValueString || otp.join('');
    if (finalOtp.length !== 6 || !/^\d{6}$/.test(finalOtp)) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', {
        email,
        otp: finalOtp
      });

      if (res.data.success) {
        toast.success('OTP verified successfully!');
        navigate('/auth/reset-password', { state: { email }, replace: true });
      } else {
        toast.error(res.data.message || 'Invalid OTP.');
      }
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.code === 'TOO_MANY_ATTEMPTS') {
        toast.error(responseData.message || 'Too many incorrect attempts. Please request a new OTP.');
        setOtp(['', '', '', '', '', '']);
      } else if (responseData?.code === 'OTP_EXPIRED') {
        toast.error(responseData.message || 'This OTP has expired. Please request a new one.');
        setOtp(['', '', '', '', '', '']);
      } else {
        toast.error(responseData?.message || err.message || 'Verification failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for OTP Inputs
  const handleInputChange = (value, index) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    
    newOtp[index] = cleanValue.substring(cleanValue.length - 1);
    setOtp(newOtp);

    if (cleanValue && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedText)) {
      const digits = pastedText.split('');
      setOtp(digits);
      inputRefs.current[5].focus();
      handleVerifyOtp(pastedText);
    } else {
      toast.error('Invalid paste content. Please paste a 6-digit number.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-ob-ink px-4 py-12 transition-colors duration-300 relative overflow-hidden">
      
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-ob-red-700/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-neutral-100 dark:bg-neutral-900/[0.02] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-8 md:p-10 rounded-3xl shadow-card backdrop-blur-md space-y-8 transition-all duration-300">
        
        {stage === 'email' ? (
          /* STAGE 1: REQUEST OTP */
          <>
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 bg-ob-red-700/10 text-ob-red-700 rounded-2xl mb-2">
                <Mail className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-3xl font-display font-black text-neutral-900 dark:text-ob-white leading-tight">Forgot Password</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed px-2">
                Enter your registered email address to receive a 6-digit OTP code to recover your account.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-6">
              {!user && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-neutral-400" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-sm text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-ob-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm text-white hover:shadow-glow-red active:scale-[0.97] transition-all flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send OTP</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link to="/auth/login" className="inline-flex items-center space-x-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-ob-red-700 font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </>
        ) : (
          /* STAGE 2: OTP ENTER FORM */
          <>
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 bg-ob-red-700/10 text-ob-red-700 rounded-2xl mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-display font-black text-neutral-900 dark:text-ob-white leading-tight">OTP Sent</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Enter the 6-digit code sent to your email:<br />
                <strong className="text-neutral-900 dark:text-ob-white block text-base mt-1 font-mono font-bold">{maskEmail(email)}</strong>
              </p>
            </div>

            <div className="space-y-6">
              {/* Six Box OTP Inputs */}
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(e.target.value, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className="w-12 h-14 text-center text-lg font-bold bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:border-ob-red-700 focus:ring-2 focus:ring-ob-red-700/20 rounded-xl text-neutral-900 dark:text-ob-white focus:outline-none transition-all font-mono"
                  />
                ))}
              </div>

              <button
                onClick={() => handleVerifyOtp()}
                disabled={isLoading || otp.some(d => d === '')}
                className="w-full py-3 bg-ob-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm text-white hover:shadow-glow-red active:scale-[0.97] transition-all flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify Code</span>
                )}
              </button>

              <div className="flex flex-col items-center justify-center pt-2 space-y-4">
                <button
                  onClick={handleRequestOtp}
                  disabled={cooldown > 0 || isLoading}
                  className="inline-flex items-center space-x-1.5 text-xs text-ob-red-700 disabled:text-neutral-400 dark:disabled:text-neutral-600 font-bold hover:underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? (
                    <span>Resend OTP in {cooldown}s</span>
                  ) : (
                    <span>Resend OTP Code</span>
                  )}
                </button>

                <button
                  onClick={() => setStage('email')}
                  className="inline-flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-ob-white font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email</span>
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
