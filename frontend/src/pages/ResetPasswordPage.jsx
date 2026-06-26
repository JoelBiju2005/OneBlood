import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, Check, X } from 'lucide-react';

export default function ResetPasswordPage() {
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
    return null;
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
    if (newPassword.length === 0) return { label: 'Empty', color: 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400' };
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500 text-white' };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500 text-white' };
    if (score === 3) return { label: 'Good', color: 'bg-blue-500 text-white' };
    return { label: 'Strong', color: 'bg-emerald-555 text-white' };
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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-ob-ink px-4 py-12 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-ob-red-700/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-neutral-100 dark:bg-neutral-900/[0.02] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-neutral-50 dark:bg-ob-ink-90/40 border border-neutral-200 dark:border-ob-glass-border p-8 md:p-10 rounded-3xl shadow-card backdrop-blur-md space-y-8 transition-all duration-300">
        
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-ob-red-700/10 text-ob-red-700 rounded-2xl mb-2">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-3xl font-display font-black text-neutral-900 dark:text-ob-white leading-tight">Reset Password</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Create a secure, strong password for <strong className="text-neutral-900 dark:text-ob-white font-mono">{email}</strong>.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* New Password Input */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-neutral-400" />
              </span>
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-sm text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
              />
              <span 
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-350"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </span>
            </div>
          </div>

          {/* Password Strength Visual Meter */}
          {newPassword.length > 0 && (
            <div className="space-y-2 text-left bg-neutral-100 dark:bg-neutral-900/40 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-neutral-400 dark:text-neutral-555 uppercase tracking-wider">Strength:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] ${strengthLabel.color}`}>
                  {strengthLabel.label}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${score >= 1 ? 'bg-red-500' : ''}`} />
                <div className={`h-full rounded-full transition-all duration-300 ${score >= 2 ? 'bg-amber-500' : ''}`} />
                <div className={`h-full rounded-full transition-all duration-300 ${score >= 3 ? 'bg-blue-500' : ''}`} />
                <div className={`h-full rounded-full transition-all duration-300 ${score >= 4 ? 'bg-emerald-500' : ''}`} />
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1">
                <div className="flex items-center space-x-1.5">
                  {criteria.length ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-red-500 shrink-0" />
                  )}
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Min 8 chars</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {criteria.uppercase ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-red-500 shrink-0" />
                  )}
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Uppercase (A-Z)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {criteria.number ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-red-500 shrink-0" />
                  )}
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Number (0-9)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {criteria.special ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-3 h-3 text-red-500 shrink-0" />
                  )}
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Special char</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password Input */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block pl-1">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-neutral-400" />
              </span>
              <input
                type={showConfirmPass ? "text" : "password"}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 bg-white dark:bg-neutral-900 border rounded-xl text-sm text-neutral-900 dark:text-ob-white focus:outline-none transition-all ${
                  !passwordsMatch ? 'border-red-500 focus:border-red-500' : 'border-neutral-250 dark:border-ob-glass-border focus:border-ob-red-700'
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
              <p className="text-[10px] text-ob-red-700 pl-1 font-bold">Passwords do not match.</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || score < 3 || !passwordsMatch || newPassword === ''}
            className="w-full py-3 bg-ob-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm text-white hover:shadow-glow-red active:scale-[0.97] transition-all flex items-center justify-center space-x-2"
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
          <Link to="/auth/forgot-password" className="inline-flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-ob-red-700 font-bold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Restart Reset Flow</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
