import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getBadgeText, getBadgeColor } from '../utils/badgeStrings';
import { useGILocations } from '../context/GILocationsContext';
import SafeImage from './SafeImage';
import '../styles/GILocations.css';

/**
 * GILocationsList
 * Clean, refactored, self-contained React component.
 *
 * Requirements:
 * - `useGILocations()` must provide { locations, loading, error, retry }.
 * - Tailwind or your existing CSS file can style things; this component uses mostly utility classes
 *   and a few inline styles for small things. You can convert inline styles to your CSS file if desired.
 *
 * Features:
 * - Uses context-provided locations (no local fetching here)
 * - Debounced search (300ms)
 * - Two checkboxes: "Only sellable" and "In stock (>0)"
 * - Loading skeletons, error + retry, empty state
 * - Accessible buttons and labels
 * - Subtle framer-motion card animation
 */

export default function GILocationsList() {
  const { locations = [], loading, error, retry, fetchLocations, lastFetchAt, lastFetchSource, ping } = useGILocations();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);

  const searchTimeoutRef = useRef(null);
  const lastLocationsRef = useRef(locations);

  // Keep a reference to last successful locations (avoid filtering an empty array while loading)
  useEffect(() => {
    if (Array.isArray(locations)) {
      lastLocationsRef.current = locations;
      // set initial filtered list when original data arrives
      setFilteredLocations(locations);
    } else {
      // fallback to empty array
      lastLocationsRef.current = [];
      setFilteredLocations([]);
    }
  }, [locations]);

  // Fetch locations from backend on mount (once)
  useEffect(() => {
    let did = false;
    if (!did) {
      fetchLocations && fetchLocations({});
      did = true;
    }
    // no cleanup needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced filtering
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      let locs = Array.isArray(lastLocationsRef.current) ? lastLocationsRef.current.slice() : [];

      const q = searchTerm.trim().toLowerCase();
      if (q) {
        locs = locs.filter((loc) => {
          const name = (loc.name || '').toString().toLowerCase();
          const district = (loc.district || '').toString().toLowerCase();
          return name.includes(q) || district.includes(q);
        });
      }

      setFilteredLocations(locs);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [searchTerm]);

  // small helper to open map safely
  const openMap = (lat, lng, name) => {
    if (!lat && !lng) return;
    const q = lat && lng ? `${lat},${lng}` : encodeURIComponent(name || '');
    const url = `https://maps.google.com/?q=${q}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // fallback key generator
  const keyFor = (loc, idx) => loc.id ?? loc._id ?? `${loc.name ?? 'loc'}-${idx}`;

  return (
    <div className="gi-locations-list" style={{ maxWidth: 1400, margin: '0 auto', padding: '2.5rem 1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          Explore Karnataka's GI Locations
        </h1>
        <p style={{ margin: '0.75rem 0 0', fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)' }}>
          Discover authentic Geographical Indication sites across the state
        </p>
      </div>

      {/* Search & Count */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: '2rem', alignItems: 'center' }}>
        <input
          aria-label="Search locations or district"
          placeholder="Search locations or districts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '1rem 1.5rem',
            borderRadius: 50,
            border: 'none',
            maxWidth: 600,
            width: '100%',
            fontSize: '1rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#fff', fontSize: '0.95rem' }}>
          <span style={{ fontWeight: 600 }}>
            {filteredLocations.length} {filteredLocations.length === 1 ? 'location' : 'locations'} found
          </span>
          {lastFetchSource && (
            <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>
              • {lastFetchSource === 'cache' ? 'cached' : 'live'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className="locations-skeletons"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 28,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="location-card skeleton"
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: 0,
                boxShadow: '0 15px 50px rgba(0,0,0,0.2)',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: 200, background: 'linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)' }} />
              <div style={{ padding: 20 }}>
                <div style={{ height: 24, width: '70%', background: '#e5e7eb', borderRadius: 8, marginBottom: 12 }} />
                <div style={{ height: 32, width: 120, background: '#d1d5db', borderRadius: 999, marginBottom: 16 }} />
                <div style={{ height: 16, width: '50%', background: '#e5e7eb', borderRadius: 8, marginBottom: 12 }} />
                <div style={{ height: 14, width: '90%', background: '#e5e7eb', borderRadius: 8, marginBottom: 8 }} />
                <div style={{ height: 14, width: '80%', background: '#e5e7eb', borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="locations-error" role="alert" style={{ textAlign: 'center', color: '#fff', fontWeight: 600, background: 'rgba(220,38,38,0.2)', padding: '2rem', borderRadius: 20, backdropFilter: 'blur(10px)' }}>
          <div style={{ marginBottom: 16, fontSize: '1.1rem' }}>Error: {String(error)}</div>
          <button
            onClick={retry}
            style={{
              background: '#fff',
              color: '#667eea',
              borderRadius: 50,
              padding: '0.75rem 2rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            }}
          >
            Retry
          </button>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="no-results" style={{ textAlign: 'center', color: '#fff', fontWeight: 500, padding: '3rem', borderRadius: 20, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>No locations found. Try adjusting your search.</p>
        </div>
      ) : (
        <div
          className="locations-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 28,
          }}
        >
          {filteredLocations.map((location, idx) => {
            const key = keyFor(location, idx);
            const badgeText = getBadgeText(location.sellable_quantity);
            const badgeBg = getBadgeColor(location.sellable_quantity);
            const isSellable = typeof location.sellable_quantity === 'number';

            return (
              <motion.article
                key={key}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
                className="location-card"
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                }}
                aria-labelledby={`loc-title-${key}`}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: 200, background: 'linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SafeImage
                    src={location.image_url || location.image}
                    alt={location.name || 'location image'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Badge overlay */}
                  <span
                    role="status"
                    aria-label={badgeText}
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: badgeBg || '#94a3b8',
                      color: '#fff',
                      borderRadius: 999,
                      padding: '8px 16px',
                      fontWeight: 700,
                      fontSize: 14,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                  >
                    {badgeText}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <h3 id={`loc-title-${key}`} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1f2937', lineHeight: 1.3 }}>
                    {location.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#667eea', fontWeight: 600, fontSize: '0.95rem' }}>
                    {location.district || '—'}
                  </div>

                  {isSellable && (
                    <button
                      type="button"
                      className="buy-btn"
                      style={{
                        background: 'linear-gradient(90deg,#10b981,#059669)',
                        color: '#fff',
                        borderRadius: 50,
                        border: 'none',
                        padding: '12px 24px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                        boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      onClick={() => {
                        alert(`Buy clicked for ${location.name} — ${location.sellable_quantity} available`);
                      }}
                    >
                      Buy ({location.sellable_quantity})
                    </button>
                  )}

                  {location.description && (
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6, flex: 1 }}>
                      {location.description}
                    </p>
                  )}

                  {/* Footer meta */}
                  <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Duration</span>
                      <span style={{ color: '#1f2937', fontWeight: 700, fontSize: '0.95rem' }}>{location.typical_visit_duration ?? '—'} mins</span>
                    </div>

                    {location.opening_time && location.closing_time && (
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                        <span style={{ color: '#9ca3af', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Hours</span>
                        <span style={{ color: '#1f2937', fontWeight: 700, fontSize: '0.95rem' }}>{`${location.opening_time} - ${location.closing_time}`}</span>
                      </div>
                    )}

                    <button
                      aria-label={`View ${location.name} on map`}
                      onClick={() => openMap(location.latitude, location.longitude, location.name)}
                      style={{
                        background: '#1f2937',
                        color: '#fff',
                        borderRadius: 50,
                        padding: '10px 20px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#374151';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#1f2937';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      View on Map
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
