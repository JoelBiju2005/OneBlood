import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { HeartPulse, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  identifier: z.string().min(1, { message: 'OneBlood ID or Email is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const LoginPage = () => {
  const { login, isLoading, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show success message from password reset redirect
  React.useEffect(() => {
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Auto-redirect if already logged in
  React.useEffect(() => {
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
      // Navigate to success welcome page
      navigate('/welcome', { replace: true, state: { isNewUser: false, name: loggedUser.name } });
    } catch (error) {
      setIsSubmitting(false);
      toast.error(error.response?.data?.message || error.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-[#07070A] px-4 py-12 transition-colors duration-300">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/[0.03] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/[0.015] blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-[#0F0F1A]/60 border border-slate-200 dark:border-white/[0.05] p-10 rounded-3xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-8 hover:border-slate-300 dark:hover:border-oneblood-crimson/20 transition-all duration-300">
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-red-50 dark:bg-white/[0.03] border border-red-100 dark:border-white/[0.06] rounded-2xl text-[#C0152A] dark:text-[#FF4D6A] mb-2 shadow-sm">
            <HeartPulse className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">Sign in to OneBlood</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-body">Enter your credentials to manage your requests and coordination.</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">OneBlood ID or Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="OB-D0N0R1 or name@example.com"
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#C0152A] transition-all font-mono"
                {...register('identifier')}
              />
            </div>
            {errors.identifier && <p className="text-[10px] text-red-500">{errors.identifier.message}</p>}
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Password</label>
              <Link to="/auth/forgot-password" className="text-[10px] text-[#C0152A] dark:text-[#FF4D6A] hover:underline font-bold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#C0152A] transition-all"
                {...register('password')}
              />
              <span 
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </span>
            </div>
            {errors.password && <p className="text-[10px] text-red-500">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-[#C0152A] to-[#FF4D6A] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-xs text-white shadow-lg shadow-red-750/20 hover:shadow-red-755/35 transition-all flex items-center justify-center space-x-2 cursor-pointer keep-white"
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Don't have an account? </span>
          <Link to="/auth/signup" className="text-[#C0152A] dark:text-[#FF4D6A] font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
