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
          } else if (user.role === 'patient') {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-red-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Check your inbox</h2>
        <p className="text-gray-600 mb-8">
          We sent a 6-digit verification code to <span className="font-semibold text-gray-700">{formattedEmail()}</span>
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100">
            {message}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                ref={(el) => (inputRefs.current[idx] = el)}
                className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:border-red-600 focus:outline-none transition-colors border-gray-200 text-gray-800"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full py-3.5 px-4 bg-[#C0152A] hover:bg-[#a01021] text-white font-semibold rounded-xl transition-all shadow-md shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="text-sm text-gray-500">
          Didn't get it?{' '}
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-[#C0152A] hover:underline font-semibold focus:outline-none"
            >
              Resend code &rarr;
            </button>
          ) : (
            <span>
              Resend in <span className="font-semibold text-gray-700">00:{timer.toString().padStart(2, '0')}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerifyPage;
