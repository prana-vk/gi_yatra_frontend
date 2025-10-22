import React from 'react';
import SafeImage from './SafeImage';
import '../styles/GILocations.css';
import { getBadgeText, getBadgeColor } from '../utils/badgeStrings';

function GILocationDetail({ location }) {
  if (!location) return <div className="gi-location-detail-empty">No location selected.</div>;

  return (
    <div className="gi-location-detail-card">
      <div className="gi-location-detail-header">
        <SafeImage src={location.image_url || location.image || `https://source.unsplash.com/400x300/?karnataka,gi,product,${location.name}`} alt={location.name} />
        <div className="gi-location-detail-meta">
          <h2>{location.name}</h2>
          <span
            className="badge"
            style={{
              background: getBadgeColor(location.sellable_quantity),
              color: '#fff',
              borderRadius: '999px',
              padding: '0.4rem 1rem',
              fontWeight: 600,
              fontSize: '1rem',
              marginLeft: '1rem',
              boxShadow: '0 2px 8px rgba(72,187,120,0.12)',
              display: 'inline-block',
            }}
            aria-label={getBadgeText(location.sellable_quantity)}
            role="status"
          >
            {getBadgeText(location.sellable_quantity)}
          </span>
          <p className="district">📍 {location.district_name || location.district}</p>
        </div>
      </div>
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
          <button className="buy-btn" style={{marginTop: '1rem'}}>
            Buy ({location.sellable_quantity} available)
          </button>
        )}
      </div>
    </div>
  );
}

export default GILocationDetail;
