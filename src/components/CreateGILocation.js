import React, { useState } from 'react';
import { createGILocationWithImage } from '../services/giyatraApi';
import '../styles/GILocations.css';

function CreateGILocation({ onLocationCreated, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    latitude: '',
    longitude: '',
    description: '',
    typical_visit_duration: 60,
    opening_time: '09:00',
    closing_time: '18:00'
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.district.trim()) newErrors.district = 'District is required';
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
    
    if (formData.typical_visit_duration < 1) {
      newErrors.typical_visit_duration = 'Visit duration must be at least 1 minute';
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
      const data = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });
      
      // Append image if selected
      if (image) {
        data.append('image', image);
      }
      
      const result = await createGILocationWithImage(data);
      
      alert('Location created successfully! 🎉');
      
      // Reset form
      setFormData({
        name: '',
        district: '',
        latitude: '',
        longitude: '',
        description: '',
        typical_visit_duration: 60,
        opening_time: '09:00',
        closing_time: '18:00'
      });
      setImage(null);
      setImagePreview(null);
      
      // Notify parent component
      if (onLocationCreated) {
        onLocationCreated(result);
      }
      
      // Close form if callback provided
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('Error creating location:', error);
      alert('Error creating location. Please check your data and try again.');
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

  return (
    <div className="create-location-container">
      <div className="form-header">
        <h2>✨ Add New GI Location</h2>
        <p>Share a new cultural or GI location with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="create-location-form">
        <div className="form-grid">
          {/* Basic Info */}
          <div className="form-section">
            <h3>📍 Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Location Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., Mysore Palace"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                required
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
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
                placeholder="Describe the location, its significance, and what visitors can expect..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={errors.description ? 'error' : ''}
                required
              />
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="form-section">
            <h3>🗺️ Location Coordinates</h3>
            
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
              📍 Use My Current Location
            </button>
          </div>

          {/* Visit Details */}
          <div className="form-section">
            <h3>⏰ Visit Information</h3>
            
            <div className="form-group">
              <label htmlFor="typical_visit_duration">Typical Visit Duration (minutes)</label>
              <input
                id="typical_visit_duration"
                name="typical_visit_duration"
                type="number"
                min="1"
                placeholder="60"
                value={formData.typical_visit_duration}
                onChange={handleChange}
                className={errors.typical_visit_duration ? 'error' : ''}
              />
              {errors.typical_visit_duration && <span className="error-text">{errors.typical_visit_duration}</span>}
            </div>

            <div className="time-group">
              <div className="form-group">
                <label htmlFor="opening_time">Opening Time</label>
                <input
                  id="opening_time"
                  name="opening_time"
                  type="time"
                  value={formData.opening_time}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="closing_time">Closing Time</label>
                <input
                  id="closing_time"
                  name="closing_time"
                  type="time"
                  value={formData.closing_time}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-section">
            <h3>📸 Location Image</h3>
            
            <div className="image-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="image-input"
                className="file-input"
              />
              <label htmlFor="image-input" className="file-label">
                📁 Choose Image (Max 5MB)
              </label>
              
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button" 
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="remove-image"
                  >
                    ✕
                  </button>
                </div>
              )}
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
            {loading ? '⏳ Creating...' : '✨ Create Location'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateGILocation;