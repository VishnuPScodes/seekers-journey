import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Sparkles, MessageCircle, UserPlus, Shield } from 'lucide-react';
import api from '../../../api';

export default function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/community/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1-minute silent refresh
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/community/notifications/read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'kudos':
        return '🙏';
      case 'comment':
        return '💬';
      case 'follow':
        return '🕊️';
      case 'sangha_join':
        return '🏛️';
      default:
        return '✨';
    }
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="comm-action-btn"
        style={{
          position: 'relative',
          background: isOpen ? 'var(--comm-gold-light)' : 'var(--comm-bg-card)',
          border: '1px solid var(--comm-border-hairline)',
          padding: '8px 12px',
          borderRadius: 'var(--comm-radius-pill)',
        }}
        aria-label="Spiritual notifications"
        id="community-bell-btn"
      >
        <Bell size={17} color="var(--comm-terracotta)" />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: 'var(--comm-terracotta)',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 700,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(217, 87, 43, 0.35)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 320,
            background: '#fffdf7',
            border: '1px solid var(--comm-border-gold)',
            borderRadius: 'var(--comm-radius-md)',
            boxShadow: '0 8px 30px rgba(44, 38, 31, 0.16)',
            zIndex: 1200,
            padding: '12px 14px',
          }}
          id="community-notifications-popover"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--comm-border-hairline)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--comm-text-charcoal)' }}>
              Sacred Whispers & Updates
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.74rem',
                  color: 'var(--comm-terracotta)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.84rem', color: 'var(--comm-text-muted)' }}>
              All is quiet in your circle.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {notifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: n.isRead ? 'transparent' : 'var(--comm-gold-light)',
                    border: '1px solid',
                    borderColor: n.isRead ? 'transparent' : 'var(--comm-border-gold)',
                    fontSize: '0.84rem',
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{getIcon(n.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--comm-text-charcoal)', fontWeight: n.isRead ? 400 : 600 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--comm-text-light)', marginTop: 2 }}>
                      {getRelativeTime(n.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
