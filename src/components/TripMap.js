import React, { useEffect, useState } from 'react';
import '../styles/TripMap.css';

function TripMap({ trip, schedule, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Karnataka GI location images (using Unsplash with Karnataka landmarks)
  const backgroundImages = [
    'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1600&q=80', // Mysore Palace
  'https://m.media-amazon.com/images/S/aplus-media-library-service-media/1e778006-6416-4825-bdd3-344c79a80dfd.__CR49,0,983,608_PT0_SX970_V1___.jpg', // Hampi (replaced)
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600&q=80', // Bangalore
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1600&q=80', // Temple
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=1600&q=80', // GI site
    'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=1600&q=80', // Architecture
  ];

  useEffect(() => {
    // Rotate background images
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 4000);

    return () => clearInterval(imageInterval);
  }, []);
  
  useEffect(() => {
    // Automatically open in device's native map app
    openInNativeMap();
  }, []);

  const openInNativeMap = () => {
    try {
      // Get all locations from schedule
      const locations = [];
      if (schedule && schedule.days) {
        schedule.days.forEach(day => {
          if (!day || !Array.isArray(day.items)) return;
          day.items.forEach(item => {
            if (item.item_type === 'location' && item.location) {
              locations.push({
                name: item.location.name,
                lat: parseFloat(item.location.latitude),
                lng: parseFloat(item.location.longitude)
              });
            }
          });
        });
      }

      if (locations.length === 0) {
        console.warn('No locations to show on map');
        return;
      }

      // Start from user's trip starting location
      const origin = (trip && trip.start_location_latitude && trip.start_location_longitude)
        ? `${trip.start_location_latitude},${trip.start_location_longitude}`
        : `${locations[0].lat},${locations[0].lng}`;
      
      // End at the last location
      const destination = `${locations[locations.length - 1].lat},${locations[locations.length - 1].lng}`;
      
      // All other locations become waypoints (via stops) - up to 9 waypoints max
      const waypointLocations = locations.slice(0, -1).slice(0, 9);
      const waypointsParam = waypointLocations.length > 0
        ? waypointLocations.map(loc => `${loc.lat},${loc.lng}`).join('|')
        : '';

      const params = new URLSearchParams({
        api: '1',
        travelmode: 'driving',
        origin,
        destination
      });
      
      if (waypointsParam) {
        params.set('waypoints', waypointsParam);
        // Enable route optimization to find shortest path through all waypoints
        params.set('waypoints_optimize', 'true');
      }

      const mapsUrl = `https://www.google.com/maps/dir/?${params.toString()}`;
      
      // Open in new tab/native app
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      
      // Close modal after opening (if close handler provided)
      if (typeof onClose === 'function') {
        setTimeout(() => {
          onClose();
        }, 500);
      }
      
    } catch (error) {
      console.error('Error opening map:', error);
    }
  };

  return (
    <div className="trip-map-container">
      {/* Rotating Background Images */}
      <div className="background-slideshow">
        {backgroundImages.map((img, index) => (
          <div
            key={index}
            className={`background-slide ${index === currentImageIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="background-overlay" />
      </div>

      <div className="map-content">
        <div className="map-header">
          <div className="header-content">
            <h2>{trip?.title || 'Trip Route'}</h2>
            <p>Opening route in your device's map app...</p>
          </div>
          {typeof onClose === 'function' && (
            <button onClick={onClose} className="close-map-btn" title="Close">
            </button>
          )}
        </div>
        
        <div className="map-info-card">
          <div className="info-icon"></div>
          <h3>Route Opened in Native Maps</h3>
          <p>The complete trip route with all locations is now opening in your device's map application</p>
          
          <div className="map-features">
            <div className="feature-item">
              <span className="feature-icon"></span>
              <div className="feature-text">
                <strong>Turn-by-turn</strong>
                <span>Navigation</span>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon"></span>
              <div className="feature-text">
                <strong>Real-time</strong>
                <span>Traffic updates</span>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon"></span>
              <div className="feature-text">
                <strong>Offline maps</strong>
                <span>Support</span>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon"></span>
              <div className="feature-text">
                <strong>Voice</strong>
                <span>Guidance</span>
              </div>
            </div>
          </div>

          <button onClick={openInNativeMap} className="reopen-map-btn">
            Reopen Map
          </button>
        </div>
        
        <div className="map-footer">
          <p className="footer-note">No API keys required - uses your device's built-in maps</p>
        </div>
      </div>
    </div>
  );
}

export default TripMap;
