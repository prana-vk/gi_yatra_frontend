import React, { useState, useEffect, useCallback } from 'react';
import SafeImage from './SafeImage';
import {
  getAllGILocations,
  getAllDistricts
} from '../services/giyatraApi';
import {
  saveLocalTrip,
  updateLocalTrip,
  markLocationAsVisited,
  getTripProgress,
  generateLocalSchedule
} from '../services/localTripStorage';
import TripMap from './TripMap';
import '../styles/TripPlannerRedesign.css';


function TripPlanner({ editingTrip, onTripSaved, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [tripData, setTripData] = useState({
    title: '',
    num_days: 3,
    start_location_name: 'Bangalore',
    start_location_latitude: '12.9716',
    start_location_longitude: '77.5946',
    preferred_start_time: '09:00',
    preferred_end_time: '18:00'
  });
  const [availableLocations, setAvailableLocations] = useState([]);
  const [locationsError, setLocationsError] = useState("");
  const [districts, setDistricts] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdTrip, setCreatedTrip] = useState(null);
  const [tripProgress, setTripProgress] = useState({ visited: 0, total: 0, percentage: 0 });
  const [showMap, setShowMap] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [loadingMessage, setLoadingMessage] = useState('Processing your trip...');

  // Show notification helper
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Define callback functions BEFORE useEffect
  const loadTripData = useCallback(async () => {
    try {
      setLoading(true);
      setTripData(editingTrip);
      setCreatedTrip(editingTrip);
      // Load selected locations from trip data (stored locally)
      if (editingTrip.selectedLocations) {
        setSelectedLocations(editingTrip.selectedLocations);
      }
      // Check if schedule exists
      if (editingTrip.schedule) {
        setSchedule(editingTrip.schedule);
        setCurrentStep(4); // Go to schedule view
        
        // Update progress
        const progress = getTripProgress(editingTrip.id);
        setTripProgress(progress);
      } else {
        setCurrentStep(2); // No schedule, start with location selection
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setLoading(false);
    }
  }, [editingTrip]);

  // Now useEffect can safely use these functions
  useEffect(() => {
    fetchInitialData();
    if (editingTrip) {
      loadTripData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTrip, loadTripData]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setLocationsError("");
      const [locationsData, districtsData] = await Promise.all([
        getAllGILocations(),
        getAllDistricts()
      ]);
      let results = locationsData.results || [];
      // Parse image if in markdown format and fill missing fields
      results = results.map(loc => {
        let image = loc.image;
        // If image is in markdown format, extract URL
        if (image && image.startsWith("[")) {
          const match = image.match(/\((.*?)\)/);
          if (match && match[1]) image = match[1];
        }
        return {
          ...loc,
          image: image || '',
          description: loc.description || 'No description available.',
          typical_visit_duration: loc.typical_visit_duration || 60
        };
      });
      if (results.length === 0) {
        setLocationsError("No locations found from the server. Please try again later or contact support.");
      }
      setAvailableLocations(results);
      setDistricts(districtsData);
    } catch (error) {
      setLocationsError("Error loading locations from server. Please check your connection or try again later.");
      setAvailableLocations([]);
      setDistricts([]);
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTripDataChange = (e) => {
    const { name, value } = e.target;
    setTripData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationToggle = (location) => {
    const isSelected = selectedLocations.some(loc => loc.id === location.id);
    
    if (isSelected) {
      setSelectedLocations(selectedLocations.filter(loc => loc.id !== location.id));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  const filteredLocations = availableLocations.filter(location => {
    const matchesSearch = !searchTerm || 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location.description && location.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDistrict = !selectedDistrict || location.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    if (!tripData.title.trim()) {
      showNotification('Please enter a trip title', 'error');
      return;
    }
    
    if (!tripData.num_days || tripData.num_days < 1) {
      showNotification('Please enter a valid number of days (at least 1)', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      console.log('💾 Saving trip to local storage...');
      
      if (editingTrip) {
        // Update existing trip in local storage
        const updatedTrip = updateLocalTrip(editingTrip.id, tripData);
        setCreatedTrip(updatedTrip);
        console.log('✅ Trip updated:', updatedTrip);
      } else {
        // Create new trip in local storage
        const newTrip = saveLocalTrip(tripData);
        setCreatedTrip(newTrip);
        console.log('✅ Trip created:', newTrip);
      }
      
      setCurrentStep(2);
    } catch (error) {
      console.error('❌ Error saving trip:', error);
      showNotification('Error saving trip. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (selectedLocations.length === 0) {
      showNotification('Please select at least one location for your trip', 'error');
      return;
    }
    if (availableLocations.length === 0) {
      showNotification('No locations available to plan a trip.', 'error');
      return;
    }
    try {
      setLoading(true);
      // Save selected locations to local storage
      const updatedTrip = updateLocalTrip(createdTrip.id, {
        selectedLocations: selectedLocations.map((loc, index) => ({
          ...loc,
          priority: index + 1
        }))
      });
      setCreatedTrip(updatedTrip);
      setCurrentStep(3);
    } catch (error) {
      console.error('❌ Error saving locations:', error);
      showNotification('Error saving locations. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Generating schedule locally...');
      console.log('🗓️ Generating schedule locally (no backend)...');

      // Ensure trip dates are set for display
      const startDate = new Date();
      const endDate = new Date(Date.now() + createdTrip.num_days * 24 * 60 * 60 * 1000);
      const tripWithDates = updateLocalTrip(createdTrip.id, {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      // Generate schedule completely offline
      const { schedule: localSchedule, trip: updatedTrip } = generateLocalSchedule({
        ...tripWithDates,
        selectedLocations: createdTrip.selectedLocations
      });

      setSchedule(localSchedule);
      setCreatedTrip(updatedTrip);

      // Update progress
      const progress = getTripProgress(updatedTrip.id);
      setTripProgress(progress);

      showNotification('Schedule generated locally! 🗺️✨', 'success');
      setCurrentStep(4);
    } catch (error) {
      console.error('❌ Error generating schedule locally:', error);
      showNotification('Error generating schedule locally. Please try again.', 'error');
    } finally {
      setLoading(false);
      setLoadingMessage('Processing your trip...');
    }
  };

  const handleFinish = () => {
    showNotification('Trip planned successfully! 🎉', 'success');
    if (onTripSaved) {
      onTripSaved(createdTrip);
    }
  };

  const handleMarkVisited = (locationId) => {
    if (!createdTrip) return;
    
    try {
      const updatedTrip = markLocationAsVisited(createdTrip.id, locationId, true);
      setCreatedTrip(updatedTrip);
      setSchedule(updatedTrip.schedule);
      
      // Update progress
      const progress = getTripProgress(createdTrip.id);
      setTripProgress(progress);
      
      showNotification('Location marked as visited! ✅', 'success');
    } catch (error) {
      console.error('Error marking location as visited:', error);
      showNotification('Error updating visit status.', 'error');
    }
  };

  const handleUnmarkVisited = (locationId) => {
    if (!createdTrip) return;
    
    try {
      const updatedTrip = markLocationAsVisited(createdTrip.id, locationId, false);
      setCreatedTrip(updatedTrip);
      setSchedule(updatedTrip.schedule);
      
      // Update progress
      const progress = getTripProgress(createdTrip.id);
      setTripProgress(progress);
    } catch (error) {
      console.error('Error unmarking location:', error);
      showNotification('Error updating visit status.', 'error');
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Reverse geocoding failed');
      const data = await res.json();
      return data.display_name || '';
    } catch (e) {
      return '';
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        let address = await reverseGeocode(lat, lng);
        if (!address) {
          address = `Current Location (${lat}, ${lng})`;
        }
        setTripData(prev => ({
          ...prev,
          start_location_latitude: lat,
          start_location_longitude: lng,
          start_location_name: address
        }));
        showNotification('Location detected! 📍', 'success');
        setLocating(false);
      },
      () => {
        showNotification('Unable to get current location.', 'error');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Transform backend schedule to expected format
  const transformScheduleData = (backendSchedule) => {
    // Handle if backend returns nested schedule object
    if (backendSchedule.schedule) {
      return backendSchedule.schedule;
    }
    
    // Ensure days array exists
    if (!backendSchedule.days || !Array.isArray(backendSchedule.days)) {
      console.warn('Invalid schedule format, creating empty structure');
      return { days: [] };
    }
    
    // Transform each day's items to ensure correct format
    return {
      ...backendSchedule,
      days: backendSchedule.days.map(day => ({
        ...day,
        items: (day.items || []).map(item => ({
          ...item,
          // Ensure location object exists for location items
          location: item.item_type === 'location' ? {
            id: item.location?.id || item.gi_location?.id,
            name: item.location?.name || item.gi_location?.name,
            description: item.location?.description || item.gi_location?.description,
            district: item.location?.district || item.gi_location?.district,
            typical_visit_duration: item.location?.typical_visit_duration || item.gi_location?.typical_visit_duration || item.duration_minutes,
            latitude: item.location?.latitude || item.gi_location?.latitude,
            longitude: item.location?.longitude || item.gi_location?.longitude
          } : undefined,
          // For travel items, ensure we have the destination name
          to_location: item.to_location || item.description?.replace('Travel to ', ''),
          duration: item.duration_minutes || item.duration,
          visited: item.visited || false
        }))
      }))
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Build a Google Maps directions URL for a day's sequence
  const buildDayGoogleMapsUrl = (day) => {
    if (!day || !Array.isArray(day.items)) return null;

    // Extract ordered location coordinates
    const locations = day.items
      .filter(item => item.item_type === 'location' && item.location && item.location.latitude && item.location.longitude)
      .map(item => ({
        name: item.location.name,
        lat: item.location.latitude,
        lng: item.location.longitude
      }));

    if (locations.length === 0) return null; // Need at least one destination

    // Start from user's current location (trip starting point)
    const origin = `${tripData.start_location_latitude},${tripData.start_location_longitude}`;
    
    // End at the last location in the day
    const destination = `${locations[locations.length - 1].lat},${locations[locations.length - 1].lng}`;

    // All other locations (except the last one) become waypoints (via stops)
    // Google Maps supports up to 9 waypoints in the free URL scheme
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

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{loadingMessage}</p>
      </div>
    );
  }
  if (locationsError) {
    return (
      <div className="error-container">
        <h2>⚠️ {locationsError}</h2>
        <button onClick={fetchInitialData} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="trip-planner-container">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      {/* Hero Header with Background Image */}
      <div className="planner-hero-header">
        <div className="hero-background">
          <SafeImage 
            src="https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920&q=80"
            alt="Karnataka Landmarks"
          />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <h1>🗺️ {editingTrip ? 'Edit Your Trip' : 'Plan Your Perfect Karnataka GI Journey'}</h1>
          <p>Discover authentic Geographical Indications and regional products of Karnataka</p>
          <div className="step-indicator">
            {[
              { num: 1, icon: '📋', label: 'Details' },
              { num: 2, icon: '📍', label: 'Locations' },
              { num: 3, icon: '🔄', label: 'Generate' },
              { num: 4, icon: '📅', label: 'Schedule' }
            ].map(step => (
              <div key={step.num} className={`step ${currentStep >= step.num ? 'active' : ''} ${currentStep === step.num ? 'current' : ''}`}>
                <div className="step-icon">{step.icon}</div>
                <div className="step-number">{step.num}</div>
                <div className="step-label">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Trip Details */}
      {currentStep === 1 && (
        <div className="trip-step step-1">
          <div className="step-header-with-image">
            <div className="step-image-container">
              <SafeImage 
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80"
                alt="Trip Planning"
              />
              <div className="step-overlay"></div>
            </div>
            <h2>📋 Let's Start Planning Your Trip</h2>
            <p>Tell us about your journey to Karnataka's treasures</p>
          </div>
          
          <form onSubmit={handleStep1Submit} className="trip-form">
            <div className="form-grid">
              <div className="form-group full-width form-card">
                <div className="form-icon">🎯</div>
                <label htmlFor="title">Trip Title *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g., Weekend Getaway to Mysore"
                  value={tripData.title}
                  onChange={handleTripDataChange}
                  required
                />
              </div>

              <div className="form-group form-card">
                <div className="form-icon">📆</div>
                <label htmlFor="num_days">Number of Days *</label>
                <input
                  id="num_days"
                  name="num_days"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="e.g., 3"
                  value={tripData.num_days}
                  onChange={handleTripDataChange}
                  required
                />
                <small className="form-help">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&q=80"
                    alt="Days"
                    style={{ width: '20px', height: '20px', borderRadius: '50%', display: 'inline-block', marginRight: '5px' }}
                  />
                  How many days will your trip last?
                </small>
              </div>

              <div className="form-group form-card">
                <div className="form-icon">📍</div>
                <label htmlFor="start_location_name">Starting Location *</label>
                <div className="location-input">
                  <input
                    id="start_location_name"
                    name="start_location_name"
                    type="text"
                    placeholder="e.g., Bangalore"
                    value={tripData.start_location_name || ''}
                    onChange={handleTripDataChange}
                    required
                  />
                  <button type="button" onClick={getCurrentLocation} className="location-btn" disabled={locating}>
                    <span className="btn-icon">
                      {locating ? (
                        <SafeImage 
                          src="https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=50&q=80"
                          alt="Loading"
                          style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                        />
                      ) : '📍'}
                    </span>
                    {locating ? 'Detecting…' : 'Use My Location'}
                  </button>
                </div>
                <small className="form-help">Where will you start your journey?</small>
              </div>

              <div className="time-group form-card full-width">
                <div className="time-header">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1501139083538-0139583c060f?w=100&q=80"
                    alt="Time"
                  />
                  <h4>⏰ Preferred Daily Schedule</h4>
                </div>
                <div className="time-inputs">
                  <div className="form-group">
                    <label htmlFor="preferred_start_time">Start Time</label>
                    <input
                      id="preferred_start_time"
                      name="preferred_start_time"
                      type="time"
                      value={tripData.preferred_start_time}
                      onChange={handleTripDataChange}
                    />
                    <small className="form-help">When do you usually start your day?</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="preferred_end_time">End Time</label>
                    <input
                      id="preferred_end_time"
                      name="preferred_end_time"
                      type="time"
                      value={tripData.preferred_end_time}
                      onChange={handleTripDataChange}
                    />
                    <small className="form-help">When do you prefer to end activities?</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              {onCancel && (
                <button type="button" onClick={onCancel} className="cancel-btn">
                  <span className="btn-icon">❌</span>
                  Cancel
                </button>
              )}
              <button type="submit" className="next-btn">
                <span className="btn-icon">➡️</span>
                Next: Select Locations
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Location Selection */}
      {currentStep === 2 && (
        <div className="trip-step step-2">
          <div className="step-header-with-image">
            <div className="step-image-container">
              <SafeImage 
                src="https://images.unsplash.com/photo-1609920658906-8223bd289001?w=800&q=80"
                alt="Karnataka Locations"
              />
              <div className="step-overlay"></div>
            </div>
            <h2>📍 Choose Your Destinations</h2>
            <p>Select amazing places to visit in Karnataka</p>
          </div>
          
          <div className="selection-summary-card">
            <div className="summary-icon">
              <SafeImage 
                src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=100&q=80"
                alt="Selection"
              />
            </div>
            <div className="summary-content">
              <h3>{selectedLocations.length} Locations Selected</h3>
              <p>For your {tripData.num_days}-day adventure through Karnataka</p>
            </div>
            <div className="summary-visual">
              {selectedLocations.slice(0, 3).map((loc, i) => (
                <div key={loc.id} className="mini-location-badge" style={{ zIndex: 3 - i }}>
                  <SafeImage 
                    src={loc.image || `https://source.unsplash.com/100x100/?${encodeURIComponent(loc.name)},karnataka`}
                    alt={loc.name}
                  />
                </div>
              ))}
              {selectedLocations.length > 3 && (
                <div className="more-badge">+{selectedLocations.length - 3}</div>
              )}
            </div>
          </div>

          <div className="location-filters-card">
            <div className="filter-icon">🔍</div>
            <input
              type="text"
              placeholder="Search locations by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <div className="filter-icon">🗺️</div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="district-filter"
            >
              <option value="">All Districts</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          <div className="locations-selection">
            <div className="available-locations">
              <div className="section-header">
                <SafeImage 
                  src="https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=100&q=80"
                  alt="Available"
                />
                <h3>Available Locations ({filteredLocations.length})</h3>
              </div>
              <div className="locations-grid">
                {filteredLocations.map(location => (
                  <div 
                    key={location.id} 
                    className={`location-card ${selectedLocations.some(sel => sel.id === location.id) ? 'selected' : ''}`}
                    onClick={() => handleLocationToggle(location)}
                  >
                    <div className="location-image">
                      <SafeImage 
                        src={location.image || `https://source.unsplash.com/500x350/?${encodeURIComponent(location.name)},karnataka,travel`}
                        alt={location.name}
                      />
                      <div className="image-overlay"></div>
                      {selectedLocations.some(sel => sel.id === location.id) && (
                        <div className="selected-badge">
                          <span className="badge-icon">✅</span>
                          <span>Selected</span>
                        </div>
                      )}
                      <div className="district-badge">
                        📍 {location.district}
                      </div>
                    </div>
                    
                    <div className="location-info">
                      <h4>{location.name}</h4>
                      <p className="description">{location.description}</p>
                      
                      <div className="location-meta">
                        <div className="meta-item">
                          <div className="meta-icon">
                            <SafeImage 
                              src="https://images.unsplash.com/photo-1501139083538-0139583c060f?w=50&q=80"
                              alt="Duration"
                            />
                          </div>
                          <span>⏰ {location.typical_visit_duration} mins</span>
                        </div>
                        
                        <div className="meta-item">
                          <div className="meta-icon">
                            <SafeImage 
                              src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=50&q=80"
                              alt="Landmark"
                            />
                          </div>
                          <span>📍 Landmark</span>
                        </div>
                      </div>
                      
                      <button className="selection-btn">
                        {selectedLocations.some(sel => sel.id === location.id) ? (
                          <><span className="btn-icon">✓</span> Selected</>
                        ) : (
                          <><span className="btn-icon">+</span> Add to Trip</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="selected-locations-sidebar">
              <div className="sidebar-sticky">
                <div className="section-header">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=100&q=80"
                    alt="Selected"
                  />
                  <h3>Your Selected Locations</h3>
                  <span className="count-badge">{selectedLocations.length}</span>
                </div>
                {selectedLocations.length === 0 ? (
                  <div className="no-selection-state">
                    <SafeImage 
                      src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&q=80"
                      alt="No selection"
                    />
                    <p>No locations selected yet</p>
                    <small>Click on location cards to add them to your trip</small>
                  </div>
                ) : (
                  <div className="selected-list">
                    {selectedLocations.map((location, index) => (
                      <div key={location.id} className="selected-item">
                        <div className="selected-item-image">
                          <SafeImage 
                            src={location.image || `https://source.unsplash.com/100x100/?${encodeURIComponent(location.name)},karnataka`}
                            alt={location.name}
                          />
                        </div>
                        <div className="selected-item-content">
                          <span className="order-badge">{index + 1}</span>
                          <div className="item-details">
                            <span className="name">{location.name}</span>
                            <span className="district">{location.district}</span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLocationToggle(location);
                          }}
                          className="remove-btn"
                          title="Remove from trip"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button onClick={() => setCurrentStep(1)} className="back-btn">
              ← Back
            </button>
            <button onClick={handleStep2Submit} className="next-btn">
              Next: Generate Schedule →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generate Schedule */}
      {currentStep === 3 && (
        <div className="trip-step step-3">
          <div className="step-header-with-image">
            <div className="step-image-container">
              <SafeImage 
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
                alt="Generate Schedule"
              />
              <div className="step-overlay"></div>
            </div>
            <h2>🔄 Generate Your Perfect Schedule</h2>
            <p>We'll organize your trip into a day-by-day itinerary</p>
          </div>
          
          <div className="schedule-preview-card">
            <div className="preview-header">
              <SafeImage 
                src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=200&q=80"
                alt="Trip Summary"
              />
              <h3>📋 Trip Summary</h3>
            </div>
            
            <div className="trip-summary-grid">
              <div className="summary-item">
                <div className="summary-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=100&q=80"
                    alt="Title"
                  />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Trip Title</span>
                  <span className="summary-value">{tripData.title}</span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&q=80"
                    alt="Duration"
                  />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Duration</span>
                  <span className="summary-value">{tripData.num_days} Days</span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=100&q=80"
                    alt="Dates"
                  />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Dates</span>
                  <span className="summary-value">{formatDate(tripData.start_date)} to {formatDate(tripData.end_date)}</span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=100&q=80"
                    alt="Locations"
                  />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Locations</span>
                  <span className="summary-value">{selectedLocations.length} Places</span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1501139083538-0139583c060f?w=100&q=80"
                    alt="Time"
                  />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Daily Hours</span>
                  <span className="summary-value">{tripData.preferred_start_time} - {tripData.preferred_end_time}</span>
                </div>
              </div>
            </div>

            <div className="selected-locations-preview">
              <h4>🎯 Your Selected Destinations</h4>
              <div className="locations-preview-grid">
                {selectedLocations.map((location, idx) => (
                  <div key={location.id} className="preview-location-card">
                    <div className="preview-location-image">
                      <SafeImage 
                        src={location.image || `https://source.unsplash.com/300x200/?${encodeURIComponent(location.name)},karnataka`}
                        alt={location.name}
                      />
                      <span className="location-number">{idx + 1}</span>
                    </div>
                    <div className="preview-location-info">
                      <h5>{location.name}</h5>
                      <p>📍 {location.district}</p>
                      <p>⏰ {location.typical_visit_duration} mins</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="generate-section-card">
            <div className="generate-header">
              <SafeImage 
                src="https://images.unsplash.com/photo-1551817958-20c1b2d4f7cc?w=200&q=80"
                alt="AI Planning"
              />
              <div>
                <h3>🗺️ Smart Offline Schedule Generation</h3>
                <p>Our intelligent algorithm will create your perfect itinerary</p>
              </div>
            </div>
            
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=100&q=80"
                    alt="Arrange"
                  />
                </div>
                <div className="feature-content">
                  <h4>📅 Day-wise Organization</h4>
                  <p>Arrange your places into logical day-by-day visits</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1501139083538-0139583c060f?w=100&q=80"
                    alt="Time"
                  />
                </div>
                <div className="feature-content">
                  <h4>⏰ Respect Your Schedule</h4>
                  <p>Works within your preferred start and end times</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1508796079212-a4b83cbf734d?w=100&q=80"
                    alt="Travel"
                  />
                </div>
                <div className="feature-content">
                  <h4>🚗 Smart Travel Buffers</h4>
                  <p>Add realistic travel time between locations</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=100&q=80"
                    alt="Offline"
                  />
                </div>
                <div className="feature-content">
                  <h4>🔒 Privacy First</h4>
                  <p>No API keys or server required - works offline</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=100&q=80"
                    alt="Maps"
                  />
                </div>
                <div className="feature-content">
                  <h4>🗺️ Google Maps Integration</h4>
                  <p>Open each day's route with one tap</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <SafeImage 
                    src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=100&q=80"
                    alt="Landmarks"
                  />
                </div>
                <div className="feature-content">
                  <h4>📍 Iconic Landmarks</h4>
                  <p>Discover Karnataka's most iconic places</p>
                </div>
              </div>
            </div>
            
            <button onClick={handleGenerateSchedule} className="generate-btn">
              <span className="btn-icon">🚀</span>
              Generate My Perfect Schedule
              <span className="btn-subtext">Click to create your itinerary</span>
            </button>
          </div>

          <div className="form-actions">
            <button onClick={() => setCurrentStep(2)} className="back-btn">
              <span className="btn-icon">←</span>
              Back to Locations
            </button>
          </div>
        </div>
      )}

      {/* Step 4: View Schedule */}
      {currentStep === 4 && schedule && (
        <div className="trip-step step-4">
          <div className="step-header-with-image">
            <div className="step-image-container">
              <SafeImage 
                src="https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=800&q=80"
                alt="Your Schedule"
              />
              <div className="step-overlay"></div>
            </div>
            <h2>📅 Your Perfect Karnataka Journey</h2>
            <p>Your optimized day-by-day itinerary is ready!</p>
          </div>
          
          {/* Progress Bar */}
          {tripProgress.total > 0 && (
            <div className="trip-progress-card">
              <div className="progress-visual">
                <SafeImage 
                  src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=200&q=80"
                  alt="Progress"
                />
              </div>
              <div className="progress-content">
                <div className="progress-header">
                  <h3>🎯 Your Trip Progress</h3>
                  <span className="progress-percentage">{tripProgress.percentage}%</span>
                </div>
                <div className="progress-stats">
                  <span className="stat-item">
                    <span className="stat-icon">✅</span>
                    {tripProgress.visited} Visited
                  </span>
                  <span className="stat-divider">•</span>
                  <span className="stat-item">
                    <span className="stat-icon">📍</span>
                    {tripProgress.total - tripProgress.visited} Remaining
                  </span>
                  <span className="stat-divider">•</span>
                  <span className="stat-item">
                    <span className="stat-icon">🎯</span>
                    {tripProgress.total} Total
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${tripProgress.percentage}%` }}
                    >
                      <span className="progress-label">{tripProgress.percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="schedule-display">
            {schedule.days && schedule.days.map((day, dayIdx) => (
              <div key={day.day_number} className="day-schedule-card">
                <div className="day-header-card">
                  <div className="day-header-image">
                    <SafeImage 
                      src={`https://images.unsplash.com/photo-${1596422846543 + dayIdx}?w=400&q=80`}
                      alt={`Day ${day.day_number}`}
                    />
                    <div className="day-number-badge">Day {day.day_number}</div>
                  </div>
                  <div className="day-header-content">
                    <h3>{formatDate(day.date)}</h3>
                    <p>{day.items.filter(i => i.item_type === 'location').length} destinations today</p>
                  </div>
                  {buildDayGoogleMapsUrl(day) && (
                    <a
                      href={buildDayGoogleMapsUrl(day)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="open-map-btn"
                      title="Open route in Google Maps"
                    >
                      <span className="btn-icon">🗺️</span>
                      <span className="btn-text">Open in Maps</span>
                    </a>
                  )}
                </div>
                
                <div className="day-timeline">
                  {day.items.map((item, idx) => (
                    <div key={idx} className={`timeline-item ${item.item_type} ${item.visited ? 'visited' : ''}`}>
                      <div className="timeline-connector"></div>
                      <div className="time-badge-card">
                        <SafeImage 
                          src="https://images.unsplash.com/photo-1501139083538-0139583c060f?w=100&q=80"
                          alt="Time"
                        />
                        <div className="time-content">
                          <span className="start-time">{item.start_time}</span>
                          <span className="time-divider">-</span>
                          <span className="end-time">{item.end_time}</span>
                        </div>
                      </div>
                      
                      <div className="item-content-card">
                        {item.item_type === 'location' && (
                          <>
                            <div className="location-card-image">
                              <SafeImage 
                                src={item.location.image || `https://source.unsplash.com/600x400/?${encodeURIComponent(item.location.name)},karnataka,travel`}
                                alt={item.location.name}
                              />
                              {item.visited && (
                                <div className="visited-overlay">
                                  <span className="visited-check">✅</span>
                                  <span>Visited</span>
                                </div>
                              )}
                              <div className="location-district-badge">
                                📍 {item.location.district}
                              </div>
                            </div>
                            
                            <div className="location-details">
                              <div className="item-header">
                                <span className="location-icon">{item.visited ? '✅' : '📍'}</span>
                                <h4>{item.location.name}</h4>
                              </div>
                              <p className="description">{item.location.description}</p>
                              
                              <div className="location-meta-grid">
                                <div className="meta-card">
                                  <SafeImage 
                                    src="https://images.unsplash.com/photo-1501139083538-0139583c060f?w=50&q=80"
                                    alt="Duration"
                                  />
                                  <span>⏰ {item.location.typical_visit_duration} mins</span>
                                </div>
                                <div className="meta-card">
                                  <SafeImage 
                                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=50&q=80"
                                    alt="Landmark"
                                  />
                                  <span>📍 Landmark</span>
                                </div>
                              </div>
                              
                              <div className="location-actions">
                                {!item.visited ? (
                                  <button 
                                    onClick={() => handleMarkVisited(item.location.id)}
                                    className="mark-visited-btn"
                                  >
                                    <span className="btn-icon">✓</span>
                                    Mark as Visited
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleUnmarkVisited(item.location.id)}
                                    className="unmark-visited-btn"
                                  >
                                    <span className="btn-icon">✗</span>
                                    Unmark
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                        
                        {item.item_type === 'travel' && (
                          <div className="travel-card">
                            <div className="travel-icon">
                              <SafeImage 
                                src="https://images.unsplash.com/photo-1508796079212-a4b83cbf734d?w=100&q=80"
                                alt="Travel"
                              />
                            </div>
                            <div className="travel-content">
                              <div className="item-header">
                                <span className="icon">🚗</span>
                                <h4>Travel to {item.to_location}</h4>
                              </div>
                              <div className="meta">
                                <span>Estimated duration: {item.duration} mins</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {item.item_type === 'break' && (
                          <div className="break-card">
                            <div className="break-icon">
                              <SafeImage 
                                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&q=80"
                                alt="Break"
                              />
                            </div>
                            <div className="break-content">
                              <div className="item-header">
                                <span className="icon">☕</span>
                                <h4>{item.description}</h4>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions-card">
            <button onClick={() => setCurrentStep(2)} className="back-btn">
              <span className="btn-icon">✏️</span>
              Modify Locations
            </button>
            <button onClick={() => setShowMap(true)} className="start-trip-btn">
              <span className="btn-icon">🗺️</span>
              Start Trip (View Map)
            </button>
            <button onClick={handleFinish} className="finish-btn">
              <span className="btn-icon">✨</span>
              Complete Planning
            </button>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMap && createdTrip && schedule && (
        <TripMap 
          trip={createdTrip} 
          schedule={schedule} 
          onClose={() => setShowMap(false)} 
        />
      )}
    </div>
  );
}

export default TripPlanner;