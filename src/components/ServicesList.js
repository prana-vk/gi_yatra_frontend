import React, { useState, useEffect } from 'react';
import { 
  getAllAdLocations, 
  getAllServiceTypes,
  filterAdLocationsByService
} from '../services/giyatraApi';
import '../styles/Services.css';

function ServicesList() {
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [selectedType, currentPage]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [servicesData, typesData] = await Promise.all([
        getAllAdLocations(),
        getAllServiceTypes()
      ]);
      
      setServices(servicesData.results);
      setTotalPages(Math.ceil(servicesData.count / 10));
      setServiceTypes(typesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      let data;
      
      if (selectedType !== 'all') {
        data = await filterAdLocationsByService(selectedType);
      } else {
        data = await getAllAdLocations({ page: currentPage });
      }
      
      setServices(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm) {
      const filtered = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.district.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setServices(filtered);
    } else {
      fetchServices();
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setCurrentPage(1);
    fetchInitialData();
  };

  const getServiceIcon = (type) => {
    const icons = {
      hotel: '🏨',
      restaurant: '🍽️',
      transport: '🚗',
      guide: '👨‍🏫',
      shopping: '🛍️',
      hospital: '🏥',
      atm: '🏧',
      fuel: '⛽',
      other: '🏢'
    };
    return icons[type] || '🏢';
  };

  const getRatingStars = (rating) => {
    if (!rating) return '';
    const stars = '⭐'.repeat(Math.floor(parseFloat(rating)));
    return `${stars} ${rating}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading services...</p>
      </div>
    );
  }

  return (
    <div className="services-container">
      <div className="header">
        <h1>🏨 Services & Businesses</h1>
        <p>Find hotels, restaurants, and other services for your trip</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="search-btn">
            🔍 Search
          </button>
        </div>

        <div className="filter-box">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Services</option>
            {serviceTypes.map(type => (
              <option key={type.value} value={type.value}>
                {getServiceIcon(type.value)} {type.label}
              </option>
            ))}
          </select>
        </div>

        <button onClick={resetFilters} className="reset-btn">
          🔄 Reset
        </button>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <p>Found {services.length} services</p>
      </div>

      {/* Services Grid */}
      <div className="services-grid">
        {services.length === 0 ? (
          <div className="no-results">
            <p>No services found. Try adjusting your search or filters.</p>
          </div>
        ) : (
          services.map(service => (
            <div key={service.id} className="service-card">
              {service.image && (
                <div className="service-image">
                  <img src={service.image} alt={service.name} />
                </div>
              )}
              
              <div className="service-content">
                <div className="service-header">
                  <h3>{getServiceIcon(service.service_type)} {service.name}</h3>
                  <span className="service-type">{service.service_type}</span>
                </div>
                
                <p className="district">📍 {service.district}</p>
                <p className="description">{service.description}</p>
                
                {service.address && (
                  <p className="address">🏠 {service.address}</p>
                )}
                
                <div className="service-details">
                  {service.price_range && (
                    <div className="detail">
                      <span className="label">💰 Price:</span>
                      <span className="value">{service.price_range}</span>
                    </div>
                  )}
                  
                  {service.rating && (
                    <div className="detail">
                      <span className="label">⭐ Rating:</span>
                      <span className="value">{getRatingStars(service.rating)}</span>
                    </div>
                  )}
                </div>
                
                <div className="contact-info">
                  {service.contact_phone && (
                    <div className="contact">
                      <span className="label">📞</span>
                      <a href={`tel:${service.contact_phone}`} className="contact-link">
                        {service.contact_phone}
                      </a>
                    </div>
                  )}
                  
                  {service.contact_email && (
                    <div className="contact">
                      <span className="label">📧</span>
                      <a href={`mailto:${service.contact_email}`} className="contact-link">
                        {service.contact_email}
                      </a>
                    </div>
                  )}
                  
                  {service.website && (
                    <div className="contact">
                      <span className="label">🌐</span>
                      <a 
                        href={service.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="contact-link"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="service-actions">
                  <button 
                    className="map-btn"
                    onClick={() => window.open(`https://maps.google.com/?q=${service.latitude},${service.longitude}`, '_blank')}
                  >
                    📍 View on Map
                  </button>
                </div>
                
                {!service.is_active && (
                  <div className="inactive-badge">
                    ⚠️ Inactive
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            ← Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default ServicesList;