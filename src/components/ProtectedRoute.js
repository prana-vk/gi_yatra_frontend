import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, onNavigate }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
  color: '#222'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '3rem',
        textAlign: 'center',
  background: '#fff',
        borderRadius: '16px',
        margin: '2rem auto',
        maxWidth: '600px'
      }}>
  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}></div>
  <h2 style={{ color: '#222', marginBottom: '1rem', fontSize: '1.75rem' }}>
          Authentication Required
        </h2>
  <p style={{ color: '#444', marginBottom: '2rem', fontSize: '1.1rem' }}>
          Please log in or sign up to access this feature and plan your GI journey.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => onNavigate && onNavigate('login')}
            style={{
              padding: '0.875rem 2rem',
              background: '#f5f5f5',
              color: '#222',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(212, 165, 116, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
            Log In
          </button>
          <button
            onClick={() => onNavigate && onNavigate('signup')}
            style={{
              padding: '0.875rem 2rem',
              background: '#222',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
