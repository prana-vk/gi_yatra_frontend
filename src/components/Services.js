import React from 'react';
import ServicesList from './ServicesList';
import '../styles/Services.css';

function Services() {
  return (
    <div className="services-main">
      {/* Header */}
      <div className="services-header">
        <h2>🏨 Local Services Directory</h2>
        <p>Discover hotels, restaurants, and local services near GI locations</p>
      </div>

      {/* Content */}
      <div className="services-content">
        <ServicesList />
      </div>
    </div>
  );
}

export default Services;