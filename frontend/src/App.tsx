import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { JobsDashboard } from './pages/JobsDashboard';
import { UploadPage } from './pages/UploadPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { LoginPage } from './pages/LoginPage';
import { Navigation } from './components/Navigation';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
// import { LandingPage } from './pages/LandingPage';

// Create a new component to handle the conditional rendering of the Navigation
const AppContent = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLandingPage && <Navigation />}
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
              <ProtectedRoute>
                <JobDetailPage />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          /> */}
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