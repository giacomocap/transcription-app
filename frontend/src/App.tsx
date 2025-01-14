import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Create a new component to handle the conditional rendering of the Navigation
const AppContent = () => {
  const location = useLocation();
  const { isPublicAccess } = usePublicAccess();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50">
      {isPublicAccess ? (
        <div className="bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto py-3 px-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Sign up to access all features including transcription, speaker diarization, and more.
              </p>
              <a
                href="/login"
                className="ml-4 px-4 py-1.5 rounded-md bg-white text-primary hover:bg-primary-foreground text-sm font-medium transition-colors"
              >
                Sign up
              </a>
            </div>
          </div>
        </div>
      ) : (
        !isLandingPage && <Navigation />
      )}
      <main className="max-w-7xl mx-auto py-6">
        <Routes>
          {/* <Route path="/" element={<LandingPage />} /> */}
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
          <Route path="/" element={<Navigate to="/upload" />} />
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
