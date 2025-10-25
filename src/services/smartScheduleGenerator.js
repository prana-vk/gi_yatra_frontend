/**
 * Enhanced Schedule Generator with Real Travel Times
 * Uses Google Maps Service to fetch actual travel times between locations
 * Combines with backend's typical_visit_duration for realistic scheduling
 */

import { optimizeRoute, formatDuration } from './googleMapsService';

/**
 * Generate realistic schedule with actual travel times
 * Returns schedule with feasibility analysis
 */
export const generateSmartSchedule = async (trip) => {
  try {
    if (!trip.selectedLocations || trip.selectedLocations.length === 0) {
      throw new Error('No locations selected for trip');
    }
    
  console.log('Generating smart schedule with real travel times...');
    
    const { 
      num_days = 3, 
      preferred_start_time = '09:00',
      preferred_end_time = '18:00',
      start_location_latitude,
      start_location_longitude,
      start_location_name = 'Starting Point',
      selectedLocations 
    } = trip;
    
    // Calculate available minutes per day
    const [startHour, startMin] = preferred_start_time.split(':').map(Number);
    const [endHour, endMin] = preferred_end_time.split(':').map(Number);
    const dailyMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
  console.log(`Available time: ${dailyMinutes} mins/day (${num_days} days)`);
    
    // Sort locations by priority
    const sortedLocations = [...selectedLocations].sort((a, b) => 
      (a.priority || 0) - (b.priority || 0)
    );
    
    // Optimize route with real travel times
    const startLocation = {
      latitude: parseFloat(start_location_latitude),
      longitude: parseFloat(start_location_longitude),
      name: start_location_name
    };
    
    const { optimizedLocations, travelTimes } = await optimizeRoute(
      startLocation,
      sortedLocations
    );
    
    // Generate schedule with realistic timing
    const schedule = {
      trip_id: trip.id,
      days: [],
      summary: {
        totalLocations: optimizedLocations.length,
        coveredLocations: 0,
        uncoveredLocations: [],
        totalTravelTime: 0,
        totalVisitTime: 0,
        isFeasible: true,
        warnings: []
      }
    };
    
    let currentDate = new Date();
    let locationIndex = 0;
    let totalTravelTime = 0;
    let totalVisitTime = 0;
    
    // Distribute locations across days
    for (let dayNum = 1; dayNum <= num_days && locationIndex < optimizedLocations.length; dayNum++) {
      const day = {
        day_number: dayNum,
        date: currentDate.toISOString().split('T')[0],
        items: [],
        summary: {
          totalTime: 0,
          travelTime: 0,
          visitTime: 0,
          locationsVisited: 0
        }
      };
      
      let currentTime = new Date(currentDate);
      currentTime.setHours(startHour, startMin, 0);
      let remainingMinutes = dailyMinutes;
      
      // First location of the day - add travel from start
      if (locationIndex < optimizedLocations.length) {
        const location = optimizedLocations[locationIndex];
        const travelInfo = travelTimes[locationIndex] || { duration: 30, distance: 0 };
        const travelDuration = Math.max(travelInfo.duration, 15); // Minimum 15 mins travel
        const visitDuration = location.typical_visit_duration || 120;
        
        // Check if we can fit travel + visit in remaining time
        const totalRequired = travelDuration + visitDuration;
        
        if (totalRequired > remainingMinutes) {
          // Can't fit even first location of the day
          schedule.summary.warnings.push(
            `Day ${dayNum}: Not enough time for ${location.name} (needs ${formatDuration(totalRequired)}, have ${formatDuration(remainingMinutes)})`
          );
          break; // Move to next day or end
        }
        
        // Add travel to location
        const travelStartTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        currentTime.setMinutes(currentTime.getMinutes() + travelDuration);
        const travelEndTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        
        day.items.push({
          item_type: 'travel',
          description: `Travel to ${location.name}`,
          from: dayNum === 1 && locationIndex === 0 ? start_location_name : optimizedLocations[locationIndex - 1]?.name,
          to: location.name,
          start_time: travelStartTime,
          end_time: travelEndTime,
          duration_minutes: travelDuration,
          distance: travelInfo.distance || 0
        });
        
        remainingMinutes -= travelDuration;
        day.summary.travelTime += travelDuration;
        totalTravelTime += travelDuration;
        
        // Add location visit
        const visitStartTime = travelEndTime;
        currentTime.setMinutes(currentTime.getMinutes() + visitDuration);
        const visitEndTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        
        day.items.push({
          item_type: 'location',
          location: location,
          start_time: visitStartTime,
          end_time: visitEndTime,
          duration_minutes: visitDuration
        });
        
        remainingMinutes -= visitDuration;
        day.summary.visitTime += visitDuration;
        day.summary.locationsVisited++;
        totalVisitTime += visitDuration;
        locationIndex++;
        
        // Try to fit more locations in this day
        while (remainingMinutes > 60 && locationIndex < optimizedLocations.length) {
          const nextLocation = optimizedLocations[locationIndex];
          const nextTravel = travelTimes[locationIndex] || { duration: 30, distance: 0 };
          const nextTravelDuration = Math.max(nextTravel.duration, 15);
          const nextVisitDuration = nextLocation.typical_visit_duration || 120;
          const nextTotalRequired = nextTravelDuration + nextVisitDuration;
          
          if (nextTotalRequired > remainingMinutes) {
            // Can't fit next location, end this day
            schedule.summary.warnings.push(
              `Day ${dayNum}: Cannot fit ${nextLocation.name} (needs ${formatDuration(nextTotalRequired)}, have ${formatDuration(remainingMinutes)} left)`
            );
            break;
          }
          
          // Add travel to next location
          const nextTravelStart = visitEndTime;
          currentTime.setMinutes(currentTime.getMinutes() + nextTravelDuration);
          const nextTravelEnd = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
          
          day.items.push({
            item_type: 'travel',
            description: `Travel to ${nextLocation.name}`,
            from: location.name,
            to: nextLocation.name,
            start_time: nextTravelStart,
            end_time: nextTravelEnd,
            duration_minutes: nextTravelDuration,
            distance: nextTravel.distance || 0
          });
          
          remainingMinutes -= nextTravelDuration;
          day.summary.travelTime += nextTravelDuration;
          totalTravelTime += nextTravelDuration;
          
          // Add next location visit
          const nextVisitStart = nextTravelEnd;
          currentTime.setMinutes(currentTime.getMinutes() + nextVisitDuration);
          const nextVisitEnd = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
          
          day.items.push({
            item_type: 'location',
            location: nextLocation,
            start_time: nextVisitStart,
            end_time: nextVisitEnd,
            duration_minutes: nextVisitDuration
          });
          
          remainingMinutes -= nextVisitDuration;
          day.summary.visitTime += nextVisitDuration;
          day.summary.locationsVisited++;
          totalVisitTime += nextVisitDuration;
          locationIndex++;
        }
      }
      
      day.summary.totalTime = dailyMinutes - remainingMinutes;
      schedule.days.push(day);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Update summary
    schedule.summary.coveredLocations = locationIndex;
    schedule.summary.totalTravelTime = totalTravelTime;
    schedule.summary.totalVisitTime = totalVisitTime;
    
    // Check if all locations were covered
    if (locationIndex < optimizedLocations.length) {
      schedule.summary.isFeasible = false;
      schedule.summary.uncoveredLocations = optimizedLocations.slice(locationIndex).map(loc => loc.name);
      schedule.summary.warnings.push(
        `Cannot cover all locations! ${optimizedLocations.length - locationIndex} location(s) not scheduled: ${schedule.summary.uncoveredLocations.join(', ')}`
      );
    } else {
      schedule.summary.isFeasible = true;
      schedule.summary.warnings.push(
        `All ${optimizedLocations.length} locations successfully scheduled!`
      );
    }
    
    console.log('Smart schedule generated:', schedule);
    return schedule;
    
  } catch (error) {
    console.error('Error generating smart schedule:', error);
    throw error;
  }
};

/**
 * Calculate total trip statistics
 */
export const calculateTripStats = (schedule) => {
  if (!schedule || !schedule.days) {
    return null;
  }
  
  let totalDistance = 0;
  let totalTravelTime = 0;
  let totalVisitTime = 0;
  let totalLocations = 0;
  
  schedule.days.forEach(day => {
    day.items.forEach(item => {
      if (item.item_type === 'travel') {
        totalTravelTime += item.duration_minutes;
        totalDistance += parseFloat(item.distance || 0);
      } else if (item.item_type === 'location') {
        totalVisitTime += item.duration_minutes;
        totalLocations++;
      }
    });
  });
  
  return {
    totalDistance: totalDistance.toFixed(2),
    totalTravelTime: formatDuration(totalTravelTime),
    totalVisitTime: formatDuration(totalVisitTime),
    totalTime: formatDuration(totalTravelTime + totalVisitTime),
    totalLocations,
    avgTimePerLocation: totalLocations > 0 ? formatDuration(Math.round(totalVisitTime / totalLocations)) : '0',
    travelPercentage: totalTravelTime + totalVisitTime > 0 
      ? Math.round((totalTravelTime / (totalTravelTime + totalVisitTime)) * 100)
      : 0
  };
};
