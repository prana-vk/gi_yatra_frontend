import React, { useState } from 'react';
import HomePage from './components/NewHomePage'; // Using new modern homepage
import GILocations from './components/GILocations';
import TripPlanning from './components/TripPlanning';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
// RouteOptimizer removed from navigation
import './utils/testBackendConnection'; // Auto-test backend connection
import AppErrorBoundary from './components/AppErrorBoundary';
import { GILocationsProvider } from './context/GILocationsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/App.css';

function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('home');

  const navigationItems = [
    { key: 'home', icon: '🏠', label: 'Home', component: HomePage },
    { key: 'locations', icon: '🏛️', label: 'GI Locations', component: GILocations },
    { key: 'trips', icon: '🎒', label: 'Plan Trip', component: TripPlanning },
    // Route Optimizer removed
  ];

  // Add auth pages to navigation when not authenticated
  if (!isAuthenticated) {
    navigationItems.push(
      { key: 'login', icon: '🔑', label: 'Login', component: LoginPage },
      { key: 'signup', icon: '✨', label: 'Sign Up', component: SignupPage }
    );
  }

  const ActiveComponent = navigationItems.find(item => item.key === activeSection)?.component;

  const handleLogout = async () => {
    await logout();
    setActiveSection('home');
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>🗺️ GI Yatra</h1>
            <p>Plan beautiful trips across Karnataka's GI destinations</p>
          </div>
          <nav className="main-navigation">
            {navigationItems.map(item => (
              <button
                key={item.key}
                className={`nav-item ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => setActiveSection(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
            {isAuthenticated && (
              <div className="user-menu">
                <span className="user-greeting">👋 {user?.username}</span>
                <button onClick={handleLogout} className="logout-btn">
                  🚪 Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="main-content">
          {ActiveComponent && (
            activeSection === 'home' ? 
              <ActiveComponent onNavigate={setActiveSection} /> : 
              activeSection === 'login' || activeSection === 'signup' ?
              <ActiveComponent onNavigate={setActiveSection} /> :
              activeSection === 'trips' || activeSection === 'locations' ?
              <ProtectedRoute onNavigate={setActiveSection}>
                <ActiveComponent />
              </ProtectedRoute> :
              <ActiveComponent />
          )}
        </div>
      </main>

      {/* Promo Section */}
      <div style={{
        background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 100%)',
        padding: '1rem 0',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <marquee style={{
          color: 'white',
          fontSize: '1.15rem',
          fontWeight: 700,
          letterSpacing: '1px'
        }}>
          ✨ Plan your perfect Karnataka itinerary — smart routes, real travel times, beautiful trips.
        </marquee>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>🏛️ GI Yatra</h3>
            <p>Your guide to Karnataka's geographical indication locations and authentic GI products.</p>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li>📍 Explore GI locations</li>
              <li>🏨 Find local services</li>
              <li>🗺️ Plan smart trips</li>
              <li>📅 AI-powered scheduling</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <button onClick={() => setActiveSection('home')}>
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => setActiveSection('locations')}>
                  View Locations
                </button>
              </li>
              <li>
                <button onClick={() => setActiveSection('services')}>
                  Browse Services
                </button>
              </li>
              <li>
                <button onClick={() => setActiveSection('trips')}>
                  Plan Trip
                </button>
              </li>
              {/* Route Optimizer link removed */}
            </ul>
          </div>
          <div className="footer-section">
            <h4>About</h4>
            <p>{isAuthenticated ? `Welcome back, ${user?.username}!` : 'Sign up to save your trips and get personalized recommendations!'}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 GI Yatra. Made with ❤️ for Karnataka's Geographical Indications.</p>
        </div>
      </footer>
    </div>
  );
}


function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <GILocationsProvider>
          <AppContent />
        </GILocationsProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;
