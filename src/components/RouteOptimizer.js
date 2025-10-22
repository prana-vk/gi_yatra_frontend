import React, { useState, useEffect, useRef } from 'react';
import SafeImage from './SafeImage';
import { getAllGILocations } from '../services/giyatraApi';
import { giProducts } from '../data/karnatakaData';
import '../styles/RouteOptimizer.css';

function RouteOptimizer() {
  const [startPoint, setStartPoint] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [serverLocations, setServerLocations] = useState([]);
  const [displayLocations, setDisplayLocations] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [routeDetails, setRouteDetails] = useState([]);
  const [routeUrls, setRouteUrls] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [mapClickMarker, setMapClickMarker] = useState(null);
  const mapRef = useRef(null);
  const startMapRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const startMapInstanceRef = useRef(null);

  // Karnataka major cities with coordinates
  const majorCities = [
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946, district: 'Bengaluru Urban' },
    { name: 'Mysore', lat: 12.2958, lng: 76.6394, district: 'Mysuru' },
    { name: 'Hubli', lat: 15.3647, lng: 75.1240, district: 'Dharwad' },
    { name: 'Mangalore', lat: 12.9141, lng: 74.8560, district: 'Dakshina Kannada' },
    { name: 'Belgaum', lat: 15.8497, lng: 74.4977, district: 'Belagavi' },
    { name: 'Davangere', lat: 14.4644, lng: 75.9216, district: 'Davangere' },
    { name: 'Gulbarga', lat: 17.3297, lng: 76.8343, district: 'Kalaburagi' },
    { name: 'Shimoga', lat: 13.9299, lng: 75.5681, district: 'Shivamogga' },
    { name: 'Tumkur', lat: 13.3392, lng: 77.1019, district: 'Tumakuru' },
    { name: 'Bijapur', lat: 16.8302, lng: 75.7100, district: 'Vijayapura' }
  ];

  // Load Google Maps API
  useEffect(() => {
    // For demo purposes, we'll simulate map loading
    // To use real Google Maps, replace 'DEMO_MODE' with your actual Google Maps API key
    const API_KEY = 'DEMO_MODE'; 
    
    if (API_KEY === 'DEMO_MODE') {
      // Demo mode - simulate map loading
      setTimeout(() => setMapLoaded(true), 1000);
    } else if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,directions`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Google Maps');
        setMapLoaded(true); // Show demo version
      };
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Fetch GI locations from server
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await getAllGILocations();
        const locations = response.results || response || [];
        
        // Transform server locations to match our format
        const transformedLocations = locations.map(loc => ({
          id: `server-${loc.id}`,
          name: loc.name,
          district: loc.district_name || loc.district || 'Karnataka',
          lat: parseFloat(loc.latitude),
          lng: parseFloat(loc.longitude),
          image: loc.image_url || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=300',
          description: loc.description || '',
          category: 'GI Location',
          isServerLocation: true
        }));
        
        setServerLocations(transformedLocations);
        
        // Combine server locations with local giProducts data
        const combined = [...transformedLocations, ...giProducts.map(p => ({...p, isServerLocation: false}))];
        setDisplayLocations(combined);
      } catch (error) {
        console.error('Error fetching locations:', error);
        // Fallback to local data only
        setDisplayLocations(giProducts.map(p => ({...p, isServerLocation: false})));
      }
    };
    
    fetchLocations();
  }, []);

  // Initialize map when loaded
  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [mapLoaded]);

  const initializeMap = () => {
    if (window.google) {
      const mapOptions = {
        center: { lat: 14.5204, lng: 75.7224 }, // Center of Karnataka
        zoom: 7,
        mapTypeId: 'roadmap'
      };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        draggable: true,
        panel: null
      });
      directionsRendererRef.current.setMap(mapInstanceRef.current);
    } else {
      // Demo mode - show a placeholder map
      if (mapRef.current) {
        mapRef.current.innerHTML = `
          <div class="demo-map">
            <h3>🗺️ Interactive Route Map</h3>
            <p>Google Maps integration ready!</p>
            <p>Add your Google Maps API key to see live maps and directions.</p>
            <div class="demo-route-visual">
              <div class="route-line"></div>
              <div class="waypoint start">Start</div>
              <div class="waypoint middle">Route</div>
              <div class="waypoint end">End</div>
            </div>
          </div>
        `;
      }
    }
  };

  const initializeStartPointMap = () => {
    if (window.google && startMapRef.current) {
      const mapOptions = {
        center: { lat: 14.5204, lng: 75.7224 }, // Center of Karnataka
        zoom: 7,
        mapTypeId: 'roadmap'
      };

      startMapInstanceRef.current = new window.google.maps.Map(startMapRef.current, mapOptions);
      
      // Add click listener to select starting point
      startMapInstanceRef.current.addListener('click', (event) => {
        const clickedLat = event.latLng.lat();
        const clickedLng = event.latLng.lng();
        
        // Remove old marker if exists
        if (mapClickMarker) {
          mapClickMarker.setMap(null);
        }
        
        // Create new marker
        const newMarker = new window.google.maps.Marker({
          position: { lat: clickedLat, lng: clickedLng },
          map: startMapInstanceRef.current,
          title: 'Starting Point',
          animation: window.google.maps.Animation.DROP
        });
        
        setMapClickMarker(newMarker);
        setStartCoords({ lat: clickedLat, lng: clickedLng });
        setStartPoint(`Custom Location (${clickedLat.toFixed(4)}, ${clickedLng.toFixed(4)})`);
      });
      
      // Add markers for all locations
      displayLocations.forEach(location => {
        if (location.lat && location.lng) {
          new window.google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: startMapInstanceRef.current,
            title: location.name,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }
          });
        }
      });
    }
  };

  const toggleMapSelector = () => {
    setShowMapSelector(!showMapSelector);
    if (!showMapSelector) {
      // Initialize map when modal opens
      setTimeout(() => initializeStartPointMap(), 100);
    }
  };

  const handleLocationSelect = (location) => {
    const isSelected = selectedLocations.find(loc => loc.id === location.id);
    if (isSelected) {
      setSelectedLocations(prev => prev.filter(loc => loc.id !== location.id));
    } else {
      // Use actual coordinates if available, otherwise approximate
      const locationWithCoords = {
        ...location,
        lat: location.lat || (location.latitude ? parseFloat(location.latitude) : 14.5204),
        lng: location.lng || (location.longitude ? parseFloat(location.longitude) : 75.7224)
      };
      setSelectedLocations(prev => [...prev, locationWithCoords]);
    }
  };

  const calculateOptimalRoute = async () => {
    if (!startPoint || selectedLocations.length < 2) {
      alert('Please select a starting point and at least 2 destinations');
      return;
    }

    setLoading(true);
    setIsOptimizing(true);

    try {
      let startLocation;
      
      // Check if we have custom coordinates from map selection
      if (startCoords) {
        startLocation = {
          name: startPoint,
          lat: startCoords.lat,
          lng: startCoords.lng,
          isStart: true
        };
      } else {
        // Try to find from major cities
        const startCity = majorCities.find(city => city.name === startPoint);
        if (!startCity) {
          alert('Please select a valid starting point or click on the map');
          setLoading(false);
          setIsOptimizing(false);
          return;
        }
        startLocation = { ...startCity, name: `Start: ${startCity.name}`, isStart: true };
      }

      // Calculate distances between all points using Haversine formula
      const allPoints = [
        startLocation,
        ...selectedLocations
      ];

      // Simple greedy algorithm for TSP (Traveling Salesman Problem)
  const optimizedOrder = optimizeRoute(allPoints);

  // Build provider URLs immediately (no API keys required)
  setRouteUrls(buildProviderUrls(optimizedOrder));
      
      // Calculate route using Google Directions API
      await calculateDirections(optimizedOrder);

    } catch (error) {
      console.error('Route optimization error:', error);
      alert('Error calculating optimal route. Please try again.');
    } finally {
      setLoading(false);
      setIsOptimizing(false);
    }
  };

  // Build URLs for various providers using only lat/lng, with safe waypoint caps
  const buildProviderUrls = (points) => {
    try {
      if (!points || points.length < 2) return null;
      const fmt = (p) => `${p.lat},${p.lng}`;
      const origin = points[0];
      const destination = points[points.length - 1];
      const mids = points.slice(1, -1);

      // Caps to avoid provider limits
      const googleMid = mids.slice(0, 23);
      const appleMid = mids.slice(0, 9);
      const bingMid = mids.slice(0, 24);

      const google = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fmt(origin))}&destination=${encodeURIComponent(fmt(destination))}` +
        (googleMid.length ? `&waypoints=${encodeURIComponent(googleMid.map(fmt).join('|'))}` : '') +
        `&travelmode=driving`;

      const apple = `http://maps.apple.com/?saddr=${encodeURIComponent(fmt(origin))}&daddr=${encodeURIComponent(fmt(destination))}` +
        (appleMid.length ? encodeURI(appleMid.map(pt => `+to:${fmt(pt)}`).join('')) : '');

      const bing = `https://www.bing.com/maps?rtp=${encodeURIComponent(['pos.' + fmt(origin).replace(',', '_'), ...bingMid.map(p => 'pos.' + fmt(p).replace(',', '_')), 'pos.' + fmt(destination).replace(',', '_')].join('~'))}`;

      const osm = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(fmt(origin))};${encodeURIComponent(fmt(destination))}`;

      return { google, apple, bing, osm };
    } catch (e) {
      return null;
    }
  };

  const optimizeRoute = (points) => {
    if (points.length <= 2) return points;

    const start = points.find(p => p.isStart);
    const destinations = points.filter(p => !p.isStart);
    
    const optimized = [start];
    let remaining = [...destinations];
    let current = start;

    // Greedy nearest neighbor algorithm
    while (remaining.length > 0) {
      let nearest = remaining[0];
      let nearestDistance = getDistance(current, nearest);

      for (let i = 1; i < remaining.length; i++) {
        const distance = getDistance(current, remaining[i]);
        if (distance < nearestDistance) {
          nearest = remaining[i];
          nearestDistance = distance;
        }
      }

      optimized.push(nearest);
      remaining = remaining.filter(p => p.id !== nearest.id);
      current = nearest;
    }

    return optimized;
  };

  const getDistance = (point1, point2) => {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDirections = async (optimizedPoints) => {
    if (window.google && directionsServiceRef.current && optimizedPoints.length >= 2) {
      // Real Google Maps directions
      const waypoints = optimizedPoints.slice(1, -1).map(point => ({
        location: new window.google.maps.LatLng(point.lat, point.lng),
        stopover: true
      }));

      const request = {
        origin: new window.google.maps.LatLng(optimizedPoints[0].lat, optimizedPoints[0].lng),
        destination: new window.google.maps.LatLng(
          optimizedPoints[optimizedPoints.length - 1].lat, 
          optimizedPoints[optimizedPoints.length - 1].lng
        ),
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC
      };

      return new Promise((resolve, reject) => {
        directionsServiceRef.current.route(request, (result, status) => {
          if (status === 'OK') {
            directionsRendererRef.current.setDirections(result);
            
            // Calculate detailed route information from Google response
            const legs = result.routes[0].legs;
            let totalDistance = 0;
            let totalTime = 0;
            const routeDetails = [];
            let currentTime = new Date();
            currentTime.setHours(9, 0, 0); // Start at 9 AM

            legs.forEach((leg, index) => {
              const arrivalTime = new Date(currentTime);
              arrivalTime.setMinutes(arrivalTime.getMinutes() + Math.ceil(leg.duration.value / 60));
              
              routeDetails.push({
                from: index === 0 ? `Start: ${startPoint}` : optimizedPoints[index].name,
                to: optimizedPoints[index + 1].name,
                distance: leg.distance.text,
                duration: leg.duration.text,
                arrivalTime: arrivalTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                instructions: leg.steps.map(step => step.instructions).slice(0, 3)
              });

              totalDistance += leg.distance.value;
              totalTime += leg.duration.value;
              
              // Add 1-2 hours for sightseeing at each location
              currentTime = new Date(arrivalTime);
              currentTime.setHours(currentTime.getHours() + Math.random() * 1 + 1);
            });

            setRouteDetails(routeDetails);
            setOptimizedRoute({
              totalDistance: (totalDistance / 1000).toFixed(1) + ' km',
              totalTime: Math.ceil(totalTime / 3600) + ' hours',
              estimatedCost: '₹' + Math.ceil(totalDistance * 0.008), // ₹8 per km
              points: optimizedPoints
            });

            resolve();
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });
    } else {
      // Demo mode - simulate route calculations
      let totalDistance = 0;
      const routeDetails = [];
      let currentTime = new Date();
      currentTime.setHours(9, 0, 0); // Start at 9 AM

      for (let i = 0; i < optimizedPoints.length - 1; i++) {
        const distance = getDistance(optimizedPoints[i], optimizedPoints[i + 1]);
        const duration = Math.ceil(distance / 50 * 60); // Assume 50 km/h average speed
        
        const arrivalTime = new Date(currentTime);
        arrivalTime.setMinutes(arrivalTime.getMinutes() + duration);
        
        routeDetails.push({
          from: i === 0 ? `Start: ${startPoint}` : optimizedPoints[i].name,
          to: optimizedPoints[i + 1].name,
          distance: distance.toFixed(1) + ' km',
          duration: Math.ceil(duration / 60) + ' hours ' + (duration % 60) + ' min',
          arrivalTime: arrivalTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          instructions: [
            `Head towards ${optimizedPoints[i + 1].district}`,
            `Follow the main highway for ${Math.ceil(distance * 0.8)} km`,
            `Take the exit towards ${optimizedPoints[i + 1].name}`
          ]
        });

        totalDistance += distance;
        
        // Add 1-2 hours for sightseeing at each location
        currentTime = new Date(arrivalTime);
        currentTime.setHours(currentTime.getHours() + 1.5);
      }

      setRouteDetails(routeDetails);
      setOptimizedRoute({
        totalDistance: totalDistance.toFixed(1) + ' km',
        totalTime: Math.ceil(totalDistance / 50 + optimizedPoints.length * 1.5) + ' hours',
        estimatedCost: '₹' + Math.ceil(totalDistance * 8), // ₹8 per km
        points: optimizedPoints
      });
    }
  };

  return (
    <div className="route-optimizer">
      <div className="route-header">
        <h2>🗺️ Smart Route Planner</h2>
        <p>Plan the optimal route to visit Karnataka's GI locations</p>
      </div>

      <div className="route-container">
        {/* Left Panel - Controls */}
        <div className="route-controls">
          {/* Starting Point Selection */}
          <div className="control-section">
            <h3>📍 Select Starting Point</h3>
            <select 
              value={startPoint} 
              onChange={(e) => {
                setStartPoint(e.target.value);
                setStartCoords(null); // Clear custom coordinates when selecting from dropdown
              }}
              className="start-point-select"
            >
              <option value="">Choose your starting city</option>
              {majorCities.map(city => (
                <option key={city.name} value={city.name}>
                  {city.name} ({city.district})
                </option>
              ))}
            </select>
            
            <div className="or-divider">
              <span>OR</span>
            </div>
            
            <button 
              className="map-selector-btn"
              onClick={toggleMapSelector}
            >
              🗺️ Select from Map
            </button>
            
            {startCoords && (
              <div className="selected-coords">
                ✓ Custom location: {startCoords.lat.toFixed(4)}, {startCoords.lng.toFixed(4)}
              </div>
            )}
          </div>

          {/* Location Selection */}
          <div className="control-section">
            <h3>🎯 Select GI Locations to Visit</h3>
            <p className="location-count">
              {serverLocations.length > 0 ? 
                `${serverLocations.length} locations from server + ${giProducts.length} featured items` :
                `${giProducts.length} featured items`
              }
            </p>
            <div className="locations-grid">
              {displayLocations.map(location => (
                <div 
                  key={location.id}
                  className={`location-card ${selectedLocations.find(loc => loc.id === location.id) ? 'selected' : ''}`}
                  onClick={() => handleLocationSelect(location)}
                >
                  <SafeImage src={location.image} alt={location.name} />
                  <div className="location-info">
                    <h4>{location.name}</h4>
                    <p>📍 {location.district}</p>
                    <span className="category">{location.category}</span>
                  </div>
                  {selectedLocations.find(loc => loc.id === location.id) && (
                    <div className="selected-badge">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Locations Summary */}
          {selectedLocations.length > 0 && (
            <div className="control-section">
              <h3>✅ Selected Locations ({selectedLocations.length})</h3>
              <div className="selected-summary">
                {selectedLocations.map(location => (
                  <div key={location.id} className="selected-item">
                    <span>{location.name}</span>
                    <button 
                      onClick={() => handleLocationSelect(location)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Button */}
          <div className="control-section">
            <button 
              className="start-journey-btn"
              onClick={calculateOptimalRoute}
              disabled={loading || !startPoint || selectedLocations.length < 2}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  {isOptimizing ? 'Optimizing Route...' : 'Calculating...'}
                </>
              ) : (
                <>
                  🚀 Start Journey Planning
                </>
              )}
            </button>
          </div>

          {/* Route Summary */}
          {optimizedRoute && (
            <div className="route-summary">
              <h3>📊 Route Summary</h3>
              <div className="summary-stats">
                <div className="stat">
                  <span className="label">Total Distance:</span>
                  <span className="value">{optimizedRoute.totalDistance}</span>
                </div>
                <div className="stat">
                  <span className="label">Estimated Time:</span>
                  <span className="value">{optimizedRoute.totalTime}</span>
                </div>
                <div className="stat">
                  <span className="label">Estimated Cost:</span>
                  <span className="value">{optimizedRoute.estimatedCost}</span>
                </div>
              </div>
              {routeUrls && (
                <div className="route-links">
                  <h4>Open Route In</h4>
                  <div className="link-buttons">
                    <button onClick={() => window.open(routeUrls.google, '_blank')} className="open-map-btn">Google Maps</button>
                    <button onClick={() => window.open(routeUrls.apple, '_blank')} className="open-map-btn">Apple Maps</button>
                    <button onClick={() => window.open(routeUrls.bing, '_blank')} className="open-map-btn">Bing Maps</button>
                    <button onClick={() => window.open(routeUrls.osm, '_blank')} className="open-map-btn">OpenStreetMap</button>
                  </div>
                  <details>
                    <summary>Show URLs</summary>
                    <div className="urls-list">
                      {Object.entries(routeUrls).map(([key, url]) => (
                        <div key={key} className="url-item">
                          <label>{key.toUpperCase()}</label>
                          <input type="text" readOnly value={url} onFocus={(e) => e.target.select()} />
                          <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(url)}>Copy</button>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Map and Route Details */}
        <div className="route-display">
          {/* Google Map */}
          <div className="map-container">
            <div ref={mapRef} className="google-map"></div>
            {!mapLoaded && (
              <div className="map-placeholder">
                <div className="loading-map">
                  <div className="spinner"></div>
                  <p>Loading Google Maps...</p>
                </div>
              </div>
            )}
          </div>

          {/* Route Details */}
          {routeDetails.length > 0 && (
            <div className="route-details">
              <h3>🛣️ Detailed Route Plan</h3>
              <div className="route-timeline">
                {routeDetails.map((detail, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">{index + 1}</div>
                    <div className="timeline-content">
                      <div className="route-segment">
                        <div className="segment-header">
                          <h4>{detail.from} → {detail.to}</h4>
                          <span className="arrival-time">🕘 {detail.arrivalTime}</span>
                        </div>
                        <div className="segment-details">
                          <span className="distance">📏 {detail.distance}</span>
                          <span className="duration">⏱️ {detail.duration}</span>
                        </div>
                        <div className="directions">
                          {detail.instructions.slice(0, 2).map((instruction, idx) => (
                            <p key={idx} className="instruction" 
                               dangerouslySetInnerHTML={{__html: instruction}}>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Map Selector Modal */}
      {showMapSelector && (
        <div className="map-selector-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🗺️ Select Starting Point from Map</h3>
              <button className="close-modal" onClick={toggleMapSelector}>✕</button>
            </div>
            <div className="modal-body">
              <p className="instruction">
                Click anywhere on the map to set your starting point. 
                Blue markers show all available GI locations.
              </p>
              <div ref={startMapRef} className="start-map-container"></div>
            </div>
            <div className="modal-footer">
              <button className="confirm-btn" onClick={toggleMapSelector}>
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteOptimizer;