import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LandingPage } from "./screens/LandingPage";
import { SignupPage } from "./screens/SignupPage";
import { LoginPage } from "./screens/LoginPage";
import { OTPVerification } from "./screens/OTPVerification";
import { ForgotPassword } from "./screens/ForgotPassword";
import { ResetPassword } from "./screens/ResetPassword";
import { Dashboard } from "./screens/Dashboard";
import { VideoUpload } from "./screens/VideoUpload";
import { VideoHistory } from "./screens/VideoHistory";
import { UserProfile } from "./screens/UserProfile";

import { MatchAnalytics } from "./screens/MatchAnalytics";
import { ReportGeneration } from "./screens/ReportGeneration";
import { ErrorPage } from "./screens/ErrorPage";
import { Layout } from "./components/Layout";
import { useEffect } from "react";

// Component to protect routes and check token expiration
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token, isTokenExpired, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check token expiration whenever the route changes
    if (user && token && isTokenExpired()) {
      console.log('Token expired on route change, redirecting to login');
      logout();
    }
  }, [location.pathname, user, token, isTokenExpired, logout]);

  // If no user or token is expired, redirect to login
  if (!user || (token && isTokenExpired())) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App = (): JSX.Element => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/verify-otp" element={!user ? <OTPVerification /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
        <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/dashboard" />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<VideoUpload />} />
          <Route path="history" element={<VideoHistory />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="analytics/:matchId" element={<MatchAnalytics />} />
          <Route path="reports" element={<ReportGeneration />} />
        </Route>
        
        {/* Error handling */}
        <Route path="/404" element={<ErrorPage />} />
        <Route path="/error" element={<ErrorPage errorCode="500" errorMessage="Server Error" />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </ThemeProvider>
  );
};