import React, { useState, useEffect } from 'react';
import { 
  getLocalTrips, 
  deleteLocalTrip 
} from '../services/localTripStorage';
import '../styles/TripPlanning.css';

function TripsList({ onEditTrip, onCreateNew }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [openingMap, setOpeningMap] = useState(false);
  const [manualOriginIdx, setManualOriginIdx] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      console.log('📚 Loading trips from local storage...');
      const data = getLocalTrips();
      console.log('✅ Trips loaded:', data);
      setTrips(data);
    } catch (error) {
      console.error('Error fetching trips:', error);
      alert('Error loading trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        deleteLocalTrip(id);
        setTrips(trips.filter(trip => trip.id !== id));
        alert('Trip deleted successfully!');
      } catch (error) {
        console.error('Error deleting trip:', error);
        alert('Error deleting trip. Please try again.');
      }
    }
  };

  const handleViewSchedule = async (trip) => {
    try {
      setLoadingSchedule(true);
      setSelectedTrip(trip);
      
      // Check if trip has schedule
      if (trip.schedule) {
        setSchedule(trip.schedule);
      } else {
        alert('No schedule found for this trip. Try generating one first.');
        setSchedule(null);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      alert('No schedule found for this trip. Try generating one first.');
      setSchedule(null);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end date
  };

  // ====== Map helpers (no backend / no API key needed) ======
  const getUserLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        return resolve(null);
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

  const toPoint = (locObj) => {
    if (!locObj) return null;
    const lat =
      locObj.latitude ?? locObj.lat ?? locObj.Latitude ?? locObj.Lat ?? null;
    const lng =
      locObj.longitude ?? locObj.lng ?? locObj.lon ?? locObj.Longitude ?? locObj.Lng ?? null;
    const label = locObj.name || locObj.title || 'Location';
    return { lat: typeof lat === 'string' ? parseFloat(lat) : lat, lng: typeof lng === 'string' ? parseFloat(lng) : lng, label };
  };

  const haversineKm = (a, b) => {
    if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return Number.POSITIVE_INFINITY;
    const R = 6371;
    const dLat = (Math.PI / 180) * (b.lat - a.lat);
    const dLng = (Math.PI / 180) * (b.lng - a.lng);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLng / 2);
    const aa = s1 * s1 + Math.cos((Math.PI / 180) * a.lat) * Math.cos((Math.PI / 180) * b.lat) * s2 * s2;
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  };

  // Simple nearest-neighbor ordering as a heuristic for a short route
  const nearestNeighborOrder = (points, startIdx = 0) => {
    if (!points || points.length <= 1) return points || [];
    const remaining = points.map((p, i) => ({ i, p }));
    const route = [];
    let current = remaining.splice(startIdx, 1)[0];
    route.push(current.p);
    while (remaining.length) {
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let idx = 0; idx < remaining.length; idx++) {
        const d = haversineKm(current.p, remaining[idx].p);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      }
      current = remaining.splice(bestIdx, 1)[0];
      route.push(current.p);
    }
    return route;
  };

  const buildGoogleMapsUrl = ({ origin, destination, waypoints }) => {
    const base = 'https://www.google.com/maps/dir/?api=1';
    const fmt = (pt) =>
      pt && pt.lat != null && pt.lng != null
        ? `${pt.lat},${pt.lng}`
        : encodeURIComponent(pt.label || 'Location');
    const params = [];
    if (origin) params.push(`origin=${encodeURIComponent(fmt(origin))}`);
    if (destination) params.push(`destination=${encodeURIComponent(fmt(destination))}`);
    if (waypoints && waypoints.length) {
      // Google Maps limits waypoints; keep it modest
      const limited = waypoints.slice(0, 23);
      params.push(`waypoints=${encodeURIComponent(limited.map(fmt).join('|'))}`);
    }
    params.push('travelmode=driving');
    return `${base}&${params.join('&')}`;
  };

  const openDayInGoogleMaps = async (day) => {
    try {
      if (!day || !Array.isArray(day.items)) {
        alert('No locations for this day.');
        return;
      }
      setOpeningMap(true);
      const rawLocs = day.items
        .filter((it) => it.item_type === 'location' && it.location)
        .map((it) => toPoint(it.location))
        .filter(Boolean);

      if (rawLocs.length < 2) {
        // With 1 point, just open that point
        const single = rawLocs[0] || null;
        if (single) {
          const url = buildGoogleMapsUrl({ origin: single, destination: single });
          window.open(url, '_blank');
        } else {
          alert('No valid coordinates available.');
        }
        return;
      }

      let userPos = await getUserLocation();
      if (!userPos && manualOriginIdx == null) {
        // Inform user we will start from the first stop unless they pick a start
        // This avoids confusion when permission is denied
        // eslint-disable-next-line no-alert
        alert("Location permission denied or unavailable. We'll start from the first stop. You can select a different origin from the dropdown.");
      }
      if (!userPos && manualOriginIdx != null && rawLocs[manualOriginIdx]) {
        // Use manual origin if chosen
        userPos = rawLocs[manualOriginIdx];
      }

      let origin = userPos || rawLocs[0];
      // If user position exists, choose the nearest point as next
      let points = rawLocs;
      let ordered;
      if (userPos) {
        // Insert user origin as virtual start for ordering
        const nearestIdx = points.reduce(
          (acc, p, idx) => {
            const d = haversineKm(userPos, p);
            return d < acc.dist ? { idx, dist: d } : acc;
          },
          { idx: 0, dist: Number.POSITIVE_INFINITY }
        ).idx;
        ordered = nearestNeighborOrder(points, nearestIdx);
      } else {
        ordered = nearestNeighborOrder(points, 0);
      }

      const destination = ordered[ordered.length - 1];
      const waypoints = ordered.slice(0, -1);
      const url = buildGoogleMapsUrl({ origin, destination, waypoints });
      console.log('Opening Google Maps URL:', url);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Failed to open map:', e);
      alert('Could not open Google Maps.');
    } finally {
      setOpeningMap(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading trips...</p>
      </div>
    );
  }

  return (
    <div className="trips-list-container">
      <div className="header">
        <h1>🎒 Your Trips</h1>
        <p>Manage your planned trips and itineraries</p>
        <button onClick={onCreateNew} className="create-new-btn">
          ➕ Plan New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="no-trips">
          <div className="empty-state">
            <h3>🗺️ No trips planned yet!</h3>
            <p>Start planning your first trip to explore Karnataka's beautiful locations.</p>
            <button onClick={onCreateNew} className="start-planning-btn">
              🚀 Start Planning
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="trips-grid">
            {trips.map(trip => (
              <div key={trip.id} className="trip-card">
                <div className="trip-header">
                  <h3>{trip.title}</h3>
                  <span className="trip-duration">
                    {calculateDuration(trip.start_date, trip.end_date)} days
                  </span>
                </div>
                
                <div className="trip-dates">
                  <div className="date-info">
                    <span className="label">🗓️ Start:</span>
                    <span className="value">{formatDate(trip.start_date)}</span>
                  </div>
                  <div className="date-info">
                    <span className="label">🏁 End:</span>
                    <span className="value">{formatDate(trip.end_date)}</span>
                  </div>
                </div>
                
                <div className="trip-details">
                  <div className="detail">
                    <span className="label">📍 Starting from:</span>
                    <span className="value">{trip.start_location_name}</span>
                  </div>
                  <div className="detail">
                    <span className="label">⏰ Preferred hours:</span>
                    <span className="value">
                      {trip.preferred_start_time} - {trip.preferred_end_time}
                    </span>
                  </div>
                </div>
                
                <div className="trip-stats">
                  <div className="stat">
                    <span className="count">{trip.selected_locations_count || 0}</span>
                    <span className="label">Locations</span>
                  </div>
                  <div className="stat">
                    <span className="count">{trip.num_days}</span>
                    <span className="label">Days</span>
                  </div>
                </div>
                
                <div className="trip-actions">
                  <button 
                    onClick={() => onEditTrip(trip)}
                    className="edit-btn"
                  >
                    ✏️ Edit
                  </button>
                  
                  <button 
                    onClick={() => handleViewSchedule(trip)}
                    className="schedule-btn"
                  >
                    📅 Schedule
                  </button>
                  
                  <button 
                    onClick={() => handleDelete(trip.id, trip.title)}
                    className="delete-btn"
                  >
                    🗑️ Delete
                  </button>
                </div>
                
                <div className="trip-meta">
                  <small>Created: {formatDate(trip.created_at)}</small>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule Modal */}
          {selectedTrip && (
            <div className="schedule-modal-overlay" onClick={() => setSelectedTrip(null)}>
              <div className="schedule-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>📅 Schedule for {selectedTrip.title}</h2>
                  <button 
                    onClick={() => setSelectedTrip(null)}
                    className="close-btn"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="modal-content">
                  {loadingSchedule ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>Loading schedule...</p>
                    </div>
                  ) : schedule ? (
                    <div className="schedule-content">
                      {schedule.days && schedule.days.map(day => (
                        <div key={day.day_number} className="day-schedule">
                          <h3>Day {day.day_number} - {formatDate(day.date)}</h3>
                          <div style={{ display: 'flex', gap: 8, margin: '8px 0 16px 0' }}>
                            <button
                              onClick={() => openDayInGoogleMaps(day)}
                              className="schedule-btn"
                              disabled={openingMap}
                              title="Open this day's route in Google Maps"
                            >
                              🗺️ Open shortest route
                            </button>
                            <select
                              onChange={(e) => setManualOriginIdx(e.target.value === '' ? null : Number(e.target.value))}
                              defaultValue=""
                              title="Choose a start if location permission denied"
                            >
                              <option value="">Origin (auto or select)</option>
                              {day.items
                                .filter((it) => it.item_type === 'location' && it.location)
                                .map((it, idx) => (
                                  <option key={idx} value={idx}>{it.location?.name || `Stop ${idx+1}`}</option>
                                ))}
                            </select>
                            <small style={{ alignSelf: 'center' }}>
                              Note: Waypoints are limited; very long routes are trimmed.
                            </small>
                          </div>
                          
                          <div className="day-items">
                            {day.items.map((item, idx) => (
                              <div key={idx} className={`schedule-item ${item.item_type}`}>
                                <div className="time-range">
                                  {item.start_time} - {item.end_time}
                                </div>
                                
                                <div className="item-content">
                                  {item.item_type === 'location' && (
                                    <>
                                      <div className="item-header">
                                        <span className="icon">📍</span>
                                        <span className="name">{item.location.name}</span>
                                      </div>
                                      <div className="item-details">
                                        <p>{item.location.description}</p>
                                        <small>Duration: {item.location.typical_visit_duration} mins</small>
                                      </div>
                                    </>
                                  )}
                                  
                                  {item.item_type === 'travel' && (
                                    <>
                                      <div className="item-header">
                                        <span className="icon">🚗</span>
                                        <span className="name">Travel to {item.to_location}</span>
                                      </div>
                                      <div className="item-details">
                                        <small>Estimated duration: {item.duration} mins</small>
                                      </div>
                                    </>
                                  )}
                                  
                                  {item.item_type === 'break' && (
                                    <>
                                      <div className="item-header">
                                        <span className="icon">☕</span>
                                        <span className="name">{item.description}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-schedule">
                      <p>No schedule available for this trip.</p>
                      <p>Edit the trip and generate a schedule to see the itinerary here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TripsList;