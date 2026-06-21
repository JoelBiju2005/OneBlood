import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { HeartPulse, Mail, KeyRound, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

const ForgotPasswordPage = () => {
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
  // joelbiju0504@gmail.com -> jo***@gmail.com
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
        // Delay focusing slightly to allow DOM transition
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
        // Redirect to ResetPasswordPage, passing the email in state
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
    
    // Take only the last character if multiple characters are entered
    newOtp[index] = cleanValue.substring(cleanValue.length - 1);
    setOtp(newOtp);

    // If typed a digit, auto-advance to next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      // If current box is empty, retreat focus to previous box and clear it
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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-[#07070A] px-4 py-12 transition-colors duration-300">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/[0.03] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/[0.015] blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] p-10 rounded-3xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-8 hover:border-slate-300 dark:hover:border-[#C0152A]/20 transition-all duration-300 animate-fade-in">
        
        {stage === 'email' ? (
          /* STAGE 1: REQUEST OTP */
          <>
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 bg-red-50 dark:bg-white/[0.03] border border-red-100 dark:border-white/[0.06] rounded-2xl text-[#C0152A] dark:text-[#FF4D6A] mb-2 shadow-sm">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">Forgot your password?</h2>
              {user ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-body leading-relaxed px-2">
                  A reset code will be sent to your registered email address on file.
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-body leading-relaxed px-2">
                  Enter your registered email address and we'll send you a 6-digit OTP to reset your password.
                </p>
              )}
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-6">
              {!user && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#C0152A] transition-all font-body"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#C0152A] to-[#FF4D6A] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xs text-white shadow-lg shadow-red-750/20 hover:shadow-red-755/35 transition-all flex items-center justify-center space-x-2 cursor-pointer keep-white"
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
              <Link to="/auth/login" className="inline-flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-[#C0152A] dark:hover:text-[#FF4D6A] font-bold transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </>
        ) : (
          /* STAGE 2: OTP ENTER FORM */
          <>
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 bg-red-50 dark:bg-white/[0.03] border border-red-100 dark:border-white/[0.06] rounded-2xl text-[#C0152A] dark:text-[#FF4D6A] mb-2 shadow-sm">
                <KeyRound className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">OTP sent</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body leading-relaxed">
                A 6-digit code has been sent to your registered email<br />
                <strong className="text-slate-700 dark:text-slate-200 block text-sm mt-1">{maskEmail(email)}</strong>
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                If you don't see it, check your spam folder.
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
                    className="w-12 h-14 text-center text-lg font-bold bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] focus:border-[#C0152A] focus:ring-1 focus:ring-[#C0152A] rounded-xl text-slate-900 dark:text-white focus:outline-none transition-all font-mono animate-fade-in"
                  />
                ))}
              </div>

              <button
                onClick={() => handleVerifyOtp()}
                disabled={isLoading || otp.some(d => d === '')}
                className="w-full py-3.5 bg-gradient-to-r from-[#C0152A] to-[#FF4D6A] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xs text-white shadow-lg shadow-red-750/20 hover:shadow-red-755/35 transition-all flex items-center justify-center space-x-2 cursor-pointer keep-white"
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

              {/* Resend Logic */}
              <div className="flex flex-col items-center justify-center pt-2 space-y-4">
                <button
                  onClick={handleRequestOtp}
                  disabled={cooldown > 0 || isLoading}
                  className="inline-flex items-center space-x-1.5 text-xs text-[#C0152A] dark:text-[#FF4D6A] disabled:text-slate-400 disabled:dark:text-slate-600 font-bold hover:underline cursor-pointer disabled:no-underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? (
                    <span>Resend OTP in {cooldown}s</span>
                  ) : (
                    <span>Resend OTP Code</span>
                  )}
                </button>

                <Link
                  to="/auth/login"
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-[#C0152A] dark:hover:text-[#FF4D6A] font-bold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
