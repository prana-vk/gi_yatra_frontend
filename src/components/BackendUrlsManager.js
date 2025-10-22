import React, { useEffect, useState } from 'react';
import api, { getApiBaseUrl, setApiBaseUrl } from '../services/giyatraApi';

export default function BackendUrlsManager() {
  const [baseUrl, setBaseUrl] = useState(getApiBaseUrl());
  const [testResult, setTestResult] = useState(null);
  const [endpoints] = useState([
    { key: 'gi_locations', label: 'GI Locations', path: '/api/gi-locations/' },
    { key: 'districts', label: 'Districts', path: '/api/gi-locations/districts/' },
    { key: 'by_district', label: 'Locations by District', path: '/api/gi-locations/by_district/' },
    { key: 'trips', label: 'Trips', path: '/api/trips/' },
    { key: 'selected_locs', label: 'Trip Selected Locations', path: '/api/trips/:id/selected_locations/' },
    { key: 'schedule', label: 'Trip Schedule', path: '/api/trips/:id/schedule/' },
    { key: 'generate', label: 'Generate Schedule', path: '/api/trips/:id/generate_schedule/' }
  ]);

  useEffect(() => {
    setBaseUrl(getApiBaseUrl());
  }, []);

  const saveBase = () => {
    try {
      const normalized = baseUrl.replace(/\/$/, '');
      setApiBaseUrl(normalized);
      setTestResult({ ok: true, message: 'Saved base URL' });
    } catch (e) {
      setTestResult({ ok: false, message: 'Save failed' });
    }
  };

  const testEndpoint = async (path, tripId) => {
    setTestResult(null);
    const finalPath = path.replace(':id', tripId || '1');
    try {
      const res = await api.get(finalPath);
      setTestResult({ ok: true, message: `GET ${finalPath} → ${res.status}`, data: res.data });
    } catch (e) {
      const status = e.response?.status;
      const data = e.response?.data || e.message;
      setTestResult({ ok: false, message: `GET ${finalPath} failed${status ? ` (${status})` : ''}`, data });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🔧 Backend URLs Manager</h2>
      <p>Manage base API URL and quickly test key endpoints. Saved to localStorage and used across the app.</p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <label style={{ minWidth: 120 }}>Base API URL</label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://backend.example.com"
          style={{ flex: 1 }}
        />
        <button onClick={saveBase}>Save</button>
        <button onClick={() => { setBaseUrl('https://backend-k4x8.onrender.com'); }}>Reset</button>
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
        <h3>Test Endpoints</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 120px', gap: 8, alignItems: 'center' }}>
          {endpoints.map(ep => (
            <React.Fragment key={ep.key}>
              <div>
                <div><strong>{ep.label}</strong></div>
                <div style={{ opacity: 0.7, fontFamily: 'monospace' }}>{ep.path}</div>
              </div>
              <input type="text" placeholder="Trip ID (if required)" id={`trip-${ep.key}`} />
              <button onClick={() => testEndpoint(ep.path, document.getElementById(`trip-${ep.key}`)?.value)}>Test</button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {testResult && (
        <div style={{ marginTop: 16, padding: 12, background: testResult.ok ? '#e6ffed' : '#ffecec', border: '1px solid #ccc' }}>
          <div><strong>{testResult.message}</strong></div>
          {testResult.data && (
            <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', background: '#fafafa', padding: 8 }}>
{JSON.stringify(testResult.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
