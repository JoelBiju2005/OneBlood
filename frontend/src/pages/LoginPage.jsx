import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { HeartPulse, Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck, Zap, Radio } from 'lucide-react';
import Logo from '../components/shared/Logo';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  identifier: z.string().min(1, { message: 'OneBlood ID or Email is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function LoginPage() {
  const { login, isLoading, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show success message from password reset redirect
  useEffect(() => {
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user && !isSubmitting) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, user, isSubmitting, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const isEmail = data.identifier.includes('@');
      const onebloodId = isEmail ? '' : data.identifier;
      const email = isEmail ? data.identifier : '';
      
      const loggedUser = await login(onebloodId, email, data.password);
      toast.success(`Welcome back, ${loggedUser.name}!`);
      navigate('/welcome', { replace: true, state: { isNewUser: false, name: loggedUser.name } });
    } catch (error) {
      setIsSubmitting(false);
      toast.error(error.response?.data?.message || error.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-ob-ink transition-colors duration-300">
      
      {/* LEFT VISUAL PANEL (Desktop: 50% or 55%) */}
      <div className="hidden md:flex md:w-[50%] lg:w-[55%] bg-gradient-to-br from-ob-red-950 via-ob-red-900 to-ob-red-950 p-12 text-white relative flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.35),transparent_80%)] pointer-events-none" />
        
        {/* Top Branding Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Logo size="lg" showText={false} />
          <div>
            <h2 className="text-xl font-display font-black tracking-tight text-white leading-none">OneBlood</h2>
            <span className="text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-red-300">Emergency Routing Node</span>
          </div>
        </div>

        {/* Platform Overview Feature Panel */}
        <div className="relative z-10 max-w-xl pr-8 my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-bold tracking-widest text-red-200 uppercase">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" /> Live Emergency Grid
          </div>
          <h3 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">
            Accelerating Emergency Blood Response Across India
          </h3>
          <p className="text-sm md:text-base font-light text-red-100/90 leading-relaxed">
            OneBlood coordinates verified donors, blood banks, and hospitals in real-time. Fast matching, encrypted data privacy, and zero broadcast delay.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-red-300 font-semibold text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4 text-red-400" /> &lt; 5 Min Dispatch
              </div>
              <p className="text-xs text-red-200/80">Proximity-based smart donor routing</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-red-300 font-semibold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-red-400" /> AES-256 Encrypted
              </div>
              <p className="text-xs text-red-200/80">Strict privacy & identity isolation</p>
            </div>
          </div>
        </div>

        {/* Bottom Status Ticker */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-xs text-red-200 font-mono">Status: Connected to public emergency feeds</p>
          <p className="text-[10px] text-red-300 uppercase tracking-widest font-bold">100% SECURED</p>
        </div>
      </div>

      {/* RIGHT AUTH FORM PANEL */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 bg-white dark:bg-ob-ink relative">
        {/* Mobile Logo Header */}
        <div className="md:hidden flex items-center justify-center gap-3 mb-8">
          <Logo size="md" showText={false} />
          <h1 className="text-2xl font-display font-black tracking-tight text-neutral-900 dark:text-ob-white">OneBlood</h1>
        </div>

        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="text-left space-y-2">
            <h2 className="text-3xl font-display font-black text-neutral-900 dark:text-ob-white leading-tight">
              Sign In
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Enter your verified credentials to access your routing dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Identifier Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">
                OneBlood ID or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-neutral-400" />
                </span>
                <input
                  type="text"
                  placeholder="OB-D0N0R1 or user@domain.com"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-sm text-neutral-900 dark:text-ob-white focus:outline-none transition-all font-mono"
                  {...register('identifier')}
                />
              </div>
              {errors.identifier && <p className="text-xs text-ob-red-700 mt-1 font-semibold">{errors.identifier.message}</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block">
                  Password
                </label>
                <Link to="/auth/forgot-password" className="text-xs text-ob-red-700 hover:underline font-bold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-neutral-400" />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-ob-glass-border focus:ring-2 focus:ring-ob-red-700/20 focus:border-ob-red-700 rounded-xl text-sm text-neutral-900 dark:text-ob-white focus:outline-none transition-all"
                  {...register('password')}
                />
                <span 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-350"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </span>
              </div>
              {errors.password && <p className="text-xs text-ob-red-700 mt-1 font-semibold">{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full py-3.5 bg-ob-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm text-white hover:shadow-glow-red active:scale-[0.97] transition-all flex items-center justify-center space-x-2"
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>Don't have an account? </span>
            <Link to="/auth/signup" className="text-ob-red-700 font-bold hover:underline">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
}
