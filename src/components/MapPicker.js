import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// tiny fix for default marker icons in many bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lon: e.latlng.lng });
    }
  });
  return null;
}

export default function MapPicker({ open, onClose, initialPosition = { lat: 12.9716, lon: 77.5946 }, onPick }) {
  const [pos, setPos] = useState([initialPosition.lat, initialPosition.lon]);
  const [selected, setSelected] = useState(null); // { lat, lon }
  const [name, setName] = useState('');

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  };

  const openInGoogleMaps = (lat, lon) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    window.open(url, '_blank', 'noopener');
  };

  const openInDeviceMaps = (lat, lon, label) => {
    // geo: URI works on many mobile devices and will open the native maps app
    const q = encodeURIComponent(label || `${lat},${lon}`);
    const geo = `geo:${lat},${lon}?q=${lat},${lon}(${q})`;
    // Fallback to google maps web if geo: isn't supported
    window.location.href = geo;
  };

  useEffect(() => {
    setPos([initialPosition.lat, initialPosition.lon]);
    setSelected(null);
    setName('');
  }, [initialPosition]);
  const handleSelect = async ({ lat, lon }) => {
    setPos([lat, lon]);
    // Try to get a human-friendly place name (city/town/village) via Nominatim reverse geocoding.
    // This is an external, no-key service (OpenStreetMap Nominatim). If unavailable, fall back to lat,lng.
    let nameStr = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        // Prefer granular place names, then fall back to administrative units (nearest city/district/state)
        const preferred = ['city', 'town', 'village', 'hamlet', 'municipality', 'locality', 'city_district'];
        const adminFallback = ['county', 'state_district', 'region', 'state', 'province', 'country'];
        let found = null;
        for (const k of preferred) {
          if (addr[k]) { found = addr[k]; break; }
        }
        if (!found) {
          for (const k of adminFallback) {
            if (addr[k]) { found = addr[k]; break; }
          }
        }
        if (found) {
          nameStr = found;
        } else if (data.display_name) {
          // Use the first component of display_name as a reasonable nearest place
          nameStr = data.display_name.split(',')[0].trim();
        }
      }
    } catch (e) {
      // ignore and use lat,lng fallback
    }

    if (onPick) {
      onPick({ latitude: lat, longitude: lon, name: nameStr });
    }
    if (onClose) onClose();
  };

  if (!open) return null;

  return (
    <Modal isOpen={open} onClose={onClose} title="Pick a location on the map">
      <div style={{ height: 480, width: '100%' }}>
        <MapContainer center={pos} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution={'Leaflet | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={pos} />
          <ClickHandler onSelect={handleSelect} />
        </MapContainer>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {selected && (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', width: 320 }}
                aria-label="Selected place name"
              />
              <button
                className="location-btn neutral"
                onClick={() => {
                  const { lat, lon } = selected;
                  onPick({ latitude: lat, longitude: lon, name: name || `${lat.toFixed(5)}, ${lon.toFixed(5)}` });
                  onClose();
                }}
              >
                Confirm
              </button>
              <button
                className="location-btn"
                onClick={async () => {
                  const { lat, lon } = selected;
                  const txt = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
                  const ok = await copyToClipboard(txt);
                  if (ok) alert('Coordinates copied to clipboard: ' + txt);
                }}
              >
                Copy Coords
              </button>
              <button
                className="location-btn"
                onClick={() => {
                  const { lat, lon } = selected;
                  openInGoogleMaps(lat, lon);
                }}
              >
                Open in Google Maps
              </button>
              <button
                className="location-btn"
                onClick={() => {
                  const { lat, lon } = selected;
                  openInDeviceMaps(lat, lon, name);
                }}
              >
                Open in Maps App
              </button>
              <button className="cancel-btn" onClick={() => { setSelected(null); setName(''); }}>
                Cancel
              </button>
            </>
          )}
          {!selected && (
            <div style={{ textAlign: 'right' }}>
              <button className="cancel-btn" onClick={onClose}>Close</button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
