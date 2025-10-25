import React from 'react';
import GILocationsList from './GILocationsList';
import '../styles/GILocations.css';

function GILocations({ onNavigate, setSelectedLocation }) {
  return (
    <div className="gi-locations-main">
      <GILocationsList onNavigate={onNavigate} setSelectedLocation={setSelectedLocation} />
    </div>
  );
}

export default GILocations;