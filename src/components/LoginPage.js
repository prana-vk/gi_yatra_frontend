import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { requestPasswordReset, passwordResetRequestOtp } from '../services/giyatraApi';
import '../styles/Auth.css';
const loginImage = 'https://mapacademy.io/wp-content/uploads/2023/11/channapatna-toys-1l.jpg';

function LoginPage({ onNavigate }) {
  // Add missing handleResetSubmit for reset password modal
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetSuccess({ success: false, message: 'Please enter a valid email address.' });
      return;
    }
    try {
      setResetLoading(true);
      await requestPasswordReset(resetEmail);
      setResetSuccess({ success: true, message: 'A password reset link has been sent to your email.' });
    } catch (error) {
      setResetSuccess({ success: false, message: 'Could not send reset email. Please try again.' });
    } finally {
      setResetLoading(false);
    }
  };
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, title: '', content: null, actions: [] });
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  // Add missing state for reset password modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(null);


  // Add missing handleChange for form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (title, content, actions = []) => setModal({ open: true, title, content, actions });
  const closeModal = () => setModal(m => ({ ...m, open: false }));


  const openForgotModal = (email = '') => {
    setForgotMode(true);
    setForgotEmail(email);
    setForgotSuccess(null);
    openModal('Reset password', null, []);
  };

  // Add missing handleSubmit for login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (!formData.email || !formData.password) {
        setErrors({ detail: 'Please enter both email and password.' });
        setLoading(false);
        return;
      }
      await login(formData.email, formData.password);
      if (onNavigate) onNavigate('home');
    } catch (err) {
      setErrors({ detail: err?.response?.data?.detail || 'Login failed. Please check your credentials.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-split-left">
        <div className="auth-header" style={{textAlign:'left'}}>
          <h1 style={{fontSize:'2.3rem',fontWeight:800,marginBottom:8, color:'#181818'}}>Welcome Back</h1>
          <p style={{color:'#888',fontSize:'1.08rem',marginBottom:32}}>Log in to your GI Yatra account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="you@example.com"
              disabled={loading}
              style={{fontSize:'1.1rem'}} />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
              disabled={loading}
              style={{fontSize:'1.1rem'}} />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
            <button type="button" onClick={() => setResetModalOpen(true)} className="link-btn" style={{ fontSize: '0.95rem' }}>Forgot password?</button>
          </div>
          {errors.detail && (
            <div className="form-error">{errors.detail}</div>
          )}
          <button type="submit" disabled={loading} style={{marginTop:24,background:'#ff7a18',color:'#fff',fontWeight:700,fontSize:'1.15rem',border:'none',borderRadius:16,padding:'1rem 0',width:'100%',boxShadow:'none'}}>
            {loading ? 'Logging in...' : 'Continue'}
          </button>
        </form>
        <div style={{marginTop:32,textAlign:'center'}}>
          <span style={{color:'#888'}}>Don't have an account? </span>
          <button
            onClick={() => onNavigate && onNavigate('signup')}
            style={{background:'none',border:'none',color:'#ff7a18',fontWeight:600,cursor:'pointer',fontSize:'1.05rem',padding:0,marginLeft:4}}>Sign Up</button>
        </div>
      </div>
      <div className="auth-split-right">
        <img src={loginImage} alt="Login visual" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:32}} />
      </div>
      <Modal isOpen={resetModalOpen} title="Reset password" onClose={() => setResetModalOpen(false)} actions={[]}>
        <form onSubmit={handleResetSubmit}>
          <div className="form-group">
            <label htmlFor="resetEmail">Email</label>
            <input id="resetEmail" name="resetEmail" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="your@email.com" disabled={resetLoading} />
          </div>
          {resetSuccess && (
            <div style={{ marginBottom: 12, color: resetSuccess.success ? '#10b981' : '#ef4444' }}>{resetSuccess.message}</div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setResetModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={resetLoading} className="btn btn-primary">{resetLoading ? 'Sending...' : 'Send reset email'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LoginPage;
