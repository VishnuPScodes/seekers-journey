import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../api';
import GrowthAnalyticsModal from '../components/GrowthAnalyticsModal';
import ShambhaviCandidatesModal from '../components/ShambhaviCandidatesModal';
import AdminNotificationsModal from '../components/AdminNotificationsModal';
import AdminProgramRegistrationsModal from '../components/AdminProgramRegistrationsModal';

export default function AdminDashboard() {
  const { adminUser, adminLogout, getAdminToken } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Modal & Tab states
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showShambhaviModal, setShowShambhaviModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isNewJoinersRoute = location.pathname.includes('/new-joiners');
  const [activeTab, setActiveTab] = useState(isNewJoinersRoute ? 'new_joiners' : 'all');

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalCount: 0, nonMeditatorsCount: 0, newJoinersCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Sorting state
  const [nonMeditatorsOnly, setNonMeditatorsOnly] = useState(false);
  const [sortByHighestLevel, setSortByHighestLevel] = useState(false);
  const [sortByLastActive, setSortByLastActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Sync tab with URL
  useEffect(() => {
    if (location.pathname.includes('/new-joiners')) {
      setActiveTab('new_joiners');
    } else {
      setActiveTab('all');
    }
  }, [location.pathname]);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getAdminToken();

      const { data } = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(data.users || []);
      setStats(data.stats || { totalCount: 0, nonMeditatorsCount: 0, newJoinersCount: 0 });
      setLoading(false); // Render user list immediately!

      // Fetch unread notification count in background without blocking table
      api.get('/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(notifRes => {
        setUnreadCount(notifRes.data.unreadCount || 0);
      }).catch(nErr => {
        console.error('Error fetching unread count:', nErr);
      });
    } catch (err) {
      console.error('Error loading admin users data:', err);
      setError('Failed to fetch user directory. Please check network connection.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'new_joiners') {
      navigate('/admin/new-joiners');
    } else {
      navigate('/admin/dashboard');
    }
  };

  // Filter & Sort Logic
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // 1. Tab filter: New Joiners (joined in last 100 days) vs All
    if (activeTab === 'new_joiners') {
      result = result.filter(u => u.isNewJoiner);
    }

    // 2. Filter: "Non-Meditators" (users NOT doing Shambhavi Mahamudra)
    if (nonMeditatorsOnly) {
      result = result.filter(u => u.isNonMeditator);
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    // 4. Sort handling
    if (sortByHighestLevel) {
      result.sort((a, b) => b.currentLevel - a.currentLevel || b.totalCumulativeScore - a.totalCumulativeScore);
    } else if (sortByLastActive) {
      result.sort((a, b) => new Date(b.lastActivityDate) - new Date(a.lastActivityDate));
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [users, activeTab, nonMeditatorsOnly, searchQuery, sortByHighestLevel, sortByLastActive]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, nonMeditatorsOnly, sortByHighestLevel, sortByLastActive, searchQuery, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  }, [filteredUsers.length, itemsPerPage]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const maxLevel = useMemo(() => {
    if (users.length === 0) return 1;
    return Math.max(...users.map(u => u.currentLevel || 1));
  }, [users]);

  // Calculate visible page number buttons (e.g. max 5 buttons)
  const pageNumbers = useMemo(() => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f4efd8',
      color: '#3e382d',
      fontFamily: '"Inter", sans-serif',
      paddingBottom: '60px',
    }}>
      {/* ── Top Navigation Header ──────────────────────────────────────────────── */}
      <header style={{
        backgroundColor: '#ebdcb2',
        borderBottom: '1.5px solid rgba(217, 87, 43, 0.25)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 16px rgba(62, 56, 45, 0.08)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#d9572b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: '700',
              boxShadow: '0 2px 8px rgba(217, 87, 43, 0.3)',
            }}>
              🛡️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#3e382d',
                  margin: 0,
                  lineHeight: 1.1,
                }}>
                  Admin Portal
                </h1>
                <span style={{
                  backgroundColor: 'rgba(217, 87, 43, 0.15)',
                  color: '#d9572b',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(217, 87, 43, 0.3)',
                }}>
                  SEEKER MANAGEMENT
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#7e6b53', margin: '2px 0 0 0' }}>
                Signed in as <strong>{adminUser?.email || 'Admin'}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Admin Notifications Bell Icon */}
            <button
              onClick={() => setShowNotificationsModal(true)}
              title="Admin Notifications"
              style={{
                backgroundColor: 'rgba(62, 56, 45, 0.08)',
                border: '1.5px solid rgba(62, 56, 45, 0.2)',
                color: '#3e382d',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🔔</span>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  backgroundColor: '#d9572b',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(217, 87, 43, 0.4)',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Shambhavi Outreach — calls getTop5ShambhaviCandidates() inside the modal */}
            <button
              onClick={() => setShowShambhaviModal(true)}
              style={{
                backgroundColor: '#2d7d54',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(45, 125, 84, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              🪷 Shambhavi Outreach
            </button>
            <button
              onClick={() => setShowAnalyticsModal(true)}
              style={{
                backgroundColor: '#d9572b',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(217, 87, 43, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              📊 Growth Analytics
            </button>
            <button
              onClick={() => setShowRegistrationsModal(true)}
              style={{
                backgroundColor: '#c49a45',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(196, 154, 69, 0.3)',
                transition: 'all 0.2s ease',
              }}
              id="btn-admin-program-registrations"
            >
              🏛️ Program Registrations
            </button>
            <button
              onClick={fetchUsersData}
              style={{
                backgroundColor: 'rgba(62, 56, 45, 0.08)',
                border: '1px solid rgba(62, 56, 45, 0.2)',
                color: '#3e382d',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => {
                adminLogout();
                navigate('/admin/login');
              }}
              style={{
                backgroundColor: 'rgba(62, 56, 45, 0.12)',
                color: '#3e382d',
                border: '1px solid rgba(62, 56, 45, 0.2)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1200px', margin: '28px auto 0', padding: '0 20px' }}>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#fce8e6',
            color: '#c5221f',
            padding: '14px 18px',
            borderRadius: '10px',
            fontSize: '14px',
            marginBottom: '24px',
            border: '1px solid #f5c2c0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>⚠️ {error}</span>
            <button onClick={fetchUsersData} style={{ background: 'none', border: 'underline', color: '#c5221f', cursor: 'pointer', fontWeight: 'bold' }}>
              Retry
            </button>
          </div>
        )}

        {/* ── KPI Stat Cards ──────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}>
          {/* Stat 1: Total Users */}
          <div
            onClick={() => {
              setNonMeditatorsOnly(false);
              setSortByHighestLevel(false);
              setSearchQuery('');
              handleTabChange('all');
            }}
            style={{
              backgroundColor: '#ebdcb2',
              borderRadius: '14px',
              padding: '20px',
              border: activeTab === 'all' && !nonMeditatorsOnly && !sortByHighestLevel
                ? '2px solid #3e382d'
                : '1.5px solid rgba(62, 56, 45, 0.2)',
              boxShadow: activeTab === 'all' && !nonMeditatorsOnly && !sortByHighestLevel
                ? '0 6px 16px rgba(62, 56, 45, 0.15)'
                : '0 2px 8px rgba(62, 56, 45, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#7e6b53', letterSpacing: '0.5px' }}>
                Total Registered Seekers
              </div>
              {activeTab === 'all' && !nonMeditatorsOnly && !sortByHighestLevel && (
                <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#3e382d', color: '#fff', padding: '2px 6px', borderRadius: '8px' }}>
                  ACTIVE
                </span>
              )}
            </div>
            <div style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '36px',
              fontWeight: '700',
              color: '#3e382d',
              marginTop: '4px',
            }}>
              {stats.totalCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#6e6454', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>👆 Click to view all seekers</span>
            </div>
          </div>

          {/* Stat 2: Non-Meditators */}
          <div
            onClick={() => {
              setNonMeditatorsOnly(true);
            }}
            style={{
              backgroundColor: nonMeditatorsOnly ? 'rgba(217, 87, 43, 0.12)' : '#ebdcb2',
              borderRadius: '14px',
              padding: '20px',
              border: nonMeditatorsOnly
                ? '2px solid #d9572b'
                : '1.5px solid rgba(217, 87, 43, 0.3)',
              boxShadow: nonMeditatorsOnly
                ? '0 6px 16px rgba(217, 87, 43, 0.2)'
                : '0 2px 8px rgba(62, 56, 45, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#d9572b', letterSpacing: '0.5px' }}>
                Non-Meditators
              </div>
              {nonMeditatorsOnly && (
                <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#d9572b', color: '#fff', padding: '2px 6px', borderRadius: '8px' }}>
                  FILTERED
                </span>
              )}
            </div>
            <div style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '36px',
              fontWeight: '700',
              color: '#d9572b',
              marginTop: '4px',
            }}>
              {stats.nonMeditatorsCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#6e6454', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>👆 Click to list non-meditators</span>
            </div>
          </div>

          {/* Stat 3: New Joiners (Last 100 Days) */}
          <div
            onClick={() => {
              handleTabChange('new_joiners');
            }}
            style={{
              backgroundColor: activeTab === 'new_joiners' ? 'rgba(45, 125, 84, 0.12)' : '#ebdcb2',
              borderRadius: '14px',
              padding: '20px',
              border: activeTab === 'new_joiners'
                ? '2px solid #2d7d54'
                : '1.5px solid rgba(62, 56, 45, 0.2)',
              boxShadow: activeTab === 'new_joiners'
                ? '0 6px 16px rgba(45, 125, 84, 0.2)'
                : '0 2px 8px rgba(62, 56, 45, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#2d7d54', letterSpacing: '0.5px' }}>
                New Joiners (Last 100 Days)
              </div>
              {activeTab === 'new_joiners' && (
                <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#2d7d54', color: '#fff', padding: '2px 6px', borderRadius: '8px' }}>
                  VIEWING
                </span>
              )}
            </div>
            <div style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '36px',
              fontWeight: '700',
              color: '#2d7d54',
              marginTop: '4px',
            }}>
              {stats.newJoinersCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#6e6454', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>👆 Click to list new joiners</span>
            </div>
          </div>

          {/* Stat 4: Max Level */}
          <div
            onClick={() => {
              setSortByHighestLevel(true);
            }}
            style={{
              backgroundColor: sortByHighestLevel ? 'rgba(184, 134, 11, 0.12)' : '#ebdcb2',
              borderRadius: '14px',
              padding: '20px',
              border: sortByHighestLevel
                ? '2px solid #b8860b'
                : '1.5px solid rgba(62, 56, 45, 0.2)',
              boxShadow: sortByHighestLevel
                ? '0 6px 16px rgba(184, 134, 11, 0.2)'
                : '0 2px 8px rgba(62, 56, 45, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#b8860b', letterSpacing: '0.5px' }}>
                Highest Reached Level
              </div>
              {sortByHighestLevel && (
                <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#b8860b', color: '#fff', padding: '2px 6px', borderRadius: '8px' }}>
                  SORTED
                </span>
              )}
            </div>
            <div style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '36px',
              fontWeight: '700',
              color: '#b8860b',
              marginTop: '4px',
            }}>
              Level {maxLevel}
            </div>
            <div style={{ fontSize: '12px', color: '#6e6454', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>👆 Click to sort by highest level</span>
            </div>
          </div>
        </div>

        {/* ── Tabs & Filter Controls Section ───────────────────────────── */}
        <div style={{
          backgroundColor: '#ebdcb2',
          borderRadius: '16px',
          padding: '20px',
          border: '1.5px solid rgba(217, 87, 43, 0.2)',
          boxShadow: '0 4px 16px rgba(62, 56, 45, 0.06)',
          marginBottom: '24px',
        }}>
          {/* Tab Headers */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '2px solid rgba(62, 56, 45, 0.15)',
            paddingBottom: '14px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => handleTabChange('all')}
              style={{
                backgroundColor: activeTab === 'all' ? '#d9572b' : 'transparent',
                color: activeTab === 'all' ? '#ffffff' : '#3e382d',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '18px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                boxShadow: activeTab === 'all' ? '0 4px 12px rgba(217, 87, 43, 0.25)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              👥 All Users ({stats.totalCount})
            </button>

            <button
              onClick={() => handleTabChange('new_joiners')}
              style={{
                backgroundColor: activeTab === 'new_joiners' ? '#d9572b' : 'transparent',
                color: activeTab === 'new_joiners' ? '#ffffff' : '#3e382d',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '18px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                boxShadow: activeTab === 'new_joiners' ? '0 4px 12px rgba(217, 87, 43, 0.25)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🌱 New Joiners (Last 100 Days)</span>
              <span style={{
                backgroundColor: activeTab === 'new_joiners' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(45, 125, 84, 0.15)',
                color: activeTab === 'new_joiners' ? '#ffffff' : '#2d7d54',
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '700',
              }}>
                {stats.newJoinersCount}
              </span>
            </button>
          </div>

          {/* Controls Bar: Search + Non-Meditators Toggle + Sort by Highest Level */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            {/* Search Box */}
            <div style={{ flex: '1 1 280px', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search seekers by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(62, 56, 45, 0.25)',
                  backgroundColor: '#f4efd8',
                  color: '#3e382d',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Action Toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Filter 1: Non-Meditators Toggle */}
              <button
                onClick={() => setNonMeditatorsOnly(!nonMeditatorsOnly)}
                style={{
                  backgroundColor: nonMeditatorsOnly ? '#d9572b' : '#f4efd8',
                  color: nonMeditatorsOnly ? '#ffffff' : '#3e382d',
                  border: nonMeditatorsOnly ? '1.5px solid #d9572b' : '1.5px solid rgba(62, 56, 45, 0.3)',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: nonMeditatorsOnly ? '0 3px 10px rgba(217, 87, 43, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{nonMeditatorsOnly ? '✓' : '🔍'}</span>
                <span>Filter: Non-Meditators</span>
                {nonMeditatorsOnly && (
                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}>
                    Active
                  </span>
                )}
              </button>

              {/* Sort 1: Sort by Highest Level Toggle */}
              <button
                onClick={() => {
                  setSortByHighestLevel(!sortByHighestLevel);
                  if (!sortByHighestLevel) setSortByLastActive(false);
                }}
                style={{
                  backgroundColor: sortByHighestLevel ? '#3e382d' : '#f4efd8',
                  color: sortByHighestLevel ? '#ffffff' : '#3e382d',
                  border: sortByHighestLevel ? '1.5px solid #3e382d' : '1.5px solid rgba(62, 56, 45, 0.3)',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: sortByHighestLevel ? '0 3px 10px rgba(62, 56, 45, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{sortByHighestLevel ? '🏆' : '↕️'}</span>
                <span>Sort: Highest Level</span>
                {sortByHighestLevel && (
                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}>
                    Active
                  </span>
                )}
              </button>

              {/* Sort 2: Sort by Recently Active Toggle */}
              <button
                onClick={() => {
                  setSortByLastActive(!sortByLastActive);
                  if (!sortByLastActive) setSortByHighestLevel(false);
                }}
                style={{
                  backgroundColor: sortByLastActive ? '#2d7d54' : '#f4efd8',
                  color: sortByLastActive ? '#ffffff' : '#3e382d',
                  border: sortByLastActive ? '1.5px solid #2d7d54' : '1.5px solid rgba(62, 56, 45, 0.3)',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: sortByLastActive ? '0 3px 10px rgba(45, 125, 84, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>⚡</span>
                <span>Sort: Recently Active</span>
                {sortByLastActive && (
                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}>
                    Active
                  </span>
                )}
              </button>

              {(nonMeditatorsOnly || sortByHighestLevel || sortByLastActive || searchQuery) && (
                <button
                  onClick={() => {
                    setNonMeditatorsOnly(false);
                    setSortByHighestLevel(false);
                    setSortByLastActive(false);
                    setSearchQuery('');
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#c5221f',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    textDecoration: 'underline',
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Active Filters & Pagination Summary Bar ─────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#6e6454',
          padding: '0 4px',
        }}>
          <div>
            Showing <strong>{filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong>–
            <strong>{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> seekers
            {activeTab === 'new_joiners' && ' (joined in last 100 days)'}
            {nonMeditatorsOnly && ' (not practicing Shambhavi)'}
            {sortByHighestLevel && ' (sorted by highest level)'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#3e382d' }}>
              Rows per page:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(62, 56, 45, 0.25)',
                backgroundColor: '#f4efd8',
                color: '#3e382d',
                fontSize: '13px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* ── Seekers Table / List View ───────────────────────────────── */}
        {loading ? (
          <div style={{
            backgroundColor: '#ebdcb2',
            borderRadius: '14px',
            padding: '60px 20px',
            textAlign: 'center',
            color: '#7e6b53',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #d9572b',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', fontWeight: '700', color: '#d9572b' }}>
              Fetching Seeker Directory...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{
            backgroundColor: '#ebdcb2',
            borderRadius: '14px',
            padding: '48px 20px',
            textAlign: 'center',
            border: '1px dashed rgba(62, 56, 45, 0.3)',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🍃</div>
            <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '24px', margin: '0 0 8px 0', color: '#3e382d' }}>
              No matching seekers found
            </h3>
            <p style={{ fontSize: '14px', color: '#6e6454', maxWidth: '400px', margin: '0 auto 16px' }}>
              No users match your active tab, filter, or search query. Try clearing or relaxing the filters.
            </p>
            <button
              onClick={() => {
                setNonMeditatorsOnly(false);
                setSortByHighestLevel(false);
                setSearchQuery('');
              }}
              style={{
                backgroundColor: '#d9572b',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div style={{
              backgroundColor: '#ebdcb2',
              borderRadius: '16px',
              border: '1.5px solid rgba(217, 87, 43, 0.2)',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(62, 56, 45, 0.08)',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '14px',
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: 'rgba(217, 87, 43, 0.08)',
                      borderBottom: '1.5px solid rgba(217, 87, 43, 0.2)',
                      color: '#3e382d',
                    }}>
                      <th style={{ padding: '14px 18px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                      <th style={{ padding: '14px 18px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seeker Name</th>
                      <th style={{ padding: '14px 18px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sadhanas / Practices</th>
                      <th style={{ padding: '14px 18px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Reached Level</th>
                      <th style={{ padding: '14px 18px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</th>
                      <th style={{ padding: '14px 18px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Active</th>
                      <th style={{ padding: '14px 18px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Tag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user, idx) => {
                      const absoluteIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                      return (
                        <tr
                          key={user.id}
                          style={{
                            borderBottom: '1px solid rgba(62, 56, 45, 0.1)',
                            backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(244, 239, 216, 0.4)',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(217, 87, 43, 0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgba(244, 239, 216, 0.4)')}
                        >
                          {/* Index */}
                          <td style={{ padding: '14px 18px', color: '#7e6b53', fontWeight: '600', fontSize: '13px' }}>
                            {absoluteIdx}
                          </td>

                          {/* Name & Email */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: '700', color: '#3e382d', fontSize: '15px' }}>
                              {user.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#7e6b53', marginTop: '2px' }}>
                              {user.email} • {user.city}
                            </div>
                          </td>

                          {/* Sadhanas Doing */}
                          <td style={{ padding: '14px 18px', maxWidth: '340px' }}>
                            {user.selectedPractices && user.selectedPractices.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {user.selectedPractices.map((practiceName, pIdx) => {
                                  const isShambhavi = practiceName.toLowerCase().includes('shambhavi');
                                  return (
                                    <span
                                      key={pIdx}
                                      style={{
                                        backgroundColor: isShambhavi ? 'rgba(45, 125, 84, 0.12)' : 'rgba(62, 56, 45, 0.08)',
                                        color: isShambhavi ? '#2d7d54' : '#3e382d',
                                        border: isShambhavi ? '1px solid rgba(45, 125, 84, 0.3)' : '1px solid rgba(62, 56, 45, 0.15)',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                        display: 'inline-block',
                                      }}
                                    >
                                      {isShambhavi ? '🪷 ' : '🧘 '}
                                      {practiceName}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#a09078', italic: true }}>No sadhanas assigned</span>
                            )}
                          </td>

                          {/* Current Level */}
                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: user.currentLevel >= 30 ? '#d9572b' : '#3e382d',
                              color: '#ffffff',
                              padding: '4px 12px',
                              borderRadius: '16px',
                              fontWeight: '700',
                              fontSize: '13px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                            }}>
                              <span>Lvl {user.currentLevel}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#7e6b53', marginTop: '3px' }}>
                              {user.totalCumulativeScore.toLocaleString()} pts
                            </div>
                          </td>

                          {/* Joined Date */}
                          <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#3e382d' }}>
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                            </div>
                            <div style={{ fontSize: '11px', color: user.isNewJoiner ? '#2d7d54' : '#7e6b53', fontWeight: user.isNewJoiner ? '700' : 'normal' }}>
                              {user.daysSinceJoining === 0 ? 'Joined Today' : `${user.daysSinceJoining} days ago`}
                            </div>
                          </td>

                          {/* Last Active Date & Status */}
                          <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#3e382d' }}>
                              {user.lastActivityDate ? new Date(user.lastActivityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: user.daysSinceLastActive === 0 ? '#2d7d54' : user.daysSinceLastActive <= 7 ? '#d9572b' : '#7e6b53',
                              fontWeight: user.daysSinceLastActive <= 7 ? '700' : 'normal'
                            }}>
                              {user.daysSinceLastActive === 0 ? '⚡ Active Today' : `${user.daysSinceLastActive} ${user.daysSinceLastActive === 1 ? 'day' : 'days'} ago`}
                            </div>
                          </td>

                          {/* Status Tag */}
                          <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                            {user.isNonMeditator ? (
                              <span style={{
                                backgroundColor: 'rgba(217, 87, 43, 0.12)',
                                color: '#d9572b',
                                border: '1px solid rgba(217, 87, 43, 0.3)',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '4px 10px',
                                borderRadius: '12px',
                              }}>
                                Non-Meditator
                              </span>
                            ) : (
                              <span style={{
                                backgroundColor: 'rgba(45, 125, 84, 0.12)',
                                color: '#2d7d54',
                                border: '1px solid rgba(45, 125, 84, 0.3)',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '4px 10px',
                                borderRadius: '12px',
                              }}>
                                Shambhavi Practitioner
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Pagination Controls Bar ───────────────────────────────── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '20px',
              backgroundColor: '#ebdcb2',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(62, 56, 45, 0.15)',
            }}>
              <div style={{ fontSize: '13px', color: '#6e6454' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredUsers.length} total seekers)
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(62, 56, 45, 0.25)',
                    backgroundColor: currentPage === 1 ? 'rgba(62, 56, 45, 0.05)' : '#f4efd8',
                    color: currentPage === 1 ? '#a09078' : '#3e382d',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  « First
                </button>

                {/* Prev Page */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(62, 56, 45, 0.25)',
                    backgroundColor: currentPage === 1 ? 'rgba(62, 56, 45, 0.05)' : '#f4efd8',
                    color: currentPage === 1 ? '#a09078' : '#3e382d',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ‹ Prev
                </button>

                {/* Page Number Buttons */}
                {pageNumbers.map(pg => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: pg === currentPage ? '1px solid #d9572b' : '1px solid rgba(62, 56, 45, 0.25)',
                      backgroundColor: pg === currentPage ? '#d9572b' : '#f4efd8',
                      color: pg === currentPage ? '#ffffff' : '#3e382d',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: pg === currentPage ? '0 2px 6px rgba(217, 87, 43, 0.3)' : 'none',
                    }}
                  >
                    {pg}
                  </button>
                ))}

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(62, 56, 45, 0.25)',
                    backgroundColor: currentPage === totalPages ? 'rgba(62, 56, 45, 0.05)' : '#f4efd8',
                    color: currentPage === totalPages ? '#a09078' : '#3e382d',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next ›
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(62, 56, 45, 0.25)',
                    backgroundColor: currentPage === totalPages ? 'rgba(62, 56, 45, 0.05)' : '#f4efd8',
                    color: currentPage === totalPages ? '#a09078' : '#3e382d',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Last »
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Growth Analytics Pop-Up Modal ────────────────────────────── */}
      <GrowthAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        users={users}
      />

      {/* ── Shambhavi Outreach Pop-Up Modal ──────────────────────────── */}
      {/* Passes the full user list; the modal internally filters to non-meditators
          and runs the readiness scoring algorithm to surface the top 5 candidates */}
      <ShambhaviCandidatesModal
        isOpen={showShambhaviModal}
        onClose={() => setShowShambhaviModal(false)}
        users={users}
        getAdminToken={getAdminToken}
        onUserContacted={fetchUsersData}
      />

      {/* ── Admin Notifications Pop-Up Modal ───────────────────────── */}
      <AdminNotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => {
          setShowNotificationsModal(false);
          fetchUsersData();
        }}
        getAdminToken={getAdminToken}
        onOpenShambhaviModal={() => setShowShambhaviModal(true)}
      />

      {/* ── Admin Program Registrations Pop-Up Modal ──────────────────── */}
      <AdminProgramRegistrationsModal
        isOpen={showRegistrationsModal}
        onClose={() => setShowRegistrationsModal(false)}
        getAdminToken={getAdminToken}
      />
    </div>
  );
}
