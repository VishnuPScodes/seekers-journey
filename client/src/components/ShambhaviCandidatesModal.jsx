import React, { useState, useMemo } from 'react';
import api from '../api';

// ─────────────────────────────────────────────────────────────────────────────
// computeShambhaviReadinessScore
//
// PURPOSE: Given a user record from the admin API, calculate a 0–100 "readiness
// score" that reflects how likely this person is to say YES if invited to learn
// Shambhavi Mahamudra.
//
// We only call this on users who do NOT already practice Shambhavi (isNonMeditator).
//
// The score is a weighted sum of four independent signals:
//
//  1. RECENCY (0–40 pts)  — Were they active recently?
//     A dormant user won't respond to an outreach call. Recency is weighted the
//     highest because engagement freshness is the strongest predictor of openness.
//
//  2. LEVEL (0–25 pts)  — How deep are they on the path?
//     Level is a proxy for seriousness of practice. Someone at level 21+ has
//     accumulated significant sadhana points and is clearly committed — exactly
//     the profile for the next step of Shambhavi.
//
//  3. PRACTICE COMPATIBILITY (0–20 pts)  — Are they already doing Isha practices?
//     Surya Kriya, Angamardana, Sukha Kriya, Upa Yoga, and Pranayama variants
//     are all Isha gateways that do NOT require Shambhavi as a prerequisite.
//     Someone doing these is already in the Isha ecosystem and familiar with the
//     system. NOTE: Shoonya and Samyama are intentionally excluded here because
//     those are advanced practices that require Shambhavi — so anyone doing them
//     already has Shambhavi and would be filtered out by the isNonMeditator check.
//
//  4. TENURE (0–10 pts)  — How long have they been a member?
//     Long-standing seekers are more trustworthy candidates than someone who
//     signed up a week ago. Tenure demonstrates sustained intent.
//
//  5. MANDALA BONUS (+5 pts)  — Are they in an active mandala?
//     An active mandala signals that this person is in a structured, committed
//     40-day practice cycle. High discipline → high readiness.
//
// TOTAL MAX = 100 pts
// ─────────────────────────────────────────────────────────────────────────────
function computeShambhaviReadinessScore(user) {
  let score = 0;
  const reasons = []; // Human-readable explanations shown in the UI

  // ── SIGNAL 1: RECENCY (0–40 pts) ─────────────────────────────────────────
  // daysSinceLastActive is pre-computed on the server in the admin /users endpoint.
  const daysInactive = user.daysSinceLastActive ?? 999;

  if (daysInactive === 0) {
    score += 40;
    reasons.push('⚡ Active today');
  } else if (daysInactive <= 7) {
    score += 35;
    reasons.push(`🔥 Active ${daysInactive}d ago`);
  } else if (daysInactive <= 30) {
    score += 20;
    reasons.push(`✅ Active within 30 days`);
  } else if (daysInactive <= 90) {
    score += 10;
    reasons.push(`🕰️ Active within 90 days`);
  }
  // > 90 days inactive → 0 points (not worth calling)

  // ── SIGNAL 2: LEVEL / DEPTH (0–25 pts) ───────────────────────────────────
  // currentLevel is a 1–108 integer derived from totalCumulativeScore.
  const level = user.currentLevel || 1;

  if (level >= 21) {
    score += 25;
    reasons.push(`🏔️ Level ${level} — Deeply committed`);
  } else if (level >= 11) {
    score += 18;
    reasons.push(`🌿 Level ${level} — Established practice`);
  } else if (level >= 5) {
    score += 10;
    reasons.push(`🌱 Level ${level} — Growing`);
  } else if (level >= 2) {
    score += 5;
    reasons.push(`🪴 Level ${level} — Early stage`);
  }
  // Level 1 → 0 points (just started, no proven commitment yet)

  // ── SIGNAL 3: PRACTICE COMPATIBILITY (0–20 pts, capped) ──────────────────
  // We look at selectedPractices (an array of practice name strings).
  // Each Isha gateway practice adds points — but we cap the total at 20.
  //
  // Practices we look for (all are Isha practices that DON'T need Shambhavi):
  //   • Surya Kriya     → the most aligned pre-Shambhavi practice (+8)
  //   • Sukha Kriya     → gentle breath practice, often paired (+6)
  //   • Upa Yoga        → foundational Isha mobility practice (+6)
  //   • Angamardana     → vigorous Hatha Yoga, shows discipline (+4)
  //   • Yogasanas       → classic posture practice (+4)
  //   • Pranayama variants (Nadi Shuddhi, Bhastrika, Kapalabhati, etc.) (+4)
  //
  // We intentionally EXCLUDE Shoonya and Samyama because those require
  // Shambhavi as a prerequisite — a user doing them already has Shambhavi.
  const practices = (user.selectedPractices || []).map(p => p.toLowerCase());
  let compatScore = 0;

  if (practices.some(p => p.includes('surya kriya'))) {
    compatScore += 8;
    reasons.push('☀️ Practices Surya Kriya');
  }
  if (practices.some(p => p.includes('sukha') || p.includes('upa yoga'))) {
    compatScore += 6;
    reasons.push('🌬️ Practices Sukha Kriya / Upa Yoga');
  }
  if (practices.some(p => p.includes('angamardana'))) {
    compatScore += 4;
    reasons.push('💪 Practices Angamardana');
  }
  if (practices.some(p => p.includes('yogasana'))) {
    compatScore += 4;
    reasons.push('🧘 Practices Yogasanas');
  }
  if (practices.some(p =>
    p.includes('pranayama') || p.includes('nadi') || p.includes('bhastrika') || p.includes('kapalabhati')
  )) {
    compatScore += 4;
    reasons.push('🫁 Practices Pranayama');
  }

  score += Math.min(20, compatScore); // cap at 20

  // ── SIGNAL 4: TENURE (0–10 pts) ──────────────────────────────────────────
  // daysSinceJoining is pre-computed on the server.
  const tenure = user.daysSinceJoining ?? 0;

  if (tenure > 180) {
    score += 10;
    reasons.push(`📅 Member for ${Math.floor(tenure / 30)} months`);
  } else if (tenure > 90) {
    score += 7;
    reasons.push(`📅 Member for ~${Math.floor(tenure / 30)} months`);
  } else if (tenure > 30) {
    score += 4;
    reasons.push('📅 Joined ~1–3 months ago');
  } else {
    score += 1;
    reasons.push('📅 Recent joiner');
  }

  // ── SIGNAL 5: MANDALA BONUS (+5 pts) ─────────────────────────────────────
  // mandalaStatus.active means they are currently in a structured 40-day cycle.
  // This is one of the strongest discipline indicators available in the data.
  if (user.mandalaStatus?.active) {
    score += 5;
    reasons.push('🔮 In active Mandala cycle');
  }

  return { score, reasons };
}

// ─────────────────────────────────────────────────────────────────────────────
// generateCandidateNarrative
//
// PURPOSE: Produce a short, human-readable paragraph (2–3 sentences) explaining
// WHY this specific person is a good candidate to call for Shambhavi outreach.
//
// The narrative synthesises the strongest signals from their profile into plain
// language that the person making the outreach call can actually use — giving
// them context and confidence before they pick up the phone.
//
// Logic: we look at the top 2–3 signals that are TRUE for this user and weave
// them together. We pick the most compelling ones in priority order:
//   1. Recency of activity     (strongest opening — shows they're engaged NOW)
//   2. Practice depth / level  (shows they're serious, not a casual browser)
//   3. Isha gateway practices  (shows they're already in the tradition)
//   4. Tenure                  (shows sustained long-term commitment)
//   5. Mandala status          (shows disciplined structured practice)
// ─────────────────────────────────────────────────────────────────────────────
function generateCandidateNarrative(user, score) {
  const daysInactive  = user.daysSinceLastActive ?? 999;
  const level         = user.currentLevel || 1;
  const tenure        = user.daysSinceJoining ?? 0;
  const practices     = (user.selectedPractices || []).map(p => p.toLowerCase());
  const hasSurya      = practices.some(p => p.includes('surya kriya'));
  const hasSukha      = practices.some(p => p.includes('sukha') || p.includes('upa yoga'));
  const hasAngam      = practices.some(p => p.includes('angamardana'));
  const hasPranayama  = practices.some(p =>
    p.includes('pranayama') || p.includes('nadi') || p.includes('bhastrika') || p.includes('kapalabhati')
  );
  const inMandala     = user.mandalaStatus?.active;
  const firstName     = user.name?.split(' ')[0] || 'This seeker';
  const tenureMonths  = Math.floor(tenure / 30);

  // ── Sentence 1: Activity / Engagement opening ────────────────────────────
  // Start with what tells us they're present and engaged RIGHT NOW.
  let sentence1 = '';
  if (daysInactive === 0) {
    sentence1 = `${firstName} was active on the platform today, which means they are deeply engaged with their practice at this very moment.`;
  } else if (daysInactive <= 3) {
    sentence1 = `${firstName} was active just ${daysInactive} day${daysInactive > 1 ? 's' : ''} ago — they are in an active phase of their sadhana right now.`;
  } else if (daysInactive <= 7) {
    sentence1 = `${firstName} has been consistently active this week, showing that sadhana is a live priority for them.`;
  } else if (daysInactive <= 30) {
    sentence1 = `${firstName} has been active within the last month, indicating they are still on the path and taking their practice seriously.`;
  } else {
    sentence1 = `${firstName} has been on this platform for a while and, while not active every day, has shown clear intent to maintain their sadhana.`;
  }

  // ── Sentence 2: Practice depth + Isha alignment ──────────────────────────
  // Tell the caller WHAT this person is already doing — so the call feels
  // like a natural next step, not a cold pitch.
  let sentence2 = '';
  const alignedPractices = [];
  if (hasSurya)     alignedPractices.push('Surya Kriya');
  if (hasSukha)     alignedPractices.push('Sukha Kriya / Upa Yoga');
  if (hasAngam)     alignedPractices.push('Angamardana');
  if (hasPranayama) alignedPractices.push('Pranayama');

  if (alignedPractices.length > 0 && level >= 5) {
    const practiceList = alignedPractices.join(' and ');
    sentence2 = `At Level ${level}, they are already practising ${practiceList} — these are foundational Isha practices that sit just one step below Shambhavi, making this a natural progression for them.`;
  } else if (alignedPractices.length > 0) {
    const practiceList = alignedPractices.join(' and ');
    sentence2 = `They are already practising ${practiceList}, which shows familiarity with the Isha system and places them in exactly the right space to explore Shambhavi Mahamudra.`;
  } else if (level >= 21) {
    sentence2 = `At Level ${level}, they have accumulated significant sadhana depth — their commitment to the practice is well proven, and Shambhavi is the natural next leap.`;
  } else if (level >= 11) {
    sentence2 = `Reaching Level ${level} is not easy; it reflects real consistency and dedication. That kind of seeker is usually very open to deepening their practice.`;
  } else {
    sentence2 = `They have been steadily building their practice and have shown enough consistency to suggest they are ready to take a more structured step.`;
  }

  // ── Sentence 3: Closing context — tenure or mandala ──────────────────────
  // End with something that frames them as a committed, long-term seeker — not
  // a casual user who downloaded the app and forgot about it.
  let sentence3 = '';
  if (inMandala) {
    sentence3 = `They are currently in an active 40-day Mandala cycle, which is the strongest possible signal of discipline and readiness — someone in a mandala has already committed to showing up every day.`;
  } else if (tenureMonths >= 6) {
    sentence3 = `Having been with this community for over ${tenureMonths} months, they are a familiar face on the path — not someone exploring casually, but someone who has stayed.`;
  } else if (tenureMonths >= 3) {
    sentence3 = `They joined ${tenureMonths} months ago and have kept coming back, which tells you this is not a passing interest.`;
  } else if (score >= 70) {
    sentence3 = `Their overall readiness score of ${score}/100 is one of the highest among all non-Shambhavi seekers — trust the data, this is a good call to make.`;
  } else {
    sentence3 = `While they are still early in their journey, the combination of activity and practice alignment puts them ahead of most other candidates at this stage.`;
  }

  return `${sentence1} ${sentence2} ${sentence3}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// getTop5ShambhaviCandidates
//
// Filters only non-meditators (isNonMeditator === true), scores each one,
// sorts descending by score, then returns the top 5 with narrative attached.
//
// EXCLUSION RULE: If shambhaviOutreachContactedAt is set and fewer than 30
// days have passed since that date, the user is excluded from the list.
// They re-appear automatically once 30 days have elapsed.
// ─────────────────────────────────────────────────────────────────────────────
const COOLDOWN_DAYS = 30;

function getTop5ShambhaviCandidates(users) {
  const now = new Date();

  return users
    .filter(u => u.isNonMeditator) // Only those who don't already do Shambhavi
    .filter(u => {
      // Exclude users contacted within the last 30 days
      if (!u.shambhaviOutreachContactedAt) return true;
      const contactedDate = new Date(u.shambhaviOutreachContactedAt);
      const daysSinceContact = Math.floor((now - contactedDate) / (1000 * 60 * 60 * 24));
      return daysSinceContact >= COOLDOWN_DAYS;
    })
    .map(u => {
      const { score, reasons } = computeShambhaviReadinessScore(u);
      // Generate narrative AFTER scoring so we can pass the score into it
      const narrative = generateCandidateNarrative(u, score);
      return { ...u, score, reasons, narrative };
    })
    .sort((a, b) =>
      b.score - a.score ||
      // Tiebreaker: prefer the more recently active user
      (a.daysSinceLastActive ?? 999) - (b.daysSinceLastActive ?? 999)
    )
    .slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// ShambhaviCandidatesModal Component
//
// Props:
//   users            — full user list from admin API (includes shambhaviOutreachContactedAt)
//   getAdminToken    — function that returns the current admin JWT
//   onUserContacted  — callback so the parent (AdminDashboard) can re-fetch users after
//                      a contact is recorded, keeping the list fresh
// ─────────────────────────────────────────────────────────────────────────────
export default function ShambhaviCandidatesModal({ isOpen, onClose, users = [], getAdminToken, onUserContacted }) {
  const candidates = useMemo(() => getTop5ShambhaviCandidates(users), [users]);

  // Track which userId is mid-API-call so we can show a loading state on the button
  const [contactingId, setContactingId] = useState(null);
  // Track per-card error messages keyed by candidate.id
  const [contactErrors, setContactErrors] = useState({});

  if (!isOpen) return null;

  // ── handleContact ─────────────────────────────────────────────────────────
  // Called when the admin clicks "Contact" on a candidate card.
  // 1. Calls the backend to stamp shambhaviOutreachContactedAt = now on that user.
  // 2. Tells the parent (AdminDashboard) to re-fetch all users from the server.
  //    This causes useMemo to re-run getTop5ShambhaviCandidates with fresh data,
  //    which now excludes the contacted person and surfaces the next best candidate.
  const handleContact = async (candidate) => {
    setContactingId(candidate.id);
    setContactErrors(prev => ({ ...prev, [candidate.id]: '' }));
    try {
      const token = getAdminToken ? getAdminToken() : null;
      await api.post(
        `/admin/users/${candidate.id}/mark-contacted`,
        {},
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      // Ask the parent to reload users — the contacted user will then have
      // shambhaviOutreachContactedAt set, so they'll be filtered out of the
      // candidate list automatically via the 30-day cooldown rule.
      if (onUserContacted) onUserContacted();
    } catch (err) {
      console.error('Mark contacted error:', err);
      setContactErrors(prev => ({
        ...prev,
        [candidate.id]: `Could not record contact for ${candidate.name}. Please try again.`,
      }));
    } finally {
      setContactingId(null);
    }
  };

  // Score bar colour: green for high, amber for mid, muted for low
  const scoreColor = (score) => {
    if (score >= 70) return '#2d7d54';
    if (score >= 45) return '#d9a02b';
    return '#7e6b53';
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
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        fontFamily: '"Inter", sans-serif',
        color: '#3e382d',
        position: 'relative',
      }}>

        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: '1.5px solid rgba(217, 87, 43, 0.2)',
          paddingBottom: '16px',
          marginBottom: '20px',
          gap: '12px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>🪷</span>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '26px',
                fontWeight: '700',
                margin: 0,
                color: '#3e382d',
              }}>
                Shambhavi Outreach List
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#7e6b53', margin: '6px 0 0 0', lineHeight: 1.5 }}>
              Top 5 seekers most ready to learn <strong>Shambhavi Mahamudra</strong>.<br />
              Scored by recency, practice depth, Isha alignment, and tenure.
            </p>
          </div>
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
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Candidate Cards ────────────────────────────────────────────── */}
        {candidates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#7e6b53',
            fontSize: '15px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌿</div>
            No eligible candidates found. All seekers may already practice Shambhavi.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {candidates.map((candidate, idx) => (
              <div
                key={candidate.id}
                style={{
                  backgroundColor: '#f4efd8',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(62, 56, 45, 0.12)',
                  padding: '16px 18px',
                  boxShadow: '0 2px 8px rgba(62, 56, 45, 0.06)',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

                  {/* Rank Badge */}
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: idx === 0 ? '#d9572b' : idx === 1 ? '#c4782a' : '#a09078',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>

                  {/* Name & Contact */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#3e382d' }}>
                      {candidate.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#7e6b53',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {candidate.email}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a09078', marginTop: '2px' }}>
                      {[candidate.city, candidate.region].filter(Boolean).join(', ')} · Lvl {candidate.currentLevel}
                    </div>
                  </div>

                  {/* Readiness Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '26px',
                      fontWeight: '800',
                      color: scoreColor(candidate.score),
                      lineHeight: 1,
                    }}>
                      {candidate.score}
                    </div>
                    <div style={{ fontSize: '10px', color: '#7e6b53', fontWeight: '600', marginTop: '2px' }}>
                      / 100
                    </div>
                    {/* Visual score bar */}
                    <div style={{
                      width: '60px',
                      height: '4px',
                      backgroundColor: 'rgba(62, 56, 45, 0.12)',
                      borderRadius: '2px',
                      marginTop: '5px',
                    }}>
                      <div style={{
                        width: `${candidate.score}%`,
                        height: '100%',
                        backgroundColor: scoreColor(candidate.score),
                        borderRadius: '2px',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                </div>

                {/* Why Reasons — compact signal chips */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(62, 56, 45, 0.08)',
                }}>
                  {candidate.reasons.map((reason, rIdx) => (
                    <span
                      key={rIdx}
                      style={{
                        backgroundColor: 'rgba(217, 87, 43, 0.08)',
                        border: '1px solid rgba(217, 87, 43, 0.18)',
                        color: '#6e5a42',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      {reason}
                    </span>
                  ))}
                </div>

                {/* Outreach Narrative — plain-language summary for the caller */}
                {candidate.narrative && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(45, 125, 84, 0.06)',
                    border: '1px solid rgba(45, 125, 84, 0.18)',
                    borderRadius: '10px',
                    borderLeft: '3px solid #2d7d54',
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#2d7d54',
                      marginBottom: '6px',
                    }}>
                      💬 Why reach out to them
                    </div>
                    <p style={{
                      fontSize: '12.5px',
                      lineHeight: '1.65',
                      color: '#3e382d',
                      margin: 0,
                      fontStyle: 'italic',
                    }}>
                      {candidate.narrative}
                    </p>
                  </div>
                )}

                {/* Contact Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '12px', gap: '10px' }}>
                  {contactErrors[candidate.id] && (
                    <span style={{ fontSize: '11px', color: '#c5221f' }}>{contactErrors[candidate.id]}</span>
                  )}
                  <button
                    onClick={() => handleContact(candidate)}
                    disabled={contactingId === candidate.id}
                    title="Mark as contacted — hides this person for 30 days"
                    style={{
                      backgroundColor: contactingId === candidate.id ? '#a09078' : '#2d7d54',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: contactingId === candidate.id ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(45, 125, 84, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {contactingId === candidate.id ? (
                      <>⏳ Saving...</>
                    ) : (
                      <>📞 Contact</>  
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer Tip ─────────────────────────────────────────────────── */}
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          backgroundColor: 'rgba(45, 125, 84, 0.08)',
          borderRadius: '10px',
          border: '1px solid rgba(45, 125, 84, 0.2)',
          fontSize: '12px',
          color: '#2d7d54',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
        }}>
          <span>💡</span>
          <span>
            These seekers score highest on activity, practice depth, and Isha alignment.
            Reach out personally — a call works better than a message for something this meaningful.
          </span>
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#d9572b',
              color: '#ffffff',
              border: 'none',
              padding: '10px 28px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(217, 87, 43, 0.3)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
