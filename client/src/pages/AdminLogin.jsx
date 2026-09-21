import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await adminLogin(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.message || 'Invalid admin credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickDemo = () => {
    setEmail('admin@sadhana.com');
    setPassword('admin@123456');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f4efd8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      color: '#3e382d',
      fontFamily: '"Inter", sans-serif',
      position: 'relative',
    }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217, 87, 43, 0.12) 0%, rgba(244, 239, 216, 0) 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ebdcb2',
        borderRadius: '16px',
        border: '1.5px solid rgba(217, 87, 43, 0.25)',
        padding: '36px 28px',
        boxShadow: '0 12px 32px rgba(62, 56, 45, 0.12)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top Emblem & Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(217, 87, 43, 0.15)',
            border: '2px solid #d9572b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '28px',
          }}>
            🛡️
          </div>

          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(217, 87, 43, 0.12)',
            color: '#d9572b',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: '20px',
            marginBottom: '8px',
            border: '1px solid rgba(217, 87, 43, 0.3)',
          }}>
            Admin Portal Access
          </div>

          <h1 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '32px',
            fontWeight: '700',
            color: '#3e382d',
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px',
          }}>
            Seeker's Journey
          </h1>

          <p style={{ fontSize: '14px', color: '#6e6454', margin: 0 }}>
            Sign in to access user analytics and portal management
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fce8e6',
            color: '#c5221f',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
            border: '1px solid #f5c2c0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#3e382d',
              marginBottom: '6px',
            }}>
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sadhana.com"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1.5px solid rgba(62, 56, 45, 0.25)',
                backgroundColor: '#f4efd8',
                color: '#3e382d',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#d9572b')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(62, 56, 45, 0.25)')}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#3e382d',
              marginBottom: '6px',
            }}>
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1.5px solid rgba(62, 56, 45, 0.25)',
                backgroundColor: '#f4efd8',
                color: '#3e382d',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#d9572b')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(62, 56, 45, 0.25)')}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: '#d9572b',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(217, 87, 43, 0.3)',
              transition: 'all 0.2s ease',
              marginBottom: '16px',
            }}
          >
            {submitting ? 'Authenticating Admin...' : 'Log In to Admin Portal'}
          </button>
        </form>

        {/* Quick fill helper button */}
        <div style={{
          textAlign: 'center',
          paddingTop: '16px',
          borderTop: '1px solid rgba(62, 56, 45, 0.15)',
        }}>
          <button
            type="button"
            onClick={fillQuickDemo}
            style={{
              background: 'none',
              border: '1px dashed #d9572b',
              color: '#d9572b',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            🔑 Fill Demo Admin Credentials
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link
            to="/login"
            style={{
              fontSize: '13px',
              color: '#7e6b53',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            ← Back to User Login
          </Link>
        </div>
      </div>
    </div>
  );
}
