import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden bg-slate-950 px-4 py-12">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-500/5 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 border border-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-500 mb-2">
            <HeartPulse className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">Sign in to OneBlood</h2>
          <p className="text-xs text-slate-400">Enter your credentials to manage your requests and inventory</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OneBlood ID or Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4.5 w-4.5 text-slate-500" />
              </span>
              <input
                type="text"
                placeholder="OB-D0N0R1 or name@example.com"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 transition-all font-mono"
                {...register('identifier')}
              />
            </div>
            {errors.identifier && <p className="text-[10px] text-red-500">{errors.identifier.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4.5 w-4.5 text-slate-500" />
              </span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 transition-all"
                {...register('password')}
              />
              <span 
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-500 hover:text-slate-300"
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
            disabled={isLoading}
            className="w-full py-3 bg-[#C0152A] hover:bg-[#a01021] disabled:bg-red-900 rounded-xl font-bold text-xs text-white shadow-lg shadow-red-700/20 hover:shadow-red-700/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-400">
          <span>Don't have an account? </span>
          <Link to="/auth/signup" className="text-red-500 font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
