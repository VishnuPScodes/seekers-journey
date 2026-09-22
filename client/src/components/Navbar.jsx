import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, BookOpen, Settings, LineChart, Menu, X, Sun, LogOut, Mountain, Compass, ChevronDown, Users } from 'lucide-react';
import HandDrawnNavbarEdge from './HandDrawnNavbarEdge';
import PersonaSwitcher from './PersonaSwitcher';

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

  const currentLevel = user.currentLevel || 1;

  // Navigation items matching spiritual manuscript aesthetics
  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={16} strokeWidth={1.8} />, id: 'nav-home' },
    { path: '/personal-journey', label: 'My Journey', icon: <Compass size={16} strokeWidth={1.8} />, id: 'nav-personal-journey' },
    { path: '/community', label: 'Sangha', icon: <Users size={16} strokeWidth={1.8} />, id: 'nav-community' },
    { path: '/journey', label: 'Kailash Journey', icon: <Mountain size={16} strokeWidth={1.8} />, id: 'nav-journey' },
    { path: '/select-practices', label: 'Practices', icon: <Settings size={16} strokeWidth={1.8} />, id: 'nav-select-practices' },
    { path: '/progress', label: 'Progress', icon: <LineChart size={16} strokeWidth={1.8} />, id: 'nav-progress' },
  ];

  // Full list for the mobile drawer (same items)
  const allNavItems = navItems;

  return (
    <>
      <nav className="navbar">
        {/* Organic Hand-Drawn Wavy Bottom Edge with Leaf Vine Flourishes */}
        <HandDrawnNavbarEdge fill="#d9572b" height={32} />

        <div className="navbar-left">
          {/* Top Left Menu Toggle Icon for Mobile */}
          <button
            className={`mobile-menu-toggle ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
            id="navbar-toggle-btn"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* White Rounded Brand Logo Badge (inspired by reference image) */}
          <Link to="/" className="navbar-brand-badge" style={{ textDecoration: 'none' }}>
            <div className="navbar-logo-white-box">
              <img src="/logo.png" className="navbar-logo-img" alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} />
              <Sun size={18} className="navbar-logo-fallback-icon" />
            </div>
            <span className="navbar-brand-title">Seekers Journey</span>
          </Link>
        </div>

        {/* Desktop Inline Navigation Links with Carets */}
        <div className="navbar-links desktop-only">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'nav-link-active' : ''}`}
              id={item.id}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {item.icon} {item.label}
              </span>
            </Link>
          ))}
        </div>

        <div className="navbar-user desktop-only">
          <PersonaSwitcher />
          <div className="navbar-avatar" title={user.name}>{initials}</div>
          <button className="btn-logout" onClick={handleLogout} id="navbar-logout-btn">
            Logout
          </button>
        </div>
      </nav>

      {/* ─── MOBILE SLIDE-OUT SACRED DRAWER ─── */}
      {menuOpen && (
        <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`nav-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="nav-drawer-header">
          <div className="nav-drawer-brand">
            <span className="navbar-sun-glyph lg">
              <Sun size={18} strokeWidth={2} />
            </span>
            <div className="brand-text-sm">
              <strong>Seekers Journey</strong>
              <span>Your Sacred Path with Isha</span>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={() => setMenuOpen(false)} aria-label="Close Menu">
            <X size={18} />
          </button>
        </div>

        <div className="nav-drawer-user">
          <div className="navbar-avatar-circle lg">{initials}</div>
          <div className="user-details">
            <span className="user-name">{user.name || 'Practitioner'}</span>
            <span className="user-email">{user.email}</span>
            <span className="user-station-tag">Spiritual Station • Level {currentLevel}</span>
          </div>
        </div>

        <div className="nav-drawer-links">
          <span className="drawer-section-title">Sacred Navigation</span>
          {allNavItems.map((item) => (
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

        <div className="nav-drawer-footer" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PersonaSwitcher />
          </div>
          <button className="btn-drawer-logout" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
