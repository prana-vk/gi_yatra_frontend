import React, { useState, useEffect } from 'react';
import { createAdLocation, getAllServiceTypes } from '../services/giyatraApi';
import '../styles/Services.css';

function CreateService({ onServiceCreated, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    service_type: '',
    latitude: '',
    longitude: '',
    description: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    address: '',
    price_range: '',
    rating: '',
    is_active: true
  });
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      const types = await getAllServiceTypes();
      setServiceTypes(types);
    } catch (error) {
      console.error('Error fetching service types:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Business name is required';
    if (!formData.district.trim()) newErrors.district = 'District is required';
    if (!formData.service_type) newErrors.service_type = 'Service type is required';
    if (!formData.latitude) newErrors.latitude = 'Latitude is required';
    if (!formData.longitude) newErrors.longitude = 'Longitude is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    // Validate coordinates
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }
    
    // Validate email format
    if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }
    
    // Validate website URL
    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website URL should start with http:// or https://';
    }
    
    // Validate rating
    if (formData.rating) {
      const rating = parseFloat(formData.rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        newErrors.rating = 'Rating must be between 0 and 5';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await createAdLocation(formData);
      
      alert('Service created successfully! 🎉');
      
      // Reset form
      setFormData({
        name: '',
        district: '',
        service_type: '',
        latitude: '',
        longitude: '',
        description: '',
        contact_phone: '',
        contact_email: '',
        website: '',
        address: '',
        price_range: '',
        rating: '',
        is_active: true
      });
      
      // Notify parent component
      if (onServiceCreated) {
        onServiceCreated(result);
      }
      
      // Close form if callback provided
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Error creating service. Please check your data and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
        },
        (error) => {
          alert('Unable to get current location. Please enter coordinates manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
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

  return (
    <div className="create-service-container">
      <div className="form-header">
        <h2>🏢 Add New Service/Business</h2>
        <p>List your business to help travelers find great services</p>
      </div>

      <form onSubmit={handleSubmit} className="create-service-form">
        <div className="form-grid">
          {/* Business Info */}
          <div className="form-section">
            <h3>🏢 Business Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Business Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., Royal Palace Hotel"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                required
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="service_type">Service Type *</label>
              <select
                id="service_type"
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                className={errors.service_type ? 'error' : ''}
                required
              >
                <option value="">Select a service type</option>
                {serviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {getServiceIcon(type.value)} {type.label}
                  </option>
                ))}
              </select>
              {errors.service_type && <span className="error-text">{errors.service_type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="district">District *</label>
              <input
                id="district"
                name="district"
                type="text"
                placeholder="e.g., Mysore"
                value={formData.district}
                onChange={handleChange}
                className={errors.district ? 'error' : ''}
                required
              />
              {errors.district && <span className="error-text">{errors.district}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe your business, services offered, specialties, etc..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={errors.description ? 'error' : ''}
                required
              />
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Full Address</label>
              <textarea
                id="address"
                name="address"
                placeholder="Complete address with landmarks"
                value={formData.address}
                onChange={handleChange}
                rows={2}
              />
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h3>📍 Location</h3>
            
            <div className="coordinates-group">
              <div className="form-group">
                <label htmlFor="latitude">Latitude *</label>
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 12.3051"
                  value={formData.latitude}
                  onChange={handleChange}
                  className={errors.latitude ? 'error' : ''}
                  required
                />
                {errors.latitude && <span className="error-text">{errors.latitude}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="longitude">Longitude *</label>
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g., 76.6551"
                  value={formData.longitude}
                  onChange={handleChange}
                  className={errors.longitude ? 'error' : ''}
                  required
                />
                {errors.longitude && <span className="error-text">{errors.longitude}</span>}
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={getCurrentLocation}
              className="location-btn"
            >
              📍 Use Current Location
            </button>
          </div>

          {/* Contact Info */}
          <div className="form-section">
            <h3>📞 Contact Information</h3>
            
            <div className="form-group">
              <label htmlFor="contact_phone">Phone Number</label>
              <input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                placeholder="e.g., +91-9876543210"
                value={formData.contact_phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_email">Email Address</label>
              <input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="e.g., info@business.com"
                value={formData.contact_email}
                onChange={handleChange}
                className={errors.contact_email ? 'error' : ''}
              />
              {errors.contact_email && <span className="error-text">{errors.contact_email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="url"
                placeholder="https://www.business.com"
                value={formData.website}
                onChange={handleChange}
                className={errors.website ? 'error' : ''}
              />
              {errors.website && <span className="error-text">{errors.website}</span>}
            </div>
          </div>

          {/* Business Details */}
          <div className="form-section">
            <h3>⭐ Business Details</h3>
            
            <div className="form-group">
              <label htmlFor="price_range">Price Range</label>
              <select
                id="price_range"
                name="price_range"
                value={formData.price_range}
                onChange={handleChange}
              >
                <option value="">Select price range</option>
                <option value="₹">₹ - Budget Friendly</option>
                <option value="₹₹">₹₹ - Moderate</option>
                <option value="₹₹₹">₹₹₹ - Expensive</option>
                <option value="₹₹₹₹">₹₹₹₹ - Luxury</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rating">Rating (0-5)</label>
              <input
                id="rating"
                name="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                placeholder="4.5"
                value={formData.rating}
                onChange={handleChange}
                className={errors.rating ? 'error' : ''}
              />
              {errors.rating && <span className="error-text">{errors.rating}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                Business is currently active and operational
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          {onClose && (
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          )}
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? '⏳ Creating...' : '🏢 Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateService;