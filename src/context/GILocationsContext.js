import React, { createContext, useContext, useState, useCallback } from 'react';
import { getAllGILocations } from '../services/giyatraApi';

const GILocationsContext = createContext();

export function useGILocations() {
  return useContext(GILocationsContext);
}

export function GILocationsProvider({ children }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastParams, setLastParams] = useState({});
  const [cache, setCache] = useState({});
  const [lastFetchAt, setLastFetchAt] = useState(null);
  const [lastFetchSource, setLastFetchSource] = useState('network'); // 'cache' | 'network'

  // Debounced fetch
  const fetchLocations = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    setLastParams(params);
    const key = JSON.stringify(params);
    if (cache[key]) {
      setLocations(cache[key]);
      setLastFetchSource('cache');
      setLastFetchAt(new Date());
      setLoading(false);
      return;
    }
    try {
      // Use axios API helper for consistent base URL and error handling
      const data = await getAllGILocations(params);
      // Normalize response: support array or paginated object shapes
      const results = Array.isArray(data)
        ? data
        : (data.results || data.items || data.data || []);
  setLocations(results);
  setCache(c => ({ ...c, [key]: results }));
  setLastFetchSource('network');
  setLastFetchAt(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const retry = () => fetchLocations(lastParams);

  // Simple health check (HEAD) using fetch; returns boolean
  const ping = async () => {
    try {
      const res = await fetch('/api/gi-locations/', { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  };

  return (
    <GILocationsContext.Provider value={{ locations, loading, error, fetchLocations, retry, lastFetchAt, lastFetchSource, ping }}>
      {children}
    </GILocationsContext.Provider>
  );
}
