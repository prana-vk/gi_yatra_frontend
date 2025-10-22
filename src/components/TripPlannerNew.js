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

  const loadTripData = useCallback(async () => {
    try {
      setLoading(true);
      setTripData(editingTrip);
      setCreatedTrip(editingTrip);
      if (editingTrip.selectedLocations) {
        setSelectedLocations(editingTrip.selectedLocations);
      }
      if (editingTrip.schedule) {
        setSchedule(editingTrip.schedule);
        setCurrentStep(4);
        const progress = getTripProgress(editingTrip.id);
        setTripProgress(progress);
      } else {
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setLoading(false);
    }
  }, [editingTrip]);

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
      let results = Array.isArray(locationsData) ? locationsData : (locationsData.results || []);
      results = results.map(loc => {
        let image = loc.image;
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
        setLocationsError("No locations found from the server.");
      }
      setAvailableLocations(results);
      setDistricts(districtsData);
    } catch (error) {
      setLocationsError("Error loading locations. Please try again.");
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

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!tripData.title.trim() || tripData.num_days < 1) {
      alert('Please fill in all required fields');
      return;
    }
    setCurrentStep(2);
  };

  const handleGenerateSchedule = async () => {
    if (selectedLocations.length === 0) {
      alert('Please select at least one location');
      return;
    }

    setLoading(true);
    try {
      const tripWithLocations = {
        ...tripData,
        selectedLocations,
        id: editingTrip?.id || `trip-${Date.now()}`
      };

      // Generate schedule
      const generatedSchedule = generateLocalSchedule(tripWithLocations);

      // Save trip with schedule
      const savedTrip = editingTrip 
        ? updateLocalTrip(editingTrip.id, { ...tripWithLocations, schedule: generatedSchedule })
        : saveLocalTrip({ ...tripWithLocations, schedule: generatedSchedule });

      setCreatedTrip(savedTrip);
      setSchedule(generatedSchedule);
      setCurrentStep(4);
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert('Error generating schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setTripData(prev => ({
          ...prev,
          start_location_latitude: latitude.toString(),
          start_location_longitude: longitude.toString(),
          start_location_name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        }));
        setLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not get your location. Please enter manually.');
        setLocating(false);
      }
    );
  };

  const handleMarkVisited = (dayIndex, visitIndex) => {
    if (createdTrip) {
      markLocationAsVisited(createdTrip.id, dayIndex, visitIndex);
      const progress = getTripProgress(createdTrip.id);
      setTripProgress(progress);
      // Update local state
      const updatedSchedule = { ...schedule };
      updatedSchedule.days[dayIndex].visits[visitIndex].visited = true;
      setSchedule(updatedSchedule);
    }
  };

  const handleSaveAndExit = () => {
    onTripSaved && onTripSaved();
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '2rem 1.5rem'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            {editingTrip ? 'Edit Your Trip' : 'Plan Your Journey'}
          </h1>
          <p style={{ margin: '0.75rem 0 0', fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)' }}>
            {currentStep === 1 && 'Tell us about your trip'}
            {currentStep === 2 && 'Choose locations to visit'}
            {currentStep === 3 && 'Generate your schedule'}
            {currentStep === 4 && 'Your personalized itinerary'}
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 12, 
          marginBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          {['Trip Details', 'Select Locations', 'Review', 'Schedule'].map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;
            return (
              <div 
                key={stepNum}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: isActive ? '#fff' : isCompleted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  color: isActive ? '#667eea' : '#fff',
                  padding: '12px 20px',
                  borderRadius: 50,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: isActive ? '0 8px 20px rgba(0,0,0,0.15)' : 'none',
                  cursor: isCompleted ? 'pointer' : 'default',
                  transition: 'all 0.2s'
                }}
                onClick={() => isCompleted && setCurrentStep(stepNum)}
              >
                <span style={{
                  background: isActive ? '#667eea' : isCompleted ? '#10b981' : 'rgba(255,255,255,0.3)',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {isCompleted ? '' : stepNum}
                </span>
                {label}
              </div>
            );
          })}
        </div>

        {/* Main Content Card */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: '3rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          minHeight: 500
        }}>
          {/* Step 1: Trip Details */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.95rem', color: '#374151' }}>
                  Trip Title *
                </label>
                <input
                  name="title"
                  type="text"
                  placeholder="e.g., Weekend GI Tour"
                  value={tripData.title}
                  onChange={handleTripDataChange}
                  required
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: 12,
                    border: '2px solid #e5e7eb',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.95rem', color: '#374151' }}>
                    Number of Days *
                  </label>
                  <input
                    name="num_days"
                    type="number"
                    min="1"
                    max="30"
                    value={tripData.num_days}
                    onChange={handleTripDataChange}
                    required
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: 12,
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                    How many days will your trip last?
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.95rem', color: '#374151' }}>
                    Starting Location *
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      name="start_location_name"
                      type="text"
                      placeholder="Bangalore"
                      value={tripData.start_location_name}
                      onChange={handleTripDataChange}
                      required
                      style={{
                        flex: 1,
                        padding: '1rem',
                        borderRadius: 12,
                        border: '2px solid #e5e7eb',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={locating}
                      style={{
                        padding: '1rem 1.5rem',
                        background: '#10b981',
                        color: '#fff',
                        borderRadius: 12,
                        border: 'none',
                        fontWeight: 700,
                        cursor: locating ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {locating ? 'Getting...' : 'Use My Location'}
                    </button>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                    Where will you start your journey?
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.95rem', color: '#374151' }}>
                    Preferred Start Time
                  </label>
                  <input
                    name="preferred_start_time"
                    type="time"
                    value={tripData.preferred_start_time}
                    onChange={handleTripDataChange}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: 12,
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.95rem', color: '#374151' }}>
                    Preferred End Time
                  </label>
                  <input
                    name="preferred_end_time"
                    type="time"
                    value={tripData.preferred_end_time}
                    onChange={handleTripDataChange}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: 12,
                      border: '2px solid #e5e7eb',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    padding: '1rem 2rem',
                    background: '#e5e7eb',
                    color: '#374151',
                    borderRadius: 50,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    color: '#fff',
                    borderRadius: 50,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(102,126,234,0.3)'
                  }}
                >
                  Next: Select Locations
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Select Locations */}
          {currentStep === 2 && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ margin: '0 0 1rem', fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
                  Choose Locations to Visit
                </h2>
                <p style={{ margin: 0, color: '#6b7280' }}>
                  Selected: {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 12, marginBottom: '2rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 250,
                    padding: '0.75rem 1rem',
                    borderRadius: 50,
                    border: '2px solid #e5e7eb',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 50,
                    border: '2px solid #e5e7eb',
                    fontSize: '0.95rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Districts</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {locationsError && (
                <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: 12, marginBottom: '1rem' }}>
                  {locationsError}
                </div>
              )}

              {/* Locations Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
                maxHeight: 600,
                overflowY: 'auto',
                marginBottom: '2rem'
              }}>
                {filteredLocations.map(location => {
                  const isSelected = selectedLocations.some(loc => loc.id === location.id);
                  return (
                    <div
                      key={location.id}
                      onClick={() => handleLocationToggle(location)}
                      style={{
                        background: isSelected ? '#ede9fe' : '#f9fafb',
                        border: isSelected ? '3px solid #667eea' : '2px solid #e5e7eb',
                        borderRadius: 16,
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: '2px solid #667eea',
                          background: isSelected ? '#667eea' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 4
                        }}>
                          {isSelected && <span style={{ color: '#fff', fontWeight: 700 }}></span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
                            {location.name}
                          </h3>
                          <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#667eea', fontWeight: 600 }}>
                            {location.district}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.5 }}>
                            {location.description}
                          </p>
                          <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                            Duration: {location.typical_visit_duration} mins
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <button
                  onClick={() => setCurrentStep(1)}
                  style={{
                    padding: '1rem 2rem',
                    background: '#e5e7eb',
                    color: '#374151',
                    borderRadius: 50,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={selectedLocations.length === 0}
                  style={{
                    padding: '1rem 2rem',
                    background: selectedLocations.length === 0 ? '#d1d5db' : 'linear-gradient(90deg, #667eea, #764ba2)',
                    color: '#fff',
                    borderRadius: 50,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: selectedLocations.length === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: selectedLocations.length > 0 ? '0 8px 20px rgba(102,126,234,0.3)' : 'none'
                  }}
                >
                  Next: Review ({selectedLocations.length})
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ margin: '0 0 1rem', fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
                  Review Your Trip
                </h2>
                <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: 16 }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700 }}>{tripData.title}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.95rem' }}>
                    <div><strong>Duration:</strong> {tripData.num_days} days</div>
                    <div><strong>Starting from:</strong> {tripData.start_location_name}</div>
                    <div><strong>Start time:</strong> {tripData.preferred_start_time}</div>
                    <div><strong>End time:</strong> {tripData.preferred_end_time}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700 }}>
                  Selected Locations ({selectedLocations.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedLocations.map((loc, idx) => (
                    <div key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem', background: '#f9fafb', borderRadius: 12 }}>
                      <span style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#667eea',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#1f2937' }}>{loc.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{loc.district}</div>
                      </div>
                      <button
                        onClick={() => handleLocationToggle(loc)}
                        style={{
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          borderRadius: 8,
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <button
                  onClick={() => setCurrentStep(2)}
                  style={{
                    padding: '1rem 2rem',
                    background: '#e5e7eb',
                    color: '#374151',
                    borderRadius: 50,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleGenerateSchedule}
                  disabled={loading}
                  style={{
                    padding: '1rem 2rem',
                    background: loading ? '#d1d5db' : 'linear-gradient(90deg, #10b981, #059669)',
                    color: '#fff',
                    borderRadius: 50,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: !loading ? '0 8px 20px rgba(16,185,129,0.3)' : 'none'
                  }}
                >
                  {loading ? 'Generating...' : 'Generate Schedule'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Schedule */}
          {currentStep === 4 && schedule && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ margin: '0 0 1rem', fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
                  Your Itinerary
                </h2>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowMap(!showMap)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#667eea',
                      color: '#fff',
                      borderRadius: 50,
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </button>
                  {tripProgress.total > 0 && (
                    <div style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', borderRadius: 50, fontWeight: 600 }}>
                      Progress: {tripProgress.visited}/{tripProgress.total} ({tripProgress.percentage}%)
                    </div>
                  )}
                </div>
              </div>

              {showMap && schedule.days && (
                <div style={{ marginBottom: '2rem', borderRadius: 16, overflow: 'hidden', height: 400 }}>
                  <TripMap trip={createdTrip} schedule={schedule} onClose={() => setShowMap(false)} />
                </div>
              )}

              {schedule.days && schedule.days.map((day, dayIdx) => (
                <div key={dayIdx} style={{ marginBottom: '2rem', background: '#f9fafb', padding: '1.5rem', borderRadius: 16 }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>
                    Day {day.day_number} - {day.date}
                  </h3>
                  {day.items && day.items.filter(item => item.item_type === 'location').map((item, itemIdx) => (
                    <div key={itemIdx} style={{
                      background: '#fff',
                      padding: '1rem',
                      borderRadius: 12,
                      marginBottom: 12,
                      border: item.visited ? '2px solid #10b981' : '2px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1f2937', marginBottom: 4 }}>
                            {item.location.name}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 8 }}>
                            {item.start_time} - {item.end_time} ({item.duration_minutes} mins)
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#667eea' }}>
                            {item.location.district}
                          </div>
                        </div>
                        {createdTrip && (
                          <button
                            onClick={() => handleMarkVisited(dayIdx, itemIdx)}
                            disabled={item.visited}
                            style={{
                              padding: '8px 16px',
                              background: item.visited ? '#10b981' : '#e5e7eb',
                              color: item.visited ? '#fff' : '#374151',
                              borderRadius: 8,
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: item.visited ? 'default' : 'pointer'
                            }}
                          >
                            {item.visited ? 'Visited' : 'Mark Visited'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, padding: '1rem', background: '#fffbeb', borderRadius: 12 }}>
                    <strong>Day Summary:</strong> {day.items ? day.items.filter(i => i.item_type === 'location').reduce((sum, i) => sum + i.duration_minutes, 0) : 0} mins visiting
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <button
                  onClick={() => setCurrentStep(3)}
                  style={{
                    padding: '1rem 2rem',
                    background: '#e5e7eb',
                    color: '#374151',
                    borderRadius: 50,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSaveAndExit}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    color: '#fff',
                    borderRadius: 50,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(16,185,129,0.3)'
                  }}
                >
                  Save & Exit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TripPlanner;
