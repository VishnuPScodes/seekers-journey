import React, { useState, useEffect } from 'react';
import { Quote, Sparkles, ExternalLink } from 'lucide-react';
import api from '../api';

export default function SadhguruDailyQuote() {
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchQuote = async () => {
      try {
        const { data } = await api.get('/insights/sadhguru-quote');
        if (isMounted && data.success && data.quote) {
          setQuoteData(data.quote);
        }
      } catch (err) {
        console.error('Failed to load Sadhguru quote:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuote();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div
        className="glass-card quote-skeleton-card animate-pulse"
        style={{
          padding: '20px 24px',
          marginBottom: 24,
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(217, 87, 43, 0.08), rgba(184, 67, 27, 0.04))',
          border: '1px solid rgba(217, 87, 43, 0.18)',
          minHeight: 110,
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          gap: 12
        }}
      >
        <Sparkles size={18} className="animate-spin" style={{ color: '#d9572b', opacity: 0.6 }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif' }}>
          Fetching Daily Wisdom from Sadhguru...
        </span>
      </div>
    );
  }

  const quote = quoteData || {
    title: 'Daily Wisdom',
    text: 'The seed of Enlightenment is there in every being. Enlightenment is a realization.',
    imageUrl: 'https://static.sadhguru.org/d/46272/1790128806-image_1790068446_9792.jpg',
    url: 'https://isha.sadhguru.org/en/wisdom/type/quotes'
  };

  return (
    <div
      className="sadhguru-quote-container animate-in"
      style={{
        marginBottom: 24,
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div
        className="sadhguru-quote-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(42, 24, 18, 0.92) 0%, rgba(24, 15, 12, 0.96) 100%)',
          boxShadow: '0 12px 36px rgba(217, 87, 43, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(217, 87, 43, 0.3)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Background glow & subtle accent */}
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            right: '-10%',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(217, 87, 43, 0.22) 0%, rgba(0, 0, 0, 0) 70%)',
            pointerEvents: 'none',
            borderRadius: '50%',
          }}
        />

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Quote Image thumbnail if available */}
          {quote.imageUrl && (
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                border: '2px solid rgba(229, 169, 60, 0.6)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              }}
            >
              <img
                src={quote.imageUrl}
                alt="Sadhguru Daily Quote"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Quote Text & Info */}
          <div style={{ flex: 1, minWidth: 220 }}>
            {/* Quote Body */}

            <div style={{ position: 'relative', paddingLeft: 22, marginTop: 6 }}>
              <Quote
                size={16}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 2,
                  color: '#e5a93c',
                  opacity: 0.7,
                  transform: 'scaleX(-1)',
                }}
              />
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: '#fceee6',
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontWeight: 600,
                  letterSpacing: '0.2px',
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                "{quote.text}"
              </p>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#e5a93c',
                  textAlign: 'right',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                — Sadhguru
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
