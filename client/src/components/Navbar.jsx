import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, BookOpen, Settings, LineChart, Menu, X, Sun, LogOut, Mountain, Compass } from 'lucide-react';
import TornPaperEdge from './TornPaperEdge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const isActive = (path) => location.pathname === path;

  // Extensible list of navigation items
  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={18} strokeWidth={1.5} />, id: 'nav-home' },
    { path: '/tracker', label: 'Sadhana Tracker', icon: <BookOpen size={18} strokeWidth={1.5} />, id: 'nav-tracker' },
    { path: '/personal-journey', label: 'My Journey', icon: <Compass size={18} strokeWidth={1.5} />, id: 'nav-personal-journey' },
    { path: '/journey', label: 'Kailash Journey', icon: <Mountain size={18} strokeWidth={1.5} />, id: 'nav-journey' },
    // { path: '/life-tracker', label: 'Life Journal', icon: '🌱', id: 'nav-life-tracker' },
    // { path: '/life-metrics', label: 'Life Metrics', icon: '📊', id: 'nav-life-metrics' },
    { path: '/select-practices', label: 'Practices', icon: <Settings size={18} strokeWidth={1.5} />, id: 'nav-select-practices' },
    { path: '/progress', label: 'Sadhana Progress', icon: <LineChart size={18} strokeWidth={1.5} />, id: 'nav-progress' },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          {/* Top Left Menu Toggle Icon */}
          <button
            className={`navbar-menu-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Navigation Menu"
            id="navbar-toggle-btn"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sun size={20} /> Seekers Journey
          </span>
        </div>

        {/* Desktop inline nav links */}
        <div className="navbar-links desktop-only">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'nav-link-active' : ''}`}
              id={item.id}
            >
              <span style={{ display: 'flex' }}>{item.icon}</span> {item.label}
            </Link>
          ))}
        </div>

        <div className="navbar-user desktop-only">
          <div className="navbar-avatar" title={user.name}>{initials}</div>
          <button className="btn-logout" onClick={handleLogout} id="navbar-logout-btn">
            Logout
          </button>
        </div>
      </nav>
      <TornPaperEdge fill="var(--bg-primary, #f4efd8)" bannerColor="#d9572b" height={22} />

      {/* Mobile / Slide-Out Navigation Drawer */}
      {menuOpen && (
        <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`nav-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="nav-drawer-header">
          <div className="nav-drawer-brand">
            <span className="brand-icon-sm" style={{ display: 'flex' }}><Sun size={20} /></span>
            <div className="brand-text-sm">
              <strong>Seekers Journey</strong>
              <span>Your Sacred Path with Isha</span>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={() => setMenuOpen(false)} aria-label="Close Menu">
            <X size={20} />
          </button>
        </div>

        <div className="nav-drawer-user">
          <div className="navbar-avatar lg">{initials}</div>
          <div className="user-details">
            <span className="user-name">{user.name || 'Practitioner'}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>

        <div className="nav-drawer-links">
          <span className="drawer-section-title">Navigation</span>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`drawer-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="drawer-link-icon">{item.icon}</span>
              <span className="drawer-link-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-drawer-footer">
          <button className="btn-drawer-logout" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
