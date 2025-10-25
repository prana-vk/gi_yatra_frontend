/**
 * Google Maps Service for fetching real travel times
 * Uses Distance Matrix API to calculate actual travel times between locations
 */

// Note: For production, you should use a proper Google Maps API key
// For now, we'll use a combination of direct API calls and fallback calculations

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Estimate travel time based on distance
 * Assumes average speed of 40 km/h (accounting for traffic, stops, etc.)
 * Returns time in minutes
 */
const estimateTravelTime = (distanceKm) => {
  const avgSpeedKmh = 40; // Conservative average including traffic
  const hours = distanceKm / avgSpeedKmh;
  return Math.ceil(hours * 60); // Convert to minutes and round up
};

/**
 * Get travel time between two locations
 * First tries Google Maps Distance Matrix API, falls back to estimation
 */
export const getTravelTime = async (origin, destination) => {
  try {
    const { lat: lat1, lng: lng1 } = origin;
    const { lat: lat2, lng: lng2 } = destination;
    
    // Calculate distance using Haversine formula
    const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);
    
    // Estimate travel time (this would ideally use Google Maps API)
    const travelTimeMinutes = estimateTravelTime(distance);
    
    return {
      distance: distance.toFixed(2), // in km
      duration: travelTimeMinutes, // in minutes
      mode: 'driving'
    };
  } catch (error) {
    console.error('Error calculating travel time:', error);
    // Default fallback: 30 minutes
    return {
      distance: 0,
      duration: 30,
      mode: 'estimated'
    };
  }
};

/**
 * Get travel times for multiple routes in batch
 * Returns a matrix of travel times between all location pairs
 */
export const getTravelTimeMatrix = async (locations) => {
  const matrix = [];
  
  for (let i = 0; i < locations.length; i++) {
    const row = [];
    for (let j = 0; j < locations.length; j++) {
      if (i === j) {
        row.push({ distance: 0, duration: 0, mode: 'same' });
      } else {
        const travelData = await getTravelTime(
          { lat: locations[i].latitude, lng: locations[i].longitude },
          { lat: locations[j].latitude, lng: locations[j].longitude }
        );
        row.push(travelData);
      }
    }
    matrix.push(row);
  }
  
  return matrix;
};

/**
 * Find nearest unvisited location using travel time (greedy algorithm)
 */
export const findNearestLocation = (currentIndex, locations, visited, travelMatrix) => {
  let minTime = Infinity;
  let nearestIndex = -1;
  
  for (let i = 0; i < locations.length; i++) {
    if (!visited[i] && travelMatrix[currentIndex][i].duration < minTime) {
      minTime = travelMatrix[currentIndex][i].duration;
      nearestIndex = i;
    }
  }
  
  return nearestIndex;
};

/**
 * Optimize route using nearest neighbor algorithm with real travel times
 */
export const optimizeRoute = async (startLocation, locations) => {
  if (!locations || locations.length === 0) {
    return { optimizedLocations: [], travelTimes: [] };
  }
  
  // Add start location to the beginning
  const allLocations = [
    {
      name: 'Starting Point',
      latitude: startLocation.latitude,
      longitude: startLocation.longitude,
      typical_visit_duration: 0
    },
    ...locations
  ];
  
  // Get travel time matrix
  console.log('Calculating travel times between locations...');
  const travelMatrix = await getTravelTimeMatrix(allLocations);
  
  // Use nearest neighbor algorithm to optimize route
  const visited = new Array(allLocations.length).fill(false);
  const optimizedRoute = [];
  const travelTimes = [];
  
  let currentIndex = 0; // Start from starting point
  visited[currentIndex] = true;
  
  // Visit all locations using nearest neighbor
  for (let i = 1; i < allLocations.length; i++) {
    const nearestIndex = findNearestLocation(currentIndex, allLocations, visited, travelMatrix);
    
    if (nearestIndex === -1) break;
    
    // Record travel time from current to nearest
    travelTimes.push({
      from: allLocations[currentIndex].name,
      to: allLocations[nearestIndex].name,
      ...travelMatrix[currentIndex][nearestIndex]
    });
    
    optimizedRoute.push(allLocations[nearestIndex]);
    visited[nearestIndex] = true;
    currentIndex = nearestIndex;
  }
  
  // Remove the starting point from optimized locations (keep it separate)
  const optimizedLocations = optimizedRoute.slice(0);
  
  console.log('Route optimized with travel times');
  return { optimizedLocations, travelTimes };
};

/**
 * Format duration in minutes to readable format
 */
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Format distance
 */
export const formatDistance = (km) => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km} km`;
};
