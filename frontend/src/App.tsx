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

// Create a new component to handle the conditional rendering of the Navigation
const AppContent = () => {
  const location = useLocation();
  const { isPublicAccess } = usePublicAccess();
  const { isAuthenticated } = useAuth();  // Add this line
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50">
      {isPublicAccess || isLandingPage ? (
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <p className="text-base font-medium text-gray-900">
                <span className="text-primary">Unlock the full potential:</span> Sign up to Claire.AI now to access all features including meeting and lectures transcription and AI insights!
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/login" className="font-semibold">Sign Up Now</Link>
              </Button>
            </div>
          </div>
        </nav>
      ) : (
        !isLandingPage &&
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
          {/* Remove or comment out the last route that redirects "/" to "/upload" */}
          {/* <Route path="/" element={<Navigate to="/upload" />} /> */}
        </Routes>
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
