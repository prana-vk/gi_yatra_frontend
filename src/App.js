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
    { key: 'home', label: 'Home', component: HomePage },
    { key: 'locations', label: 'GI Locations', component: GILocations },
    { key: 'trips', label: 'Plan Trip', component: TripPlanning },
    // Route Optimizer removed
  ];

  // Add auth pages to navigation when not authenticated
  if (!isAuthenticated) {
    navigationItems.push(
      { key: 'login', label: 'Login', component: LoginPage },
      { key: 'signup', label: 'Sign Up', component: SignupPage }
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
            <h1>GI Yatra</h1>

          </div>
          <nav className="main-navigation">
            {navigationItems.filter(item => item.key !== 'login').map(item => (
              <button
                key={item.key}
                className={`nav-item ${item.key === 'locations' ? 'cta' : ''} ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => setActiveSection(item.key)}
              >
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
            {isAuthenticated && (
              <>
                {/* Show username as a subtle label */}
                <div className="nav-item" style={{ background: 'transparent', cursor: 'default', padding: '0.4rem 0.8rem', color: '#6b7280', fontWeight: 600 }}>
                  <span className="nav-label">{user?.username}</span>
                </div>
                {/* Render logout as a regular nav item so it stays inline with other buttons */}
                <button onClick={handleLogout} className="nav-item" style={{ background: 'transparent', color: '#181818' }}>
                  <span className="nav-label">Logout</span>
                </button>
              </>
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
        background: '#f5f5f5',
        padding: '1rem 0',
        overflow: 'hidden',
        borderTop: '1px solid #ececec',
        borderBottom: '1px solid #ececec'
      }}>
          <div className="promo-ticker" aria-live="polite">
            <div className="ticker-track">
              <span style={{color:'#181818'}}>Plan your perfect Karnataka itinerary — smart routes, real travel times, beautiful trips.</span>
              <span aria-hidden="true" style={{color:'#181818'}}>Plan your perfect Karnataka itinerary — smart routes, real travel times, beautiful trips.</span>
            </div>
          </div>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>GI Yatra</h3>
            <p>Your guide to Karnataka's geographical indication locations and authentic GI products.</p>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <ul>
              <li> Explore GI locations</li>
              <li> Find local services</li>
              <li> Plan smart trips</li>
              <li> AI-powered scheduling</li>
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
          <p>&copy; 2025 GI Yatra. Made with love for Karnataka's Geographical Indications.</p>
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
