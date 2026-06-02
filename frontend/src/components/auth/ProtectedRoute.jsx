import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const FullPageSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-oneblood-midnight text-white">
    <div className="w-16 h-16 border-4 border-oneblood-crimson border-t-transparent rounded-full animate-spin mb-4" />
    <h2 className="text-xl font-bold font-display tracking-widest animate-pulse">ONEBLOOD</h2>
    <p className="text-xs text-slate-400 mt-2">Connecting to server...</p>
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
