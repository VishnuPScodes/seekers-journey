import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
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
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Community from './pages/Community';
import SanghasDirectory from './pages/Community/SanghasDirectory';
import SanghaDetail from './pages/Community/SanghaDetail';
import GatheringsDirectory from './pages/Community/GatheringsDirectory';
import GatheringDetail from './pages/Community/GatheringDetail';

// Lazy-load the heavy Three.js game page
const KailashJourney = lazy(() => import('./pages/KailashJourney'));

// Smart root route handler: renders Home/Landing page for logged-in users, redirects guests to /login
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><div className="spinner" style={{ width: 36, height: 36 }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Landing />;
}

function AppRoutes() {
  return (
    <>
      <SacredBackgroundMotifsLayer color="#d9572b" />
      <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/landing" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* ── Admin Portal Routes ── */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/new-joiners"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />


      <Route
        path="/select-practices"
        element={
          <ProtectedRoute>
            <SelectPractices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/congrats"
        element={
          <ProtectedRoute>
            <Congrats />
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
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community/feed"
        element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community/circles"
        element={
          <ProtectedRoute>
            <SanghasDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community/sanghas"
        element={
          <ProtectedRoute>
            <SanghasDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community/circles/:slugOrId"
        element={
          <ProtectedRoute>
            <SanghaDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community/sanghas/:slugOrId"
        element={
          <ProtectedRoute>
            <SanghaDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community/gatherings"
        element={
          <ProtectedRoute>
            <GatheringsDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community/gatherings/:id"
        element={
          <ProtectedRoute>
            <GatheringDetail />
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
      <AdminAuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <PwaInstallPrompt />
        </BrowserRouter>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

