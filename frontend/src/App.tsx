// frontend/src/App.tsx  
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { JobsDashboard } from './pages/JobsDashboard';
import { AdminPage } from './pages/AdminPage';
import { UploadPage } from './pages/UploadPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { Navigation } from './components/Navigation';

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6">
          <Routes>
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/jobs" element={<JobsDashboard />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/" element={<Navigate to="/upload" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;  