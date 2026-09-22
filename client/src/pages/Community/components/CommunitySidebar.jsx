import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Shield, Calendar, Sparkles, Search, ArrowRight } from 'lucide-react';
import UpcomingGatheringsWidget from './UpcomingGatheringsWidget';

export default function CommunitySidebar({
  user,
  sidebarData,
  onFollowToggle,
  onSanghaJoinToggle,
  onSwitchToSeekersTab,
  onSeekerClick,
}) {
  const [activeCircleTab, setActiveCircleTab] = useState('circles'); // 'circles' | 'gatherings'
  const [filterSeekerText, setFilterSeekerText] = useState('');

  const stats = sidebarData?.stats || {
    followingCount: 0,
    followersCount: 0,
    sanghasCount: 0,
  };

  const recommendedSanghas = sidebarData?.recommendedSanghas || [];
  const suggestedSeekers = sidebarData?.suggestedSeekers || [];

  const filteredSeekers = suggestedSeekers.filter((s) =>
    (s.name || '').toLowerCase().includes(filterSeekerText.toLowerCase())
  );

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'S';

  const currentUserId = user?._id || user?.id;

  return (
    <aside className="comm-sidebar" aria-label="Community navigation and companions">
      {/* ── 1. Compact Seeker Presence Card ── */}
      <div className="comm-sidebar-card comm-presence-card">
        <div
          className="comm-presence-header"
          onClick={() => onSeekerClick && currentUserId && onSeekerClick(currentUserId)}
          role={onSeekerClick ? 'button' : undefined}
          tabIndex={onSeekerClick ? 0 : undefined}
          title={onSeekerClick ? 'View your spiritual profile scroll' : undefined}
          style={{ cursor: onSeekerClick ? 'pointer' : 'default' }}
        >
          <div className="comm-presence-avatar">{userInitials}</div>
          <div className="comm-presence-meta">
            <div className="comm-presence-name">
              {user?.name || 'Seeker'}
              <span style={{ fontSize: '0.75rem', marginLeft: 6, color: 'var(--comm-terracotta)', fontWeight: 500 }}>
                View ↗
              </span>
            </div>
            <div className="comm-presence-tag">
              Level {user?.currentLevel || 1} • {user?.pradakshinaCount || 0} Pradakshinas
            </div>
          </div>
        </div>

        {/* Counts Row */}
        <div className="comm-presence-stats">
          <div className="comm-stat-cell">
            <span className="comm-stat-val">{stats.followingCount}</span>
            <span className="comm-stat-lbl">Walking With</span>
          </div>
          <div className="comm-stat-cell-divider" />
          <div className="comm-stat-cell">
            <span className="comm-stat-val">{stats.followersCount}</span>
            <span className="comm-stat-lbl">Companions</span>
          </div>
          <div className="comm-stat-cell-divider" />
          <div className="comm-stat-cell">
            <span className="comm-stat-val">{stats.sanghasCount}</span>
            <span className="comm-stat-lbl">Circles</span>
          </div>
        </div>
      </div>

      {/* ── 2. Unified Circles & Gatherings Widget (Tabbed to eliminate clutter) ── */}
      <div className="comm-sidebar-card">
        <div className="comm-tabbed-widget-header">
          <button
            type="button"
            className={`comm-widget-tab-btn ${activeCircleTab === 'circles' ? 'active' : ''}`}
            onClick={() => setActiveCircleTab('circles')}
          >
            <Shield size={14} />
            <span>Circles ({recommendedSanghas.length})</span>
          </button>
          <button
            type="button"
            className={`comm-widget-tab-btn ${activeCircleTab === 'gatherings' ? 'active' : ''}`}
            onClick={() => setActiveCircleTab('gatherings')}
          >
            <Calendar size={14} />
            <span>Gatherings</span>
          </button>
        </div>

        {activeCircleTab === 'circles' ? (
          <div>
            {recommendedSanghas.length === 0 ? (
              <div style={{ fontSize: '0.84rem', color: 'var(--comm-text-muted)', padding: '8px 0' }}>
                No active circles currently listed.
              </div>
            ) : (
              <div className="comm-sidebar-list">
                {recommendedSanghas.slice(0, 4).map((s) => (
                  <div key={s._id} className="comm-sidebar-item">
                    <div className="comm-item-left">
                      <div className="comm-circle-mini-icon">🏛️</div>
                      <div className="comm-item-meta">
                        <div className="comm-item-name" title={s.name}>{s.name}</div>
                        <div className="comm-item-sub">
                          {s.membersCount || 1} seekers • {s.type}
                        </div>
                      </div>
                    </div>

                    <button
                      className={`comm-btn-small ${s.isMember ? 'joined' : ''}`}
                      onClick={() => onSanghaJoinToggle(s._id)}
                      id={`sangha-join-btn-${s._id}`}
                    >
                      {s.isMember ? 'Joined' : 'Join'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--comm-border-hairline)', textAlign: 'center' }}>
              <Link
                to="/community/sanghas"
                className="comm-link-accent"
                id="sidebar-browse-all-sanghas"
              >
                Browse All Circles Directory <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ) : (
          <UpcomingGatheringsWidget isEmbedded />
        )}
      </div>

      {/* ── 3. Walk Together (With Live Search & Quick Filter) ── */}
      <div className="comm-sidebar-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 className="comm-sidebar-title" style={{ margin: 0 }}>
            <Users size={16} color="var(--comm-terracotta)" />
            <span>Walk Together</span>
          </h3>

          {onSwitchToSeekersTab && (
            <button
              type="button"
              onClick={onSwitchToSeekersTab}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.78rem',
                color: 'var(--comm-terracotta)',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 6px',
              }}
              title="Open full seeker search sanctuary"
            >
              Search All →
            </button>
          )}
        </div>

        {/* Live Filter Input for Quick Matching */}
        <div className="comm-sidebar-search-wrap">
          <Search size={14} className="comm-sidebar-search-icon" />
          <input
            type="text"
            className="comm-sidebar-search-input"
            placeholder="Filter companions..."
            value={filterSeekerText}
            onChange={(e) => setFilterSeekerText(e.target.value)}
          />
        </div>

        {filteredSeekers.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: 'var(--comm-text-muted)', padding: '10px 0' }}>
            {filterSeekerText ? `No matches for "${filterSeekerText}"` : 'All fellow seekers are in your circle.'}
          </div>
        ) : (
          <div className="comm-sidebar-list">
            {filteredSeekers.slice(0, 4).map((seeker) => {
              const sInitials = (seeker.name || 'S')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div key={seeker._id} className="comm-sidebar-item">
                  <div
                    className="comm-item-left"
                    onClick={() => onSeekerClick && onSeekerClick(seeker._id)}
                    role={onSeekerClick ? 'button' : undefined}
                    tabIndex={onSeekerClick ? 0 : undefined}
                    title={onSeekerClick ? `View ${seeker.name}'s spiritual profile` : undefined}
                    style={{ cursor: onSeekerClick ? 'pointer' : 'default' }}
                  >
                    <div className="comm-mini-avatar">{sInitials}</div>
                    <div className="comm-item-meta">
                      <div className="comm-item-name">{seeker.name}</div>
                      <div className="comm-item-sub">
                        Level {seeker.currentLevel || 1} Seeker
                      </div>
                    </div>
                  </div>

                  <button
                    className={`comm-btn-small ${seeker.isFollowing ? 'following' : ''}`}
                    onClick={() => onFollowToggle(seeker._id)}
                    id={`follow-toggle-btn-${seeker._id}`}
                  >
                    {seeker.isFollowing ? 'Walking' : 'Walk With'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. Ethereal Sacred Manuscript Inscription ── */}
      <div className="comm-ethos-banner">
        <div className="comm-ethos-lotus">🪷</div>
        <p className="comm-ethos-text">
          "A sangha is not a crowd. It is individuals walking their sacred path in parallel, offering quiet encouragement."
        </p>
      </div>
    </aside>
  );
}
