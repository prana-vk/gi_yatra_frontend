import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { ensureCsrfToken } from './services/giyatraApi';

// Ensure CSRF token is set before app loads (for local dev)
ensureCsrfToken();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);