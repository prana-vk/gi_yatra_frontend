import { getAllGILocations } from '../services/giyatraApi';

/**
 * Test backend connection
 * This function tests if the backend API is accessible
 */
export const testBackendConnection = async () => {
  try {
  console.log('Testing backend connection to: https://backend-k4x8.onrender.com');
  const response = await getAllGILocations();
  console.log('Backend connection successful!');
  console.log('Received data:', response);
    const count = Array.isArray(response)
      ? response.length
      : (response?.results?.length || response?.items?.length || response?.data?.length || 0);
  console.log(`Found ${count} GI locations`);
    return {
      success: true,
      data: response,
      locationCount: count
    };
  } catch (error) {
  console.error('Backend connection failed!');
    console.error('Error details:', error.response?.data || error.message);
    
    if (error.code === 'ERR_NETWORK') {
  console.error('Network error - Backend server might be down or unreachable');
    } else if (error.response?.status === 404) {
  console.error('Endpoint not found - Check API URL');
    } else if (error.response?.status === 500) {
  console.error('Server error - Backend issue');
    }
    
    return {
      success: false,
      error: error.message,
      statusCode: error.response?.status
    };
  }
};

// Auto-test on import (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Auto-testing backend connection...');
  testBackendConnection();
}
