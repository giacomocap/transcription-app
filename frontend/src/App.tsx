import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { JobsDashboard } from './pages/JobsDashboard';
import { UploadPage } from './pages/UploadPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { LoginPage } from './pages/LoginPage';
import { Navigation } from './components/Navigation';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicJobRoute } from './components/auth/PublicJobRoute';
import { AdminPage } from './pages/AdminPage';
// import { LandingPage } from './pages/LandingPage';

import { usePublicAccess } from './hooks/use-public-access';
import { Button } from './components/ui/button';
import LandingPage from './pages/LandingPage';
import { useAuth } from './context/AuthContext';  // Add this import at the top
import { useEffect, useMemo } from 'react';
import { OnboardingModal } from './components/OnboardingModal'; // Add this import
import { Toaster } from './components/ui/toaster';
import { SettingsPage } from './pages/SettingsPage';

// Create a new component to handle the conditional rendering of the Navigation
const AppContent = () => {
  const location = useLocation();
  const { isPublicAccess } = usePublicAccess();
  const { isAuthenticated, needsOnboarding } = useAuth();  // Add this line
  useEffect(() => {
    document.title = 'Claire - Audio & Video Intelligence Platform';
  }, []);
  const isLandingPage = useMemo(() => location.pathname === '/', [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {isPublicAccess || isLandingPage ? (
        <nav className="bg-white shadow fixed top-0 w-full z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between py-3 sm:py-0 sm:h-16 items-center gap-2 sm:gap-4">
              <p className="text-sm sm:text-base font-medium text-gray-900 text-center sm:text-left">
                <span className="text-primary">Try Claire:</span>
                <span className="hidden sm:inline"> Sign up now to access all features including meeting transcription and AI insights!</span>
                <span className="sm:hidden"> Sign up for full access!</span>
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90 whitespace-nowrap">
                <Link to="/login" className="font-semibold">Sign Up Now</Link>
              </Button>
            </div>
          </div>
        </nav>
      ) : (
        <Navigation />
      )}
      <main className="max-w-7xl mx-auto py-6">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/upload" /> : <LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <PublicJobRoute>
                <JobDetailPage />
              </PublicJobRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          {/* Remove or comment out the last route that redirects "/" to "/upload" */}
          {/* <Route path="/" element={<Navigate to="/upload" />} /> */}
        </Routes>
        {isAuthenticated && needsOnboarding && <OnboardingModal />}
        <Toaster />
      </main>
    </div>
  );
};

const App = () => {

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
