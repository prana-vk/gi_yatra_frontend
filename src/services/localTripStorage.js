/**
 * Local Storage Service for Trip Planning
 * Stores trips in browser memory instead of backend server
 */

const TRIPS_STORAGE_KEY = 'giyatra_trips';
const TRIP_COUNTER_KEY = 'giyatra_trip_counter';

// Initialize counter if not exists
if (!localStorage.getItem(TRIP_COUNTER_KEY)) {
  localStorage.setItem(TRIP_COUNTER_KEY, '0');
}

/**
 * Get all trips from local storage
 */
export const getLocalTrips = () => {
  try {
    const trips = localStorage.getItem(TRIPS_STORAGE_KEY);
    return trips ? JSON.parse(trips) : [];
  } catch (error) {
    console.error('Error loading trips from local storage:', error);
    return [];
  }
};

/**
 * Get a single trip by ID
 */
export const getLocalTrip = (tripId) => {
  const trips = getLocalTrips();
  return trips.find(trip => trip.id === tripId);
};

/**
 * Save a new trip to local storage
 */
export const saveLocalTrip = (tripData) => {
  try {
    const trips = getLocalTrips();
    
    // Generate new ID
    let counter = parseInt(localStorage.getItem(TRIP_COUNTER_KEY) || '0');
    counter++;
    localStorage.setItem(TRIP_COUNTER_KEY, counter.toString());
    
    const newTrip = {
      ...tripData,
      id: counter,
      // maintain a legacy count field for UI compatibility
      selected_locations_count: (tripData.selectedLocations && tripData.selectedLocations.length) || tripData.selected_locations_count || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    trips.push(newTrip);
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    
    console.log('✅ Trip saved to local storage:', newTrip);
    return newTrip;
  } catch (error) {
    console.error('Error saving trip to local storage:', error);
    throw error;
  }
};

/**
 * Update an existing trip
 */
export const updateLocalTrip = (tripId, updatedData) => {
  try {
    const trips = getLocalTrips();
    const index = trips.findIndex(trip => trip.id === tripId);
    
    if (index === -1) {
      throw new Error('Trip not found');
    }
    
    trips[index] = {
      ...trips[index],
      ...updatedData,
      // keep legacy count in sync
      selected_locations_count: (updatedData.selectedLocations && updatedData.selectedLocations.length) || updatedData.selected_locations_count || trips[index].selected_locations_count || 0,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    
    console.log('✅ Trip updated in local storage:', trips[index]);
    return trips[index];
  } catch (error) {
    console.error('Error updating trip in local storage:', error);
    throw error;
  }
};

/**
 * Delete a trip
 */
export const deleteLocalTrip = (tripId) => {
  try {
    const trips = getLocalTrips();
    const filteredTrips = trips.filter(trip => trip.id !== tripId);
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(filteredTrips));
    
    console.log('✅ Trip deleted from local storage:', tripId);
    return true;
  } catch (error) {
    console.error('Error deleting trip from local storage:', error);
    throw error;
  }
};

/**
 * Mark a location as visited in a trip
 */
export const markLocationAsVisited = (tripId, locationId, visited = true) => {
  try {
    const trip = getLocalTrip(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    // Update visited status in schedule
    if (trip.schedule && trip.schedule.days) {
      trip.schedule.days.forEach(day => {
        day.items.forEach(item => {
          if (item.item_type === 'location' && item.location.id === locationId) {
            item.visited = visited;
            item.visited_at = visited ? new Date().toISOString() : null;
          }
        });
      });
    }

    // Update selected locations
    if (trip.selectedLocations) {
      trip.selectedLocations = trip.selectedLocations.map(loc => 
        loc.id === locationId ? { ...loc, visited, visited_at: visited ? new Date().toISOString() : null } : loc
      );
    }

    return updateLocalTrip(tripId, trip);
  } catch (error) {
    console.error('Error marking location as visited:', error);
    throw error;
  }
};

/**
 * Get trip progress (visited vs total locations)
 */
export const getTripProgress = (tripId) => {
  try {
    const trip = getLocalTrip(tripId);
    if (!trip || !trip.selectedLocations) {
      return { visited: 0, total: 0, percentage: 0 };
    }

    const total = trip.selectedLocations.length;
    const visited = trip.selectedLocations.filter(loc => loc.visited).length;
    const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;

    return { visited, total, percentage };
  } catch (error) {
    console.error('Error getting trip progress:', error);
    return { visited: 0, total: 0, percentage: 0 };
  }
};

/**
 * Add location to trip's selected locations
 */
export const addLocationToLocalTrip = (tripId, location, priority = null) => {
  try {
    const trip = getLocalTrip(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    
    // Initialize selectedLocations if not exists
    if (!trip.selectedLocations) {
      trip.selectedLocations = [];
    }
    
    // Check if location already added
    const exists = trip.selectedLocations.find(loc => loc.id === location.id);
    if (exists) {
      console.log('Location already added to trip');
      return trip;
    }
    
    // Add location with priority
    const locationWithPriority = {
      ...location,
      priority: priority || trip.selectedLocations.length + 1
    };
    
    trip.selectedLocations.push(locationWithPriority);
    
    // Update trip
    return updateLocalTrip(tripId, trip);
  } catch (error) {
    console.error('Error adding location to trip:', error);
    throw error;
  }
};

/**
 * Remove location from trip
 */
export const removeLocationFromLocalTrip = (tripId, locationId) => {
  try {
    const trip = getLocalTrip(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    
    if (!trip.selectedLocations) {
      return trip;
    }
    
    trip.selectedLocations = trip.selectedLocations.filter(
      loc => loc.id !== locationId
    );
    
    // Recalculate priorities
    trip.selectedLocations.forEach((loc, index) => {
      loc.priority = index + 1;
    });
    
    return updateLocalTrip(tripId, trip);
  } catch (error) {
    console.error('Error removing location from trip:', error);
    throw error;
  }
};

/**
 * Generate optimized schedule for trip
 * Uses greedy nearest neighbor algorithm
 */
export const generateLocalSchedule = (trip) => {
  try {
    if (!trip.selectedLocations || trip.selectedLocations.length === 0) {
      throw new Error('No locations selected for trip');
    }
    
    console.log('🗓️ Generating schedule for trip:', trip.title);
    
    const { 
      num_days = 3, 
      preferred_start_time = '09:00',
      preferred_end_time = '18:00',
      selectedLocations 
    } = trip;
    
    // Calculate available hours per day
    const [startHour, startMin] = preferred_start_time.split(':').map(Number);
    const [endHour, endMin] = preferred_end_time.split(':').map(Number);
    const dailyMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  // dailyHours intentionally unused; compute only if needed
    
    // Sort locations by priority
    const sortedLocations = [...selectedLocations].sort((a, b) => 
      (a.priority || 0) - (b.priority || 0)
    );
    
    // Generate schedule
    const schedule = {
      trip_id: trip.id,
      days: []
    };
    
    // Use current date as starting point (just for display, not critical)
    let currentDate = new Date();
    let locationIndex = 0;
    
    for (let dayNum = 1; dayNum <= num_days && locationIndex < sortedLocations.length; dayNum++) {
      const day = {
        day_number: dayNum,
        date: currentDate.toISOString().split('T')[0],
        items: []
      };
      
      let currentTime = new Date(currentDate);
      currentTime.setHours(startHour, startMin, 0);
      
      let remainingMinutes = dailyMinutes;
      
      // Add locations for this day
      while (remainingMinutes > 60 && locationIndex < sortedLocations.length) {
        const location = sortedLocations[locationIndex];
        const visitDuration = location.typical_visit_duration || 120;
        
        // Check if we have enough time
        if (visitDuration + 30 > remainingMinutes) {
          break; // Not enough time, move to next day
        }
        
        const startTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        
        // Add location visit
        currentTime.setMinutes(currentTime.getMinutes() + visitDuration);
        const endTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        
        day.items.push({
          item_type: 'location',
          location: location,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: visitDuration
        });
        
        remainingMinutes -= visitDuration;
        locationIndex++;
        
        // Add travel/break time between locations
        if (locationIndex < sortedLocations.length && remainingMinutes > 30) {
          const breakDuration = 30;
          const breakStart = endTime;
          currentTime.setMinutes(currentTime.getMinutes() + breakDuration);
          const breakEnd = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
          
          day.items.push({
            item_type: 'travel',
            description: `Travel to ${sortedLocations[locationIndex].name}`,
            start_time: breakStart,
            end_time: breakEnd,
            duration_minutes: breakDuration
          });
          
          remainingMinutes -= breakDuration;
        }
      }
      
      schedule.days.push(day);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('✅ Schedule generated:', schedule);
    return schedule;
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
};

/**
 * Clear all trips (for testing)
 */
export const clearAllLocalTrips = () => {
  localStorage.removeItem(TRIPS_STORAGE_KEY);
  localStorage.setItem(TRIP_COUNTER_KEY, '0');
  console.log('✅ All trips cleared from local storage');
};

/**
 * Export trips as JSON
 */
export const exportTrips = () => {
  const trips = getLocalTrips();
  const dataStr = JSON.stringify(trips, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `giyatra-trips-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  console.log('✅ Trips exported');
};

/**
 * Import trips from JSON file
 */
export const importTrips = (jsonData) => {
  try {
    const trips = JSON.parse(jsonData);
    if (!Array.isArray(trips)) {
      throw new Error('Invalid format');
    }
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    console.log('✅ Trips imported successfully');
    return trips;
  } catch (error) {
    console.error('Error importing trips:', error);
    throw error;
  }
};
