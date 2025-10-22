import axios from 'axios';

// Prefer relative URL in development so CRA proxy can avoid CORS/network issues
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? ''
  : 'https://backend-k4x8.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ========== AUTHENTICATION ==========

export const signup = async (email, password) => {
  try {
    const response = await api.post('/api/auth/signup/', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const response = await api.post('/api/auth/login/', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await api.post('/api/auth/logout/');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me/');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

// ========== GI LOCATIONS ==========

export const getAllGILocations = async (params = {}) => {
  try {
    console.log('🌐 Fetching GI Locations from backend...');
    const response = await api.get('/api/gi-locations/', { params });
    console.log('✅ Backend Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching GI locations:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

export const getGILocationById = async (id) => {
  try {
    const response = await api.get(`/api/gi-locations/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching location ${id}:`, error);
    throw error;
  }
};

export const createGILocation = async (data) => {
  try {
    const response = await api.post('/api/gi-locations/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

export const createGILocationWithImage = async (formData) => {
  try {
    const response = await api.post('/api/gi-locations/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating location with image:', error);
    throw error;
  }
};

export const updateGILocation = async (id, data) => {
  try {
    const response = await api.patch(`/api/gi-locations/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating location ${id}:`, error);
    throw error;
  }
};

export const deleteGILocation = async (id) => {
  try {
    await api.delete(`/api/gi-locations/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting location ${id}:`, error);
    throw error;
  }
};

export const searchGILocations = async (searchTerm) => {
  try {
    const response = await api.get('/api/gi-locations/', {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching locations:', error);
    throw error;
  }
};

export const filterGILocationsByDistrict = async (district) => {
  try {
    const response = await api.get('/api/gi-locations/', {
      params: { district }
    });
    return response.data;
  } catch (error) {
    console.error('Error filtering by district:', error);
    throw error;
  }
};

export const getAllDistricts = async () => {
  try {
    const response = await api.get('/api/gi-locations/districts/');
    console.log('Districts API Response:', response.data);
    return response.data.districts || [];
  } catch (error) {
    console.error('Error fetching districts:', error);
    // Return empty array as fallback
    return [];
  }
};

export const getLocationsByDistrict = async () => {
  try {
    const response = await api.get('/api/gi-locations/by_district/');
    return response.data;
  } catch (error) {
    console.error('Error fetching grouped locations:', error);
    throw error;
  }
};

// ========== AD LOCATIONS ==========

export const getAllAdLocations = async (params = {}) => {
  try {
    const response = await api.get('/api/ad-locations/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching ad locations:', error);
    throw error;
  }
};

export const getAdLocationById = async (id) => {
  try {
    const response = await api.get(`/api/ad-locations/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ad location ${id}:`, error);
    throw error;
  }
};

export const createAdLocation = async (data) => {
  try {
    const response = await api.post('/api/ad-locations/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating ad location:', error);
    throw error;
  }
};

export const updateAdLocation = async (id, data) => {
  try {
    const response = await api.patch(`/api/ad-locations/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating ad location ${id}:`, error);
    throw error;
  }
};

export const deleteAdLocation = async (id) => {
  try {
    await api.delete(`/api/ad-locations/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting ad location ${id}:`, error);
    throw error;
  }
};

export const filterAdLocationsByService = async (serviceType) => {
  try {
    const response = await api.get('/api/ad-locations/', {
      params: { service_type: serviceType }
    });
    return response.data;
  } catch (error) {
    console.error('Error filtering by service type:', error);
    throw error;
  }
};

export const getAllServiceTypes = async () => {
  try {
    const response = await api.get('/api/ad-locations/service_types/');
    return response.data.service_types;
  } catch (error) {
    console.error('Error fetching service types:', error);
    throw error;
  }
};

export const getLocationsByServiceType = async () => {
  try {
    const response = await api.get('/api/ad-locations/by_service_type/');
    return response.data;
  } catch (error) {
    console.error('Error fetching grouped ad locations:', error);
    throw error;
  }
};

// ========== TRIP PLANNING ==========

export const getAllTrips = async () => {
  try {
    const response = await api.get('/api/trips/');
    return response.data;
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw error;
  }
};

export const getTripById = async (id) => {
  try {
    const response = await api.get(`/api/trips/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching trip ${id}:`, error);
    throw error;
  }
};

export const createTrip = async (data) => {
  try {
    const response = await api.post('/api/trips/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

export const updateTrip = async (id, data) => {
  try {
    const response = await api.patch(`/api/trips/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating trip ${id}:`, error);
    throw error;
  }
};

export const deleteTrip = async (id) => {
  try {
    await api.delete(`/api/trips/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting trip ${id}:`, error);
    throw error;
  }
};

export const addLocationToTrip = async (tripId, locationId, priority = 1) => {
  try {
    const response = await api.post(`/api/trips/${tripId}/add_location/`, {
      gi_location_id: locationId,
      priority
    });
    return response.data;
  } catch (error) {
    console.error('Error adding location to trip:', error);
    throw error;
  }
};

export const removeLocationFromTrip = async (tripId, selectedLocationId) => {
  try {
    const response = await api.post(`/api/trips/${tripId}/remove_location/`, {
      selected_location_id: selectedLocationId
    });
    return response.data;
  } catch (error) {
    console.error('Error removing location from trip:', error);
    throw error;
  }
};

export const generateTripSchedule = async (tripId) => {
  try {
    const response = await api.post(`/api/trips/${tripId}/generate_schedule/`);
    return response.data;
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
};

export const getTripSchedule = async (tripId) => {
  try {
    const response = await api.get(`/api/trips/${tripId}/schedule/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
};

export const getTripDays = async (tripId) => {
  try {
    const response = await api.get(`/api/trips/${tripId}/days/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trip days:', error);
    throw error;
  }
};

export const getSelectedLocations = async (tripId) => {
  try {
    const response = await api.get(`/api/trips/${tripId}/selected_locations/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching selected locations:', error);
    throw error;
  }
};

export default api;