import React, { useState, useEffect } from 'react';
import api from '../api';

const NOTIFICATION_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'program_interest', label: '🏛️ Program Interest' },
  { key: 'level_milestone', label: '🏔️ Level Milestones' },
  { key: 'streak_milestone', label: '🔥 Streaks' },
  { key: 'inactive_high_level', label: '⚠️ Inactivity Alerts' },
  { key: 'shambhavi_added', label: '🪷 Shambhavi / IE' },
];

export default function AdminNotificationsModal({
  isOpen,
  onClose,
  getAdminToken,
  onOpenShambhaviModal,
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = async () => {
    if (!isOpen) return;
    try {
      setLoading(true);
      const token = getAdminToken ? getAdminToken() : null;
      const { data } = await api.get('/admin/notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const token = getAdminToken ? getAdminToken() : null;
      const { data } = await api.put(`/admin/notifications/${id}/read`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(data.unreadCount ?? Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = getAdminToken ? getAdminToken() : null;
      await api.put('/admin/notifications/mark-all-read', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const token = getAdminToken ? getAdminToken() : null;
      const { data } = await api.delete(`/admin/notifications/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(data.unreadCount ?? unreadCount);
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  // Filter list by selected tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'shambhavi_added') return n.type === 'shambhavi_added' || n.type === 'inner_engineering_completed';
    if (activeTab !== 'all') return n.type === activeTab;
    return true;
  });

  const getTypeStyle = (type) => {
    switch (type) {
      case 'program_interest':
        return { bg: 'rgba(217, 87, 43, 0.08)', border: '#d9572b', icon: '🏛️' };
      case 'level_milestone':
        return { bg: 'rgba(184, 134, 11, 0.08)', border: '#b8860b', icon: '🏔️' };
      case 'streak_milestone':
        return { bg: 'rgba(217, 130, 43, 0.08)', border: '#d9822b', icon: '🔥' };
      case 'inactive_high_level':
        return { bg: 'rgba(197, 34, 31, 0.08)', border: '#c5221f', icon: '⚠️' };
      case 'shambhavi_added':
      case 'inner_engineering_completed':
        return { bg: 'rgba(45, 125, 84, 0.08)', border: '#2d7d54', icon: '🪷' };
      default:
        return { bg: 'rgba(62, 56, 45, 0.05)', border: '#7e6b53', icon: '🔔' };
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(62, 56, 45, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        backgroundColor: '#ebdcb2',
        borderRadius: '20px',
        border: '2px solid rgba(217, 87, 43, 0.3)',
        boxShadow: '0 20px 50px rgba(62, 56, 45, 0.3)',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Inter", sans-serif',
        color: '#3e382d',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 28px 16px',
          borderBottom: '1.5px solid rgba(217, 87, 43, 0.2)',
          backgroundColor: '#ebdcb2',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🔔</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '26px',
                    fontWeight: '700',
                    margin: 0,
                    color: '#3e382d',
                  }}>
                    Admin Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span style={{
                      backgroundColor: '#d9572b',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      {unreadCount} UNREAD
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#7e6b53', margin: '4px 0 0 0' }}>
                  Real-time & scanned telemetry alerts across all registered seekers.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    backgroundColor: 'rgba(45, 125, 84, 0.12)',
                    border: '1px solid rgba(45, 125, 84, 0.3)',
                    color: '#2d7d54',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  ✓ Mark All Read
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  backgroundColor: 'rgba(62, 56, 45, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#3e382d',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}>
            {NOTIFICATION_TYPES.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  backgroundColor: activeTab === tab.key ? '#3e382d' : '#f4efd8',
                  color: activeTab === tab.key ? '#ffffff' : '#3e382d',
                  border: '1px solid rgba(62, 56, 45, 0.2)',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 28px',
          backgroundColor: '#f4efd8',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7e6b53' }}>
              ⏳ Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#7e6b53' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌿</div>
              No notifications found in this category.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredNotifications.map(item => {
                const styleInfo = getTypeStyle(item.type);
                return (
                  <div
                    key={item._id}
                    onClick={() => !item.isRead && handleMarkRead(item._id)}
                    style={{
                      backgroundColor: item.isRead ? '#ebdcb2' : '#ffffff',
                      borderRadius: '14px',
                      border: `1.5px solid ${item.isRead ? 'rgba(62, 56, 45, 0.12)' : styleInfo.border}`,
                      borderLeft: `5px solid ${styleInfo.border}`,
                      padding: '14px 18px',
                      boxShadow: item.isRead ? 'none' : '0 4px 12px rgba(62, 56, 45, 0.08)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                        <span style={{ fontSize: '22px', lineHeight: 1 }}>{styleInfo.icon}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '700', fontSize: '15px', color: '#3e382d' }}>
                              {item.title}
                            </span>
                            {!item.isRead && (
                              <span style={{
                                backgroundColor: styleInfo.border,
                                color: '#fff',
                                fontSize: '9px',
                                fontWeight: '800',
                                padding: '1px 6px',
                                borderRadius: '8px',
                              }}>
                                NEW
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: '13.5px', color: '#3e382d', margin: '4px 0 6px 0', lineHeight: 1.4 }}>
                            {item.message}
                          </p>

                          {/* Rich metadata display for Program Registrations */}
                          {item.type === 'program_interest' && item.metadata && (
                            <div style={{
                              margin: '6px 0',
                              padding: '6px 10px',
                              backgroundColor: 'rgba(217, 87, 43, 0.06)',
                              borderRadius: '6px',
                              border: '1px dashed rgba(217, 87, 43, 0.25)',
                              fontSize: '11.5px',
                              color: '#5c5243',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '3px',
                            }}>
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {item.metadata.seekerPhone && (
                                  <span>📞 <strong>Phone:</strong> {item.metadata.seekerPhone}</span>
                                )}
                                {item.metadata.preferredLocation && (
                                  <span>📍 <strong>Location:</strong> {item.metadata.preferredLocation}</span>
                                )}
                                {item.metadata.preferredTimeframe && (
                                  <span>⏳ <strong>Timeframe:</strong> {item.metadata.preferredTimeframe}</span>
                                )}
                              </div>
                              {item.metadata.spiritualAspiration && (
                                <div style={{ fontStyle: 'italic', color: '#7e6b53', marginTop: '2px' }}>
                                  "{item.metadata.spiritualAspiration}"
                                </div>
                              )}
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#7e6b53' }}>
                            <span>👤 <strong>{item.userName}</strong> ({item.userEmail})</span>
                            <span>·</span>
                            <span>{formatTime(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.type === 'inactive_high_level' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              if (onOpenShambhaviModal) onOpenShambhaviModal();
                            }}
                            style={{
                              backgroundColor: '#2d7d54',
                              color: '#fff',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                            title="Open Shambhavi Outreach"
                          >
                            📞 Outreach
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDelete(item._id, e)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#a09078',
                            fontSize: '14px',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Delete notification"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px',
          backgroundColor: '#ebdcb2',
          borderTop: '1px solid rgba(62, 56, 45, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '12px', color: '#7e6b53' }}>
            Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#d9572b',
              color: '#ffffff',
              border: 'none',
              padding: '8px 22px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
