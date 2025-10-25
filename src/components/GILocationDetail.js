import React from 'react';
import SafeImage from './SafeImage';
import '../styles/GILocations.css';
import { getBadgeText, getBadgeColor } from '../utils/badgeStrings';

function GILocationDetail({ location, onNavigate }) {
  if (!location) return <div className="gi-location-detail-empty">No location selected.</div>;

  return (
    <div className="gi-location-detail-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => onNavigate && onNavigate('locations')} style={{ background: 'transparent', border: 'none', color: '#111', fontWeight: 700, cursor: 'pointer' }}>← Back to list</button>
      </div>

      <div className="gi-location-detail-layout">
        <div className="gi-location-detail-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>{location.name}</h2>
            <span
              className="badge"
              style={{
                background: getBadgeColor(location.sellable_quantity),
                color: '#fff',
                borderRadius: '999px',
                padding: '0.3rem 0.8rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                boxShadow: '0 2px 8px rgba(72,187,120,0.12)',
                display: 'inline-block',
              }}
              aria-label={getBadgeText(location.sellable_quantity)}
              role="status"
            >
              {getBadgeText(location.sellable_quantity)}
            </span>
          </div>

          <p className="district">📍 {location.district_name || location.district}</p>

          <div className="gi-location-detail-body">
            <p className="description">{location.description}</p>
            <div className="location-details">
              <div className="detail">
                <span className="label">⏰ Visit Duration:</span>
                <span className="value">{location.typical_visit_duration} mins</span>
              </div>
              {location.opening_time && location.closing_time && (
                <div className="detail">
                  <span className="label">🕐 Hours:</span>
                  <span className="value">{location.opening_time} - {location.closing_time}</span>
                </div>
              )}
            </div>

            {location.sellable_quantity != null && (
              <button className="buy-btn" style={{marginTop: '1rem'}} onClick={() => { /* placeholder for purchase */ }}>
                Buy
              </button>
            )}
          </div>
        </div>

        <div className="gi-location-detail-image">
          <SafeImage src={location.image_url || location.image || `https://source.unsplash.com/800x600/?karnataka,gi,product,${location.name}`} alt={location.name} />
        </div>
      </div>
    </div>
  );
}

export default GILocationDetail;
