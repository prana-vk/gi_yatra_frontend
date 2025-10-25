import React, { useEffect, useState } from 'react';
import './HomePage.css';
import { getAllGILocations } from '../services/giyatraApi';

// Fallback image when backend doesn't provide one
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';

const timelineEvents = [
  {
    year: '15th Century',
    title: 'Roquefort Cheese',
    desc: 'The Parliament of Toulouse in France grants a monopoly for the ripening of Roquefort cheese to the people of Roquefort-sur-Soulzon, one of the earliest known protections of a geographical name.',
  },
  {
    year: '1883',
    title: 'The Paris Convention',
    desc: 'The Paris Convention for the Protection of Industrial Property is signed, laying the groundwork for international protection of intellectual property, including indications of source.',
  },
  {
    year: '1994',
    title: 'TRIPS Agreement',
    desc: 'The WTO’s Agreement on Trade-Related Aspects of Intellectual Property Rights (TRIPS) sets global minimum standards for GI protection, solidifying their international importance.',
  },
];

const HomePage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAllGILocations();
        if (mounted) setLocations(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load GI locations', e);
        if (mounted) setError('Unable to load locations');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="geoauth-home">
      {/* Small compact right-aligned nav (short labels, small height) */}
      {/* right-side Plan Trip button removed per request */}

    {/* Hero Section */}
    <section className="geoauth-hero" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80)' }}>
      <div className="hero-content">
        <h1>Discover the World&apos;s<br />Authentic Treasures</h1>
        <p>Explore products protected by geographical indications, celebrated for their unique origin and quality.</p>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search for a product, region, or country..." />
          <button>Search</button>
        </div>
      </div>
    </section>

    {/* Intro Section */}
    <section className="geoauth-intro" id="about">
      <h2>What is a Geographical Indication?</h2>
      <p>Geographical Indications (GIs) are signs used on products that have a specific geographical origin and possess qualities or a reputation that are due to that origin. They are a mark of authenticity and a guarantee of quality, connecting products directly to the traditions and environment of their homeland.</p>
      <button className="learn-more">Learn More</button>
    </section>

    {/* Timeline Section */}
    <section className="geoauth-timeline" id="history">
      <h2>A Journey Through Time</h2>
      <p>The concept of protecting products based on origin is centuries old. Explore the milestones that shaped the world of Geographical Indications.</p>
      <div className="timeline-list">
        {timelineEvents.map((event, idx) => (
          <div className="timeline-event" key={event.year}>
            <div className="timeline-dot" />
            <div className="timeline-card">
              <div className="timeline-year">{event.year}</div>
              <div className="timeline-title">{event.title}</div>
              <div className="timeline-desc">{event.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Itinerary heading (requested) */}
    <section className="geoauth-itinerary" id="itinerary">
      <h2>Itinerary</h2>
    </section>

    {/* Featured GIs Section */}
    <section className="geoauth-featured" id="explore">
      <h2>Explore Featured GIs</h2>
      <p>Discover iconic products celebrated for their unique origin and heritage.</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading locations…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>{error}</div>
      ) : (
        <div className="featured-grid">
          {locations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>No locations found.</div>
          ) : (
            locations.map((loc) => {
              // defensive image selection from backend fields
              const img = loc.image || loc.image_url || (loc.images && loc.images[0]) || FALLBACK_IMAGE;
              const title = loc.name || loc.product_name || loc.title || 'Untitled';
              const tag = (loc.category || loc.type || '').toUpperCase();
              const meta = loc.district || loc.region || loc.country || '';

              return (
                <div className="featured-card" key={loc.id || title}>
                  <img src={img} alt={title} onError={(e)=>{e.target.src=FALLBACK_IMAGE}} />
                  {tag && <div className="featured-tag">{tag}</div>}
                  <div className="featured-name">{title}</div>
                  {meta && <div className="featured-country">{meta}</div>}
                </div>
              );
            })
          )}
        </div>
      )}
    </section>

    {/* Footer */}
    <footer className="geoauth-footer">
      <div className="footer-main">
        <div className="footer-logo">
          <span role="img" aria-label="logo">📘</span> <b>GeoAuthentic</b>
          <div className="footer-tagline">Your guide to the world&apos;s finest geographically indicated products.</div>
        </div>
        <div className="footer-cols">
          <div>
            <div className="footer-title">EXPLORE</div>
            <a href="#">Products</a>
            <a href="#">Regions</a>
            <a href="#">Countries</a>
          </div>
          <div>
            <div className="footer-title">COMPANY</div>
            <a href="#about">About Us</a>
            <a href="#history">History</a>
            <a href="#contact">Contact</a>
          </div>
          <div>
            <div className="footer-title">LEGAL</div>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© 2024 GeoAuthentic. All rights reserved.</div>
        <div className="footer-social">
          <a href="#">Twitter</a>
          <a href="#">Facebook</a>
          <a href="#">Instagram</a>
        </div>
      </div>
    </footer>
  </div>
  );
};

export default HomePage;