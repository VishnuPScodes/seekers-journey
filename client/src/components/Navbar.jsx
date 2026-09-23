import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Home,
  LineChart,
  Menu,
  X,
  Sun,
  LogOut,
  Mountain,
  Compass,
  Users,
  Shield,
  Settings2,
} from 'lucide-react';
import HandDrawnNavbarEdge from './HandDrawnNavbarEdge';
import PersonaSwitcher from './PersonaSwitcher';
import PrivacySettingsModal from '../pages/Community/components/PrivacySettingsModal';
import PracticeSettingsModal from './PracticeSettingsModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showPracticeSettings, setShowPracticeSettings] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);

  // Close avatar floating menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setAvatarMenuOpen(false);
      }
    };
    if (avatarMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [avatarMenuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    setAvatarMenuOpen(false);
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const isActive = (path) => location.pathname === path;
  const currentLevel = user.currentLevel || 1;

  // Streamlined navigation items without standalone Practices tab
  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={16} strokeWidth={1.8} />, id: 'nav-home' },
    { path: '/personal-journey', label: 'My Journey', icon: <Compass size={16} strokeWidth={1.8} />, id: 'nav-personal-journey' },
    { path: '/community', label: 'Sangha', icon: <Users size={16} strokeWidth={1.8} />, id: 'nav-community' },
    { path: '/journey', label: 'Kailash Journey', icon: <Mountain size={16} strokeWidth={1.8} />, id: 'nav-journey' },
    { path: '/progress', label: 'Progress', icon: <LineChart size={16} strokeWidth={1.8} />, id: 'nav-progress' },
  ];

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

          {/* White Rounded Brand Logo Badge */}
          <Link to="/" className="navbar-brand-badge" style={{ textDecoration: 'none' }}>
            <div className="navbar-logo-white-box">
              <img
                src="/logo.png"
                className="navbar-logo-img"
                alt="Logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <Sun size={18} className="navbar-logo-fallback-icon" />
            </div>
            <span className="navbar-brand-title">Seekers Journey</span>
          </Link>
        </div>

        {/* Desktop Inline Navigation Links */}
        <div className="navbar-links desktop-only">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'nav-link-active' : ''}`}
              id={item.id}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {item.icon} {item.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Desktop User Section */}
        <div className="navbar-user desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PersonaSwitcher />

          {/* Dedicated Spiritual Privacy Shield */}
          <button
            type="button"
            className="navbar-privacy-btn"
            onClick={() => setShowPrivacy(true)}
            title="Spiritual Privacy Settings"
            aria-label="Spiritual Privacy Settings"
            style={{
              background: 'rgba(139, 107, 27, 0.08)',
              border: '1px solid rgba(139, 107, 27, 0.3)',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b6b1b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Shield size={16} />
          </button>

          {/* Interactive Seeker Avatar with Floating Menu */}
          <div ref={avatarMenuRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              className="navbar-avatar"
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              title={`Seeker Sanctuary • ${user.name}`}
              aria-label="Seeker Profile Menu"
              id="navbar-avatar-btn"
              style={{
                background: 'linear-gradient(135deg, #d9572b 0%, #b8441d 100%)',
                border: avatarMenuOpen ? '2px solid #f09268' : '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: avatarMenuOpen ? '0 0 12px rgba(217, 87, 43, 0.45)' : '0 2px 6px rgba(0,0,0,0.25)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {initials}
            </button>

            {/* Floating Seeker Menu */}
            {avatarMenuOpen && (
              <div
                className="avatar-floating-menu animate-in"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 260,
                  background: '#130f0c',
                  border: '1px solid rgba(217, 87, 43, 0.35)',
                  borderRadius: 14,
                  boxShadow: '0 16px 36px rgba(0,0,0,0.85), 0 0 1px rgba(217,87,43,0.3)',
                  padding: 8,
                  zIndex: 1150,
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {/* User Header */}
                <div
                  style={{
                    padding: '8px 10px 10px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#d9572b',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#f4efd8',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {user.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 6,
                        background: 'rgba(217, 87, 43, 0.25)',
                        color: '#e88f5f',
                        border: '1px solid rgba(217, 87, 43, 0.35)',
                      }}
                    >
                      Level {currentLevel}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      📍 {user.city || 'Bengaluru'}
                    </span>
                  </div>
                </div>

                {/* Menu Action Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      setShowPracticeSettings(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: '#f4efd8',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(217, 87, 43, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Settings2 size={15} color="#e88f5f" />
                    <span>⚙️ Practice Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      navigate('/personal-journey');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: '#f4efd8',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Compass size={15} color="#c49a45" />
                    <span>📜 My Spiritual Journey</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      navigate('/journey');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: '#f4efd8',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Mountain size={15} color="#94a3b8" />
                    <span>🏔️ Kailash Pilgrimage</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      setShowPrivacy(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: '#f4efd8',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Shield size={15} color="#8b6b1b" />
                    <span>🛡️ Spiritual Privacy</span>
                  </button>

                  <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fca5a5',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={15} color="#ef4444" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
          <div className="navbar-avatar-circle lg">
            {initials}
          </div>
          <div className="user-details">
            <span className="user-name">{user.name || 'Practitioner'}</span>
            <span className="user-email">{user.email}</span>
            <span className="user-station-tag">Spiritual Station • Level {currentLevel}</span>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowPracticeSettings(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'transparent',
                  border: 'none',
                  color: '#e88f5f',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Settings2 size={13} /> Practices
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowPrivacy(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'transparent',
                  border: 'none',
                  color: '#8b6b1b',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Shield size={13} /> Privacy
              </button>
            </div>
          </div>
        </div>

        <div className="nav-drawer-links">
          <span className="drawer-section-title">Sacred Navigation</span>
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

        <div className="nav-drawer-footer" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PersonaSwitcher />
          </div>
          <button className="btn-drawer-logout" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Global Spiritual Privacy Settings Modal */}
      <PrivacySettingsModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />

      {/* Floating Practice Settings Modal */}
      <PracticeSettingsModal
        isOpen={showPracticeSettings}
        onClose={() => setShowPracticeSettings(false)}
      />
    </>
  );
}
