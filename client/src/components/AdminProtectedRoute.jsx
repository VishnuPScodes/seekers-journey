import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminProtectedRoute({ children }) {
  const { adminUser, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="page" style={{ backgroundColor: '#f4efd8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#3e382d' }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px', borderColor: '#d9572b transparent #d9572b transparent' }} />
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 18, color: '#d9572b', fontWeight: 700 }}>
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
