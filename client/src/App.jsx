import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { SacredBackgroundMotifsLayer } from './components/SadhanaMotifs';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import SelectPractices from './pages/SelectPractices';
import Tracker from './pages/Tracker';
import Congrats from './pages/Congrats';
import Progress from './pages/Progress';
import PersonalJourney from './pages/PersonalJourney';

// Lazy-load the heavy Three.js game page
const KailashJourney = lazy(() => import('./pages/KailashJourney'));

// import LifeTracker from './pages/LifeTracker';
// import LifeMetrics from './pages/LifeMetrics';

// Smart redirect from / based on auth state
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.practicesSelected) return <Navigate to="/select-practices" replace />;
  return <Landing />;
}

function AppRoutes() {
  return (
    <>
      <SacredBackgroundMotifsLayer color="#d9572b" />
      <Routes>
      <Route path="/" element={<RootRedirect />} />
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
              <div className="page" style={{ background: '#f4efd8' }}>
                <div style={{ textAlign: 'center', color: '#3e382d' }}>
                  <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px', borderColor: '#d9572b transparent #d9572b transparent' }} />
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 18, color: '#d9572b', fontWeight: 700 }}>Loading Kailash Journey...</p>
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
      <Route
        path="/personal-journey"
        element={
          <ProtectedRoute>
            <PersonalJourney />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
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
