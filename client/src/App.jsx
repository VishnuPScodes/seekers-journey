import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PwaInstallPrompt from './components/PwaInstallPrompt';

import Login from './pages/Login';
import Register from './pages/Register';
import SelectPractices from './pages/SelectPractices';
import Tracker from './pages/Tracker';
import Congrats from './pages/Congrats';
import Progress from './pages/Progress';

// Lazy-load the heavy Three.js pages
const Landing = lazy(() => import('./pages/Landing'));
const KailashJourney = lazy(() => import('./pages/KailashJourney'));

// import LifeTracker from './pages/LifeTracker';
// import LifeMetrics from './pages/LifeMetrics';

// Smart redirect from / based on auth state
const RiverLoader = () => (
  <div style={{ width: '100vw', height: '100vh', background: '#d8eef4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
    <div style={{ width: 40, height: 40, border: '3px solid rgba(90,144,112,0.3)', borderTopColor: '#5a9070', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 16, color: '#3a6a4a', opacity: 0.8 }}>Entering the river...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <RiverLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.practicesSelected) return <Navigate to="/select-practices" replace />;
  return <Landing />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<RiverLoader />}><RootRedirect /></Suspense>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/select-practices"
        element={
          <ProtectedRoute>
            <SelectPractices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracker"
        element={
          <ProtectedRoute>
            <Tracker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journey"
        element={
          <ProtectedRoute>
            <Suspense fallback={
              <div className="page" style={{ background: '#0a0618' }}>
                <div style={{ textAlign: 'center', color: '#a78bfa' }}>
                  <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px', borderColor: '#7c3aed transparent #7c3aed transparent' }} />
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: 16 }}>Loading Kailash Journey...</p>
                </div>
              </div>
            }>
              <KailashJourney />
            </Suspense>
          </ProtectedRoute>
        }
      />
      {/*
      <Route
        path="/life-tracker"
        element={
          <ProtectedRoute>
            <LifeTracker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/life-metrics"
        element={
          <ProtectedRoute>
            <LifeMetrics />
          </ProtectedRoute>
        }
      />
      */}
      <Route
        path="/congrats"
        element={
          <ProtectedRoute>
            <Congrats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <PwaInstallPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
}
