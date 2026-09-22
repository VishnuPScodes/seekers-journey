import React, { useState } from 'react';
import { MessageCircle, Share2, Globe, Users, Shield, Send, Check, Flag, Trash2 } from 'lucide-react';
import api from '../../../api';

export default function PostCard({ post, currentUserId, onKudosToggle, onPostDeleted, onAuthorClick }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flagged, setFlagged] = useState(post.status === 'flagged');
  const [deleted, setDeleted] = useState(false);

  // Author details
  const author = post.authorId || {};
  const authorName = author.name || 'Fellow Seeker';
  const authorLevel = author.currentLevel || 1;
  const authorInitials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Relative time helper
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Fetch comments when drawer opens
  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/community/posts/${post._id}/comments`);
        setComments(res.data.comments || []);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Submit comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/community/posts/${post._id}/comments`, {
        body: newCommentText.trim(),
      });
      if (res.data && res.data.comment) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewCommentText('');
        // increment local count
        post.commentsCount = (post.commentsCount || 0) + 1;
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Share post link
  const handleShare = () => {
    const url = window.location.origin + '/community';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAuthor =
    currentUserId &&
    author._id &&
    author._id.toString() === currentUserId.toString();

  const handleFlag = async () => {
    try {
      await api.post(`/community/posts/${post._id}/flag`);
      setFlagged(true);
    } catch (err) {
      console.error('Failed to flag post:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Withdraw this reflection from the community?')) return;
    try {
      await api.delete(`/community/posts/${post._id}`);
      setDeleted(true);
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  if (deleted) return null;

  // Post Type Tag Text
  const renderPostTypeTag = () => {
    switch (post.type) {
      case 'metric':
        return '🪷 Sadhana Completed';
      case 'milestone':
        return '🏔️ Milestone Reached';
      case 'experience':
        return '🌅 Sacred Experience';
      case 'photo':
        return '📸 Sacred Moments';
      default:
        return '🕊️ Reflection';
    }
  };

  const hasSharedEntity =
    post.sharedEntity &&
    post.sharedEntity.entityType &&
    post.sharedEntity.entityType !== 'none';

  return (
    <article className="comm-post-card" id={`post-${post._id}`}>
      {/* ── Header ── */}
      <header className="comm-post-header">
        <div
          className="comm-post-author-block"
          onClick={() => onAuthorClick && author._id && onAuthorClick(author._id)}
          role={onAuthorClick ? 'button' : undefined}
          tabIndex={onAuthorClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (onAuthorClick && author._id && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onAuthorClick(author._id);
            }
          }}
          title={onAuthorClick ? `View ${authorName}'s spiritual profile` : undefined}
          style={{ cursor: onAuthorClick ? 'pointer' : 'default' }}
        >
          <div className="comm-avatar-circle" title={authorName}>
            {authorInitials}
          </div>
          <div className="comm-author-meta">
            <div className="comm-author-name-row">
              <span className="comm-author-name">{authorName}</span>
              <span className="comm-level-badge">Level {authorLevel} Seeker</span>
            </div>
            <div className="comm-post-time-row">
              <span>{getRelativeTime(post.createdAt)}</span>
              <span>•</span>
              {post.visibility === 'public' ? (
                <span title="Shared publicly" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Globe size={12} /> Public
                </span>
              ) : (
                <span title="Shared with followers" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Users size={12} /> Followers
                </span>
              )}
              {post.sanghaId && (
                <>
                  <span>•</span>
                  <span className="comm-sangha-tag">
                    <Shield size={12} /> {post.sanghaId.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <span className="comm-post-type-tag">{renderPostTypeTag()}</span>
      </header>

      {/* ── Content Body ── */}
      {post.body && <div className="comm-post-body">{post.body}</div>}

      {/* ── Shared Journey Entity Block (Recorded on Path) ── */}
      {hasSharedEntity && (
        <div className="comm-shared-entity-card">
          <div className="comm-shared-icon-box">
            {post.sharedEntity.icon || '🪷'}
          </div>
          <div className="comm-shared-details">
            <div className="comm-shared-eyebrow">Logged in Seeker's Journey</div>
            <h4 className="comm-shared-title">{post.sharedEntity.title}</h4>
            {post.sharedEntity.subtitle && (
              <div className="comm-shared-subtitle">{post.sharedEntity.subtitle}</div>
            )}
          </div>
          {post.sharedEntity.metricValue && (
            <div className="comm-shared-metric-pill">
              {post.sharedEntity.metricValue}
            </div>
          )}
        </div>
      )}

      {/* ── Media Images ── */}
      {post.media && post.media.length > 0 && (
        <div className="comm-post-media">
          <img src={post.media[0].url} alt={post.media[0].caption || 'Community post media'} loading="lazy" />
        </div>
      )}

      {/* ── Action Bar (Strava-inspired Spiritual Kudos) ── */}
      <footer className="comm-post-actions">
        <div className="comm-actions-left">
          <button
            className={`comm-kudos-btn ${post.hasKudos ? 'active' : ''}`}
            onClick={() => onKudosToggle(post._id)}
            title="Offer Kudos (Namaskaram)"
            id={`kudos-btn-${post._id}`}
          >
            <span className="comm-kudos-emoji">🙏</span>
            <span>
              {post.hasKudos ? 'Offered' : 'Kudos'}{' '}
              <strong>({post.kudosCount || 0})</strong>
            </span>
          </button>

          <button
            className="comm-action-btn"
            onClick={handleToggleComments}
            title="Reflections & Discussion"
            id={`comments-btn-${post._id}`}
          >
            <MessageCircle size={16} />
            <span>
              {post.commentsCount || 0}{' '}
              {post.commentsCount === 1 ? 'Reflection' : 'Reflections'}
            </span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="comm-action-btn"
            onClick={handleShare}
            title="Share Reflection Link"
            id={`share-btn-${post._id}`}
          >
            {copied ? <Check size={16} color="#4e6346" /> : <Share2 size={16} />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          {isAuthor ? (
            <button
              className="comm-action-btn"
              onClick={handleDelete}
              title="Withdraw reflection"
              style={{ color: '#b4421b' }}
              id={`delete-post-btn-${post._id}`}
            >
              <Trash2 size={15} />
            </button>
          ) : (
            <button
              className="comm-action-btn"
              onClick={handleFlag}
              title={flagged ? 'Flagged for moderation' : 'Flag for review'}
              style={{ color: flagged ? '#b4421b' : 'var(--comm-text-light)' }}
              id={`flag-post-btn-${post._id}`}
            >
              <Flag size={14} />
            </button>
          )}
        </div>
      </footer>

      {/* ── Comments Drawer ── */}
      {showComments && (
        <section className="comm-comments-drawer" aria-label="Reflections discussion">
          {loadingComments ? (
            <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.86rem', color: 'var(--comm-text-muted)' }}>
              Gathering reflections...
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.84rem', color: 'var(--comm-text-muted)' }}>
              No reflections yet. Be the first to offer encouragement!
            </div>
          ) : (
            <div className="comm-comments-list">
              {comments.map((c) => {
                const cUser = c.userId || {};
                const cInitials = (cUser.name || 'S')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div key={c._id} className="comm-comment-item">
                    <div className="comm-comment-avatar">{cInitials}</div>
                    <div className="comm-comment-content">
                      <div className="comm-comment-header">
                        <span className="comm-comment-author">{cUser.name || 'Seeker'}</span>
                        <span className="comm-comment-time">{getRelativeTime(c.createdAt)}</span>
                      </div>
                      <div className="comm-comment-body">{c.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Inline Comment Composer */}
          <form onSubmit={handleAddComment} className="comm-comment-composer">
            <input
              type="text"
              placeholder="Share your reflection or words of encouragement..."
              className="comm-comment-input"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              id={`comment-input-${post._id}`}
            />
            <button
              type="submit"
              disabled={!newCommentText.trim() || submittingComment}
              className="comm-comment-submit"
              id={`comment-submit-${post._id}`}
            >
              <Send size={14} />
            </button>
          </form>
        </section>
      )}
    </article>
  );
}
