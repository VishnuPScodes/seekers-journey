import React, { useState, useEffect } from 'react';
import { X, Search, Phone, Mail, MapPin, Calendar, CheckCircle2, Clock, AlertCircle, Trash2, Filter } from 'lucide-react';
import api from '../api';

const STATUS_OPTIONS = [
  { key: 'all', label: 'All Registrations' },
  { key: 'pending_review', label: '⏳ Pending Review' },
  { key: 'contacted', label: '📞 Contacted' },
  { key: 'approved', label: '✓ Approved' },
  { key: 'waitlisted', label: '📋 Waitlisted' },
];

export default function AdminProgramRegistrationsModal({
  isOpen,
  onClose,
  getAdminToken,
}) {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, contacted: 0, approved: 0, waitlisted: 0 });
  const [loading, setLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRegistrations = async () => {
    if (!isOpen) return;
    try {
      setLoading(true);
      const token = getAdminToken ? getAdminToken() : null;
      const { data } = await api.get('/admin/program-registrations', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setRegistrations(data.registrations || []);
      setStats(data.stats || { total: 0, pending: 0, contacted: 0, approved: 0, waitlisted: 0 });
    } catch (err) {
      console.error('Fetch program registrations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRegistrations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStatusChange = async (regId, newStatus) => {
    try {
      setUpdatingId(regId);
      const token = getAdminToken ? getAdminToken() : null;
      await api.put(`/admin/program-registrations/${regId}`, { status: newStatus }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setRegistrations(prev =>
        prev.map(r => (r._id === regId ? { ...r, status: newStatus } : r))
      );
      // Update quick counts
      setStats(prev => {
        const updated = { ...prev };
        return updated;
      });
    } catch (err) {
      console.error('Update registration status error:', err);
      alert('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (regId) => {
    if (!window.confirm('Are you sure you want to remove this registration record?')) return;
    try {
      const token = getAdminToken ? getAdminToken() : null;
      await api.delete(`/admin/program-registrations/${regId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setRegistrations(prev => prev.filter(r => r._id !== regId));
    } catch (err) {
      console.error('Delete registration error:', err);
      alert('Failed to delete registration.');
    }
  };

  // Filtered registrations
  const filteredRegistrations = registrations.filter(r => {
    if (activeStatus !== 'all' && r.status !== activeStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (r.seekerName || '').toLowerCase().includes(q);
      const emailMatch = (r.seekerEmail || '').toLowerCase().includes(q);
      const progMatch = (r.programName || '').toLowerCase().includes(q);
      const phoneMatch = (r.seekerPhone || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || progMatch || phoneMatch;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { bg: 'rgba(45, 125, 84, 0.12)', color: '#2d7d54', label: '✓ Approved' };
      case 'contacted':
        return { bg: 'rgba(217, 130, 43, 0.12)', color: '#d9822b', label: '📞 Contacted' };
      case 'waitlisted':
        return { bg: 'rgba(126, 107, 83, 0.12)', color: '#7e6b53', label: '📋 Waitlisted' };
      default:
        return { bg: 'rgba(217, 87, 43, 0.12)', color: '#d9572b', label: '⏳ Pending Review' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(44, 38, 31, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fdfbf7',
          border: '1.5px solid rgba(62, 56, 45, 0.25)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 48px rgba(44, 38, 31, 0.3)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(62, 56, 45, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f5ecd7',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🏛️</span>
              <h2
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#3e382d',
                  margin: 0,
                }}
              >
                Advanced Program Registrations
              </h2>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#7e6b53' }}>
              Seeker intake forms and interest inquiries for advanced sadhana immersions.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#7e6b53',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Metrics Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            padding: '16px 24px',
            backgroundColor: '#faf6ee',
            borderBottom: '1px solid rgba(62, 56, 45, 0.1)',
          }}
        >
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(62, 56, 45, 0.12)' }}>
            <span style={{ fontSize: 11, color: '#7e6b53', fontWeight: 700, textTransform: 'uppercase' }}>Total Inquiries</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#3e382d' }}>{stats.total}</div>
          </div>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(217, 87, 43, 0.25)' }}>
            <span style={{ fontSize: 11, color: '#d9572b', fontWeight: 700, textTransform: 'uppercase' }}>Pending Review</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#d9572b' }}>{stats.pending}</div>
          </div>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(217, 130, 43, 0.25)' }}>
            <span style={{ fontSize: 11, color: '#d9822b', fontWeight: 700, textTransform: 'uppercase' }}>Contacted</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#d9822b' }}>{stats.contacted}</div>
          </div>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(45, 125, 84, 0.25)' }}>
            <span style={{ fontSize: 11, color: '#2d7d54', fontWeight: 700, textTransform: 'uppercase' }}>Approved</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2d7d54' }}>{stats.approved}</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(62, 56, 45, 0.1)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7e6b53' }} />
            <input
              type="text"
              placeholder="Search seeker name, email, program, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: 8,
                border: '1px solid rgba(62, 56, 45, 0.2)',
                backgroundColor: '#ffffff',
                fontSize: 13,
                color: '#3e382d',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setActiveStatus(opt.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeStatus === opt.key ? '1.5px solid #3e382d' : '1px solid rgba(62, 56, 45, 0.2)',
                  backgroundColor: activeStatus === opt.key ? '#3e382d' : 'transparent',
                  color: activeStatus === opt.key ? '#ffffff' : '#5c5243',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Registrations List */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#7e6b53' }}>
              <div className="spinner" style={{ margin: '0 auto 12px', borderColor: '#d9572b transparent' }} />
              <p>Retrieving program registrations ledger...</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#7e6b53' }}>
              <span style={{ fontSize: 32 }}>🏛️</span>
              <p style={{ fontSize: 16, fontWeight: 600, margin: '8px 0 4px', color: '#3e382d' }}>
                No Program Registrations Found
              </p>
              <p style={{ fontSize: 13 }}>
                {searchQuery || activeStatus !== 'all'
                  ? 'Try adjusting your filters or search keywords.'
                  : 'Seeker registration interest inquiries will appear here.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredRegistrations.map((reg) => {
                const badge = getStatusBadge(reg.status);
                const regDate = reg.createdAt
                  ? new Date(reg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Recent';

                return (
                  <div
                    key={reg._id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(62, 56, 45, 0.15)',
                      borderRadius: 12,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      boxShadow: '0 2px 8px rgba(62, 56, 45, 0.04)',
                    }}
                  >
                    {/* Top Row: Seeker Info & Program */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#3e382d' }}>
                            {reg.seekerName}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 12,
                              backgroundColor: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 12, color: '#7e6b53', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={12} /> {reg.seekerEmail}
                          </span>
                          {reg.seekerPhone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={12} /> {reg.seekerPhone}
                            </span>
                          )}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} /> Registered: {regDate}
                          </span>
                        </div>
                      </div>

                      {/* Program Pill */}
                      <div
                        style={{
                          backgroundColor: '#f5ecd7',
                          border: '1px solid rgba(62, 56, 45, 0.15)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          textAlign: 'right',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#d9572b' }}>
                          {reg.programName}
                        </div>
                        <div style={{ fontSize: 10, color: '#7e6b53', textTransform: 'uppercase', fontWeight: 600 }}>
                          {reg.prerequisitesStatus || 'Eligible'}
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Intake Preferences */}
                    <div
                      style={{
                        backgroundColor: '#faf6ee',
                        borderRadius: 8,
                        padding: '10px 12px',
                        display: 'flex',
                        gap: 16,
                        fontSize: 12,
                        color: '#5c5243',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} color="#d9572b" />
                        <span><strong>Center:</strong> {reg.preferredLocation || 'Isha Yoga Center, Coimbatore'}</span>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} color="#d9572b" />
                        <span><strong>Timeframe:</strong> {reg.preferredTimeframe || 'Upcoming 1-3 Months'}</span>
                      </div>
                    </div>

                    {/* Aspiration Note */}
                    {reg.spiritualAspiration && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#5c5243',
                          fontStyle: 'italic',
                          borderLeft: '3px solid #d9572b',
                          paddingLeft: 10,
                          margin: '2px 0',
                          lineHeight: 1.45,
                        }}
                      >
                        "{reg.spiritualAspiration}"
                      </div>
                    )}

                    {/* Action Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 8,
                        borderTop: '1px solid rgba(62, 56, 45, 0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#7e6b53', fontWeight: 600 }}>Status:</span>
                        <select
                          value={reg.status}
                          disabled={updatingId === reg._id}
                          onChange={(e) => handleStatusChange(reg._id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid rgba(62, 56, 45, 0.2)',
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: '#fff',
                            color: '#3e382d',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="pending_review">⏳ Pending Review</option>
                          <option value="contacted">📞 Contacted</option>
                          <option value="approved">✓ Approved</option>
                          <option value="waitlisted">📋 Waitlisted</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(reg._id)}
                        title="Delete registration record"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#c5221f',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontSize: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          borderRadius: 4,
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#f5ecd7',
            borderTop: '1px solid rgba(62, 56, 45, 0.15)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 18px',
              borderRadius: 8,
              border: '1px solid rgba(62, 56, 45, 0.25)',
              backgroundColor: '#3e382d',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
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
