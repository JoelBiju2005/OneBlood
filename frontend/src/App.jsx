import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import ProtectedRoute, { FullPageSpinner } from './components/auth/ProtectedRoute';
import useAuthStore from './store/authStore';
import { ThemeProvider } from './store/themeContext';

// Import All Client Pages
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BloodBankDetailPage from './pages/BloodBankDetailPage';
import DonorPublicProfilePage from './pages/DonorPublicProfilePage';
import NewRequestPage from './pages/NewRequestPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import DonorDashboard from './pages/DonorDashboard';
import DonorRegistrationPage from './pages/DonorRegistrationPage';
import BankDashboard from './pages/BankDashboard';
import BankSetupPage from './pages/BankSetupPage';
import AdminPanel from './pages/AdminPanel';
import AdminPortal from './pages/AdminPortal';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// New V3 Pages
import DonorHomePage from './pages/DonorHomePage';
import SeekerHomePage from './pages/SeekerHomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import SuccessPage from './pages/SuccessPage';
import AdminMonitoringPage from './pages/AdminMonitoringPage';
import DonorFindRequestsPage from './pages/DonorFindRequestsPage';
import HospitalDashboard from './pages/HospitalDashboard';
import ActiveDonationsPage from './pages/ActiveDonationsPage';

// Notice Board & Confirmation Pages
import NoticeBoardPage from './pages/NoticeBoardPage';
import PostNoticePage from './pages/PostNoticePage';
import NoticePostedPage from './pages/confirmations/NoticePostedPage';
import NoticeBoardResponsePage from './pages/confirmations/NoticeBoardResponsePage';
import DonorResponseConfirmPage from './pages/confirmations/DonorResponseConfirmPage';

const HomeRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth/login" replace />;
  const map = { donor: '/home/donor', seeker: '/home/seeker', blood_bank: '/dashboard/bank', hospital: '/dashboard/hospital', admin: '/admin' };
  return <Navigate to={map[user.role] || '/search'} replace />;
};

function App() {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  if (!isInitialized) {
    return <FullPageSpinner />;
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* Toast Alert System */}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '12px'
            }
          }}
        />
        
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/welcome" element={<SuccessPage />} />
            <Route path="/blood-bank/:id" element={<BloodBankDetailPage />} />
            <Route path="/donor/:id" element={<DonorPublicProfilePage />} />

            {/* Notice Board Routes */}
            <Route path="/noticeboard" element={<NoticeBoardPage />} />
            <Route path="/noticeboard/post" element={
              <ProtectedRoute allowedRoles={['seeker']}>
                <PostNoticePage />
              </ProtectedRoute>
            } />
            <Route path="/noticeboard/posted" element={
              <ProtectedRoute>
                <NoticePostedPage />
              </ProtectedRoute>
            } />
            <Route path="/noticeboard/response-confirm" element={
              <ProtectedRoute>
                <NoticeBoardResponsePage />
              </ProtectedRoute>
            } />
            <Route path="/donor/response-confirm" element={
              <ProtectedRoute allowedRoles={['donor']}>
                <DonorResponseConfirmPage />
              </ProtectedRoute>
            } />

            {/* Home Redirect & Role Specific Homes */}
            <Route path="/home" element={<HomeRedirect />} />
            <Route path="/home/donor" element={
              <ProtectedRoute allowedRoles={['donor']}>
                <DonorHomePage />
              </ProtectedRoute>
            } />
            <Route path="/home/seeker" element={
              <ProtectedRoute allowedRoles={['seeker']}>
                <SeekerHomePage />
              </ProtectedRoute>
            } />

            {/* Any Authenticated User */}
            <Route path="/request/new" element={
              <ProtectedRoute>
                <NewRequestPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/active-donations" element={
              <ProtectedRoute allowedRoles={['seeker', 'donor', 'hospital', 'blood_bank', 'admin']}>
                <ActiveDonationsPage />
              </ProtectedRoute>
            } />

            {/* Donor Only Routes */}
            <Route path="/dashboard/donor" element={
              <ProtectedRoute allowedRoles={['donor']}>
                <DonorHomePage />
              </ProtectedRoute>
            } />
            <Route path="/donor/find-requests" element={
              <ProtectedRoute allowedRoles={['donor']}>
                <DonorFindRequestsPage />
              </ProtectedRoute>
            } />
            <Route path="/donor/register" element={
              <ProtectedRoute allowedRoles={['donor']}>
                <DonorRegistrationPage />
              </ProtectedRoute>
            } />

            {/* Blood Bank Only Routes */}
            <Route path="/dashboard/bank" element={
              <ProtectedRoute allowedRoles={['blood_bank']}>
                <BankDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/bank/setup" element={
              <ProtectedRoute allowedRoles={['blood_bank']}>
                <BankSetupPage />
              </ProtectedRoute>
            } />

            {/* Hospital Only Routes */}
            <Route path="/dashboard/hospital" element={
              <ProtectedRoute allowedRoles={['hospital']}>
                <HospitalDashboard />
              </ProtectedRoute>
            } />

            {/* Admin Only Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/monitoring" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMonitoringPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            
            <Route path="/admin-portal" element={<AdminPortal />} />

            {/* Catch-all Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
