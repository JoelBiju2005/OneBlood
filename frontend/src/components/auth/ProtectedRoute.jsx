import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Logo from '../shared/Logo';

const FullPageSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-oneblood-midnight text-slate-800 dark:text-white transition-colors duration-300 relative">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,21,42,0.04)_0%,transparent_65%)] dark:bg-[radial-gradient(circle_at_center,rgba(192,21,42,0.08)_0%,transparent_65%)] pointer-events-none" />
    
    <div className="flex flex-col items-center space-y-6 relative z-10">
      {/* Beating & Glowing Logo Wrapper */}
      <div className="relative flex items-center justify-center mb-2">
        {/* Falling Blood Drop */}
        <div className="absolute z-20 animate-blood-fall flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="#C0152A" className="w-12 h-12 drop-shadow-[0_2px_12px_rgba(192,21,42,0.4)]">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>

        {/* Morphed Logo Container */}
        <div className="relative animate-logo-morph flex items-center justify-center">
          <Logo 
            size="xl" 
            showText={false} 
            className="drop-shadow-[0_0_35px_rgba(192,21,42,0.5)] dark:drop-shadow-[0_0_45px_rgba(192,21,42,0.65)]" 
          />
        </div>
      </div>

      <div className="text-center space-y-3 flex flex-col items-center">
        {/* Title branding */}
        <h2 className="text-2xl font-black tracking-wide text-slate-900 dark:text-white flex items-center justify-center">
          <span className="text-[#C0152A]">One</span>
          <span className="text-slate-800 dark:text-white">Blood</span>
        </h2>
        
        {/* Visible elegant loading text */}
        <div className="flex flex-col items-center space-y-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider animate-pulse">
            Connecting to server...
          </span>
          {/* Nice loading bar */}
          <div className="w-36 h-1 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden relative">
            <div className="h-full bg-[#C0152A] rounded-full animate-loading-bar w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, oneblood_token, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) return <FullPageSpinner />;

  if (!oneblood_token || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Role authorization checks
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashMap = {
      donor: '/dashboard/donor',
      blood_bank: '/dashboard/bank',
      hospital: '/dashboard/hospital',
      admin: '/admin',
      patient: '/search'
    };
    return <Navigate to={dashMap[user.role] || '/search'} replace />;
  }

  return children;
};

export default ProtectedRoute;
export { FullPageSpinner };
