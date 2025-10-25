// This component has been removed as part of the new UI redesign. All UI is now handled by HomePage.js.
import React, { useState, useEffect } from 'react';
import { getAllGILocations } from '../services/giyatraApi';
import SafeImage from './SafeImage';
import '../styles/NewHomePage.css';

function NewHomePage({ onNavigate }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setCurrentSlide] = useState(0);
  const [, setMousePosition] = useState({ x: 0, y: 0 });

  const heroSlides = [
    {
      title: "Explore Karnataka's Geographical Indications",
      subtitle: "Discover authentic GI products and unique locations across 30 districts",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  icon: ""
    },
    {
      title: "Navigate Karnataka's GI Landscape",
      subtitle: "From Mysore Silk to Channapatna Toys - authentic regional products",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  icon: ""
    },
    {
      title: "Discover Geographical Indications Map",
      subtitle: "Plan your journey through Karnataka's protected cultural products",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  icon: ""
    }
  ];

  const topFeatures = [
    {
      id: 1,
      img: 'https://m.media-amazon.com/images/S/aplus-media-library-service-media/1e778006-6416-4825-bdd3-344c79a80dfd.__CR49,0,983,608_PT0_SX970_V1___.jpg',
      title: 'Navigate Karnataka\'s GI Landscape',
      subtitle: 'From Mysore Silk to Channapatna Toys - authentic regional products'
    },
    {
      id: 2,
      img: 'https://thumbs.dreamstime.com/b/dharwad-peda-brown-quick-milk-based-dessert-made-janamashtami-festival-offered-to-lord-krishna-as-prasad-104030051.jpg',
      title: 'Discover Geographical Indications',
      subtitle: 'Map and background about GIs'
    },
    {
      id: 3,
      img: 'https://www.headlinekarnataka.com/img/news/news_display_image_1598801205.jpg',
      title: 'Explore Karnataka\'s Geographical Indications',
      subtitle: 'Discover authentic GI products and unique locations.'
    }
  ];

  useEffect(() => {
    loadLocations();
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(slideInterval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20,
        y: (e.clientY / window.innerHeight) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const loadLocations = async () => {
    try {
      const data = await getAllGILocations();
      setLocations(data.results || []);
    } catch (error) {
      console.log('Using local mode');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: "",
      title: "GI Locations",
      description: "Discover authentic Geographical Indication products and their origins",
      action: () => onNavigate('locations'),
      color: "#667eea"
    },
    {
      icon: "",
      title: "GI Route Planning",
      description: "Create itineraries to explore Karnataka's protected regional products",
      action: () => onNavigate('trips'),
      color: "#f093fb"
    },
    {
      icon: "",
      title: "GI Services",
      description: "Find authentic GI product stores, artisans, and certified sellers",
      action: () => onNavigate('services'),
      color: "#43e97b"
    }
  ];

  return (
    <div className="new-homepage">
      {/* Top three feature cards (image row) */}
      <section className="top-features">
        <div className="top-features-inner">
          {topFeatures.map((f) => (
            <div key={f.id} className="top-feature-card">
              <div className="tf-image">
                <SafeImage src={f.img} alt={f.title} />
              </div>
              <div className="tf-content">
                <h3 className="tf-title">{f.title}</h3>
                <p className="tf-sub">{f.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2>What Can You Do?</h2>
          <p>Explore, plan, and discover Karnataka like never before</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="feature-card"
              onClick={feature.action}
              style={{ '--accent-color': feature.color }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-link">
                Get Started <span>→</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured GI Products */}
      {!loading && locations.length > 0 && (
        <section className="featured-locations">
          <div className="section-header">
            <h2>Featured GI Products</h2>
          </div>

          <div className="locations-carousel" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
            {locations.slice(0, 4).map((location, index) => (
              <div 
                key={location.id} 
                className="location-card"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => onNavigate('locations')}
              >
                <div className="location-image">
                  <SafeImage 
                    src={location.image_url || location.image || `https://source.unsplash.com/400x300/?karnataka,gi,product,${location.name}`}
                    alt={location.name}
                  />
                </div>
                <div className="location-info">
                  <h4>{location.name}</h4>
                  <p className="location-district">{location.description ? location.description.slice(0,80) + '...' : (location.district_name || location.district)}</p>
                  <div style={{marginTop:8, fontSize: '0.85rem', color:'#6b7280'}}>Artisan: {location.artisan || location.contact_name || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}





      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Three simple steps to plan your perfect trip</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon"></div>
            <h3>Choose Locations</h3>
            <p>Browse and select the places you want to visit from our curated list</p>
          </div>
          
          <div className="step-connector">→</div>
          
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon"></div>
            <h3>Create Itinerary</h3>
            <p>Our smart algorithm creates an optimized schedule for your trip</p>
          </div>
          
          <div className="step-connector">→</div>
          
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon"></div>
            <h3>Start Exploring</h3>
            <p>Follow your personalized itinerary and track your progress</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Explore Karnataka's GI Products?</h2>
          <p>Start discovering authentic Geographical Indications today</p>
          <button 
            className="cta-button"
            onClick={() => onNavigate('trips')}
          >
            Plan Your GI Journey
            <span className="cta-icon">🚀</span>
          </button>
        </div>
        <div className="cta-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </section>
    </div>
  );
}

export default NewHomePage;
