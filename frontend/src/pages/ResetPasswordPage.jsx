import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { HeartPulse, Lock, ShieldCheck, Eye, EyeOff, Loader2, ArrowLeft, Check, X } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Direct URL navigation guard: redirect if email is absent
  useEffect(() => {
    if (!email) {
      toast.error('Session expired or invalid. Please request a new OTP.');
      navigate('/auth/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  if (!email) {
    return null; // Return null while redirecting
  }

  // Password criteria checks
  const criteria = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword)
  };

  const getStrengthScore = () => {
    let score = 0;
    if (criteria.length) score++;
    if (criteria.uppercase) score++;
    if (criteria.number) score++;
    if (criteria.special) score++;
    return score;
  };

  const score = getStrengthScore();
  const passwordsMatch = confirmPassword ? newPassword === confirmPassword : true;

  const getStrengthLabel = () => {
    if (newPassword.length === 0) return { label: 'Empty', color: 'bg-slate-200 dark:bg-slate-800 text-slate-400' };
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500 text-white' };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500 text-white' };
    if (score === 3) return { label: 'Good', color: 'bg-blue-500 text-white' };
    return { label: 'Strong', color: 'bg-emerald-500 text-white' };
  };

  const strengthLabel = getStrengthLabel();

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (score < 3) {
      toast.error('Please meet the password strength requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email,
        newPassword
      });

      if (res.data.success) {
        // Navigate to login with success message in state
        navigate('/auth/login', {
          replace: true,
          state: {
            successMessage: 'Your password has been successfully reset. Please log in with your new credentials.'
          }
        });
      } else {
        toast.error(res.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-[#07070A] px-4 py-12 transition-colors duration-300">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/[0.03] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/[0.015] blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] p-10 rounded-3xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-8 hover:border-slate-300 dark:hover:border-[#C0152A]/20 transition-all duration-300 animate-fade-in">
        
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-red-50 dark:bg-white/[0.03] border border-red-100 dark:border-white/[0.06] rounded-2xl text-[#C0152A] dark:text-[#FF4D6A] mb-2 shadow-sm">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">Reset Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
            Create a secure, strong password for <strong className="text-slate-700 dark:text-slate-200">{email}</strong>.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* New Password Input */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#C0152A] transition-all"
              />
              <span 
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </span>
            </div>
          </div>

          {/* Password Strength Visual Meter */}
          {newPassword.length > 0 && (
            <div className="space-y-2 text-left bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-150 dark:border-white/[0.03]">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">Strength:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] ${strengthLabel.color}`}>
                  {strengthLabel.label}
                </span>
              </div>
              
              {/* Score Bar */}
              <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${score >= 1 ? 'bg-red-500' : ''}`} />
                <div className={`h-full rounded-full transition-all duration-300 ${score >= 2 ? 'bg-amber-500' : ''}`} />
                <div className={`h-full rounded-full transition-all duration-300 ${score >= 3 ? 'bg-blue-500' : ''}`} />
                <div className={`h-full rounded-full transition-all duration-300 ${score >= 4 ? 'bg-emerald-500' : ''}`} />
              </div>

              {/* Requirement Checkboxes */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1">
                <div className="flex items-center space-x-1.5">
                  {criteria.length ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-red-500 shrink-0" />
                  )}
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-body">Min 8 chars</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {criteria.uppercase ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-red-500 shrink-0" />
                  )}
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-body">Uppercase (A-Z)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {criteria.number ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-red-500 shrink-0" />
                  )}
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-body">Number (0-9)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {criteria.special ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-red-500 shrink-0" />
                  )}
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-body">Special character</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password Input */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type={showConfirmPass ? "text" : "password"}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-black/30 border rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none transition-all ${
                  !passwordsMatch ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/[0.06] focus:border-[#C0152A]'
                }`}
              />
              <span 
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
                {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </span>
            </div>
            {!passwordsMatch && (
              <p className="text-[10px] text-red-500 pl-1 font-bold">Passwords do not match.</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || score < 3 || !passwordsMatch || newPassword === ''}
            className="w-full py-3.5 bg-gradient-to-r from-[#C0152A] to-[#FF4D6A] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xs text-white shadow-lg shadow-red-750/20 hover:shadow-red-755/35 transition-all flex items-center justify-center space-x-2 cursor-pointer keep-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/auth/forgot-password" className="inline-flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-[#C0152A] dark:hover:text-[#FF4D6A] font-bold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Restart Reset Flow</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPasswordPage;
