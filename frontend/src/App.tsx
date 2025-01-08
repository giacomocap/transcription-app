import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { JobsDashboard } from './pages/JobsDashboard';
import { AdminPage } from './pages/AdminPage';
import { UploadPage } from './pages/UploadPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { LoginPage } from './pages/LoginPage';
import { Navigation } from './components/Navigation';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { WebSocketProvider } from './context/WebSocketContext';

const App = () => {
  console.log('App component rendered')
  return (
    <AuthProvider>
      <WebSocketProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="max-w-7xl mx-auto py-6">
              <Routes>
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
        </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default App;