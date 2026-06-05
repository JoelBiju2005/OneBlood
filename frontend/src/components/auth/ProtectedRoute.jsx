import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { HeartPulse } from 'lucide-react';

const FullPageSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-oneblood-midnight text-slate-800 dark:text-white transition-colors duration-300 relative">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,21,42,0.04)_0%,transparent_65%)] dark:bg-[radial-gradient(circle_at_center,rgba(192,21,42,0.08)_0%,transparent_65%)] pointer-events-none" />
    
    <div className="flex flex-col items-center space-y-6 relative z-10">
      {/* Nice pulse animation wrapper */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing rings */}
        <div className="absolute w-20 h-20 bg-red-500/20 dark:bg-red-500/10 rounded-full animate-ping duration-1000" />
        <div className="absolute w-14 h-14 bg-red-500/30 dark:bg-red-500/20 rounded-full animate-pulse" />
        
        {/* Inner solid icon holder */}
        <div className="relative w-16 h-16 bg-[#C0152A] rounded-full flex items-center justify-center shadow-lg shadow-red-700/30">
          <HeartPulse className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-wide text-slate-900 dark:text-white flex items-center justify-center">
          <span className="text-[#C0152A]">One</span>
          <span>Blood</span>
        </h2>
        
        {/* Visible elegant loading text */}
        <div className="flex flex-col items-center space-y-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
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
