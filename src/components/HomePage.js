import React, { useState, useEffect } from 'react';
import { giProducts, karnatakaDistricts, giCategories } from '../data/karnatakaData';
import '../styles/HomePage.css';

const HomePage = ({ onNavigate }) => {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % giProducts.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const filteredProducts = giProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const currentProduct = giProducts[currentProductIndex];

  return (
    <div className="homepage">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="floating-images">
          {giProducts.map((product, index) => (
            <div
              key={product.id}
              className={`floating-item ${index === currentProductIndex ? 'active' : ''}`}
              style={{
                animationDelay: `${index * 0.5}s`,
                left: `${(index * 15) % 100}%`,
                top: `${(index * 8) % 80 + 10}%`
              }}
            >
              <img src={product.image} alt={product.name} />
            </div>
          ))}
        </div>
        <div className="gradient-overlay"></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Discover Karnataka's
            <span className="highlight"> Geographical Indications</span>
          </h1>
          <p className="hero-description">
            Explore authentic products, rich culture, and geographical treasures 
            from across Karnataka's 30 districts
          </p>
          
          <div className="hero-actions">
            <button 
              className="start-journey-hero"
              onClick={() => onNavigate && onNavigate('route')}
            >
              🗺️ Start Your Journey
            </button>
            <button 
              className="explore-locations"
              onClick={() => onNavigate && onNavigate('locations')}
            >
              🏛️ Explore Locations
            </button>
          </div>
          
          <div className="featured-product">
            <div className="product-showcase">
              <img 
                src={currentProduct.image} 
                alt={currentProduct.name}
                className="showcase-image"
              />
              <div className="product-info">
                <h3>{currentProduct.name}</h3>
                <p className="district">📍 {currentProduct.district}</p>
                <p className="description">{currentProduct.description}</p>
                <span className="category-tag">{currentProduct.category}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="search-section">
        <div className="container">
          <h2>Explore GI Products</h2>
          <div className="search-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search products or districts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
            
            <div className="category-filters">
              <button
                className={selectedCategory === 'all' ? 'active' : ''}
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </button>
              {giCategories.map(category => (
                <button
                  key={category.name}
                  className={selectedCategory === category.name ? 'active' : ''}
                  onClick={() => setSelectedCategory(category.name)}
                  style={{ '--category-color': category.color }}
                >
                  <span className="category-icon">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="products-section">
        <div className="container">
          <div className="products-grid">
            {filteredProducts.map((product, index) => (
              <div key={product.id} className="product-card" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="card-image">
                  <img src={product.image} alt={product.name} />
                  <div className="category-overlay">
                    {giCategories.find(cat => cat.name === product.category)?.icon}
                  </div>
                </div>
                <div className="card-content">
                  <h3>{product.name}</h3>
                  <p className="district">📍 {product.district}</p>
                  <p className="description">{product.description}</p>
                  <div className="card-footer">
                    <span className="category">{product.category}</span>
                    <button className="learn-more">Learn More</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Districts Section */}
      <section className="districts-section">
        <div className="container">
          <h2>Karnataka Districts</h2>
          <p>Explore all 30 districts of Karnataka and their unique GI products</p>
          <div className="districts-grid">
            {karnatakaDistricts.map((district, index) => (
              <div 
                key={district} 
                className="district-card"
                style={{animationDelay: `${index * 0.05}s`}}
              >
                <span className="district-name">{district}</span>
                <div className="district-count">
                  {giProducts.filter(p => p.district === district).length || 0} GI Products
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{giProducts.length}</div>
              <div className="stat-label">GI Products</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{karnatakaDistricts.length}</div>
              <div className="stat-label">Districts</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{giCategories.length}</div>
              <div className="stat-label">Categories</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Years of History</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;