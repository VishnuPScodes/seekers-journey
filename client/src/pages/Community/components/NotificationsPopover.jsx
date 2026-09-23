import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Sparkles, MessageCircle, UserPlus, Shield, ArrowRight } from 'lucide-react';
import api from '../../../api';

export default function NotificationsPopover() {
  const navigate = useNavigate();
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

  const handleNotificationClick = async (n) => {
    // Mark as read in backend
    if (!n.isRead) {
      try {
        await api.post(`/community/notifications/${n._id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        console.error('Failed to mark notification read:', e);
      }
    }

    setIsOpen(false);

    const actorUserId = n.actorId?._id || n.actorId;
    const targetSanghaId =
      (n.sanghaId && typeof n.sanghaId === 'object' ? n.sanghaId._id : n.sanghaId) ||
      (n.entityType === 'Sangha' ? n.entityId : null);
    const targetGatheringId =
      (n.gatheringId && typeof n.gatheringId === 'object' ? n.gatheringId._id : n.gatheringId) ||
      (n.entityType === 'SanghaEvent' ? n.entityId : null) ||
      (n.type === 'gathering_rsvp' ? n.entityId : null);

    const isGatheringJoinRequest =
      (n.type === 'gathering_rsvp' && n.message && n.message.includes('requested to join')) ||
      (n.message && n.message.includes('requested to join your sacred gathering'));

    const isCircleJoinRequest =
      n.type === 'join_request' ||
      (n.message && n.message.includes('requested to join your circle'));

    if (isGatheringJoinRequest) {
      const userParam = actorUserId ? `&userId=${actorUserId}` : '';
      if (targetGatheringId) {
        navigate(`/community/gatherings/${targetGatheringId}?tab=requests${userParam}`);
      } else {
        navigate('/community/gatherings');
      }
    } else if (isCircleJoinRequest) {
      const userParam = actorUserId ? `&userId=${actorUserId}` : '';
      if (targetSanghaId) {
        navigate(`/community/circles/${targetSanghaId}?tab=requests${userParam}`);
      } else {
        navigate('/community/circles');
      }
    } else if (n.type === 'join_approved') {
      if (targetSanghaId) {
        navigate(`/community/circles/${targetSanghaId}`);
      } else {
        navigate('/community/circles');
      }
    } else if (
      n.type === 'gathering_rsvp' ||
      n.entityType === 'SanghaEvent' ||
      (n.message && n.message.includes('sacred gathering'))
    ) {
      if (targetGatheringId) {
        navigate(`/community/gatherings/${targetGatheringId}`);
      } else {
        navigate('/community/gatherings');
      }
    } else if (n.type === 'sangha_join') {
      if (targetSanghaId) {
        navigate(`/community/circles/${targetSanghaId}`);
      } else {
        navigate('/community/circles');
      }
    } else {
      navigate('/community');
    }
  };

  const getIcon = (n) => {
    if (
      (n.type === 'gathering_rsvp' && n.message && n.message.includes('requested to join')) ||
      (n.message && n.message.includes('requested to join your sacred gathering'))
    ) {
      return '🏔️';
    }
    if (n.type === 'join_request' || (n.message && n.message.includes('requested to join your circle'))) {
      return '🛡️';
    }
    switch (n.type) {
      case 'kudos':
        return '🙏';
      case 'comment':
        return '💬';
      case 'follow':
        return '🕊️';
      case 'join_request':
        return '🛡️';
      case 'join_approved':
        return '✨';
      case 'sangha_join':
        return '🏛️';
      case 'gathering_rsvp':
        return '🏔️';
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
            width: 340,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(n);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: n.isRead ? 'rgba(255, 255, 255, 0.7)' : 'var(--comm-gold-light)',
                    border: '1px solid',
                    borderColor: n.isRead ? 'rgba(0, 0, 0, 0.05)' : 'var(--comm-border-gold)',
                    fontSize: '0.84rem',
                    lineHeight: 1.4,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="comm-notification-item"
                >
                  <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 2 }}>{getIcon(n)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--comm-text-charcoal)', fontWeight: n.isRead ? 400 : 600 }}>
                      {n.message}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--comm-text-light)' }}>
                        {getRelativeTime(n.createdAt)}
                      </span>
                      {(n.type === 'join_request' ||
                        (n.type === 'gathering_rsvp' && n.message && n.message.includes('requested to join')) ||
                        (n.message && n.message.includes('requested to join your sacred gathering')) ||
                        (n.message && n.message.includes('requested to join your circle'))) && (
                        <span style={{
                          fontSize: '0.72rem',
                          color: '#b85d36',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          background: 'rgba(217, 87, 43, 0.1)',
                          padding: '2px 8px',
                          borderRadius: 12
                        }}>
                          Review Request <ArrowRight size={11} />
                        </span>
                      )}
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
