import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { passwordResetRequestOtp, passwordResetConfirmOtp } from '../services/giyatraApi';
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
      // Use OTP-based password reset request (backend configured to generate OTP)
      const resp = await passwordResetRequestOtp(resetEmail);
      // Backend returns a generic message and may include expires_at
  setResetSuccess({ success: true, message: resp?.message || 'Email sent', expires_at: resp?.expires_at });
      // move to confirm step so user can enter code + new password
      setResetStep('confirm');
    } catch (error) {
      const data = error?.response?.data || {};
      const serverMsg = data.error || data.detail || data.message || '';
      if (error.response?.status === 404) {
        setResetSuccess({ success: false, message: serverMsg || 'This email is not found in database' });
        setResetErrors({ email: serverMsg || 'Email not found' });
      } else {
        setResetSuccess({ success: false, message: serverMsg || 'Could not request reset code. Please try again.' });
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetConfirm = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!resetOtp || !/^\d{6}$/.test(resetOtp)) errs.otp = 'Enter the 6-digit code';
    if (!resetNewPassword) errs.new_password = 'New password is required';
    else if (resetNewPassword.length < 6) errs.new_password = 'Password must be at least 6 characters';
    if (resetNewPassword !== resetConfirmPassword) errs.confirm = 'Passwords do not match';
    setResetErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      setResetLoading(true);
      const resp = await passwordResetConfirmOtp(resetEmail, resetOtp, resetNewPassword);
      setResetSuccess({ success: true, message: resp?.message || 'Password has been reset successfully.' });
      setTimeout(() => setResetModalOpen(false), 900);
    } catch (error) {
      const data = error?.response?.data || {};
      const serverMsg = data.error || data.detail || data.message || '';
      if (error.response?.status === 404) {
        setResetSuccess({ success: false, message: serverMsg || 'This email is not found in database' });
        setResetErrors({ email: serverMsg || 'Email not found' });
      } else {
        const msg = serverMsg || 'Could not reset password. Please check the code and try again.';
        setResetSuccess({ success: false, message: msg });
        if (data?.errors) setResetErrors(data.errors);
      }
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
  // modal state removed — not used in this component

  // Add missing state for reset password modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(null);

  const [resetStep, setResetStep] = useState('request'); // 'request' | 'confirm'
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetErrors, setResetErrors] = useState({});


  // Add missing handleChange for form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // modal setter kept for potential use by other helpers

  const openResetModal = (email = '') => {
    setResetEmail(email || '');
    setResetStep('request');
    setResetOtp('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetErrors({});
    setResetSuccess(null);
    setResetModalOpen(true);
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
      // AuthContext.login may either return an object { success: true } / { success: false, error }
      // or throw an axios error — handle both cases.
      const result = await login(formData.email, formData.password);

      if (result && result.success === false) {
        const err = result.error || {};
        const status = err.status || err.statusCode || null;
        const serverMsg = err.error || err.detail || err.message || '';

        if (status === 404 || String(serverMsg).toLowerCase().includes('user does not exist')) {
          setErrors({ detail: serverMsg || 'User does not exist. Please sign up.' });
        } else {
          setErrors({ detail: serverMsg || 'Login failed. Please check your credentials.' });
        }
        setLoading(false);
        return;
      }

      // success path
      if (onNavigate) onNavigate('home');
    } catch (err) {
      // err may be an axios error with response
      const resp = err?.response;
      const respData = resp?.data || {};
      const serverMsg = respData.error || respData.detail || respData.message || '';
      if (resp?.status === 404 || String(serverMsg).toLowerCase().includes('user does not exist')) {
        setErrors({ detail: serverMsg || 'User does not exist. Please sign up.' });
      } else {
        setErrors({ detail: serverMsg || 'Login failed. Please check your credentials.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-split-left">
        <div className="auth-header" style={{textAlign:'left'}}>
          <h1 style={{fontSize:'1.9rem',fontWeight:800,marginBottom:6, color:'#181818'}}>Welcome Back</h1>
          <p style={{color:'#888',fontSize:'0.96rem',marginBottom:12}}>Log in to your GI Yatra account</p>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 0 }}>
            <button type="button" onClick={() => openResetModal(formData.email)} className="link-btn" style={{ fontSize: '0.95rem' }}>Forgot password?</button>
          </div>
          {errors.detail && (
            <div className="form-error">{errors.detail}</div>
          )}
          <button type="submit" disabled={loading} style={{marginTop:12,background:'#ff7a18',color:'#fff',fontWeight:700,fontSize:'1rem',border:'none',borderRadius:12,padding:'0.6rem 0',width:'100%',boxShadow:'none'}}>
            {loading ? 'Logging in...' : 'Continue'}
          </button>
        </form>
        <div style={{marginTop:12,textAlign:'center'}}>
          <span style={{color:'#888'}}>Don't have an account? </span>
          <button
            onClick={() => onNavigate && onNavigate('signup')}
            style={{background:'none',border:'none',color:'#ff7a18',fontWeight:600,cursor:'pointer',fontSize:'1.05rem',padding:0,marginLeft:4}}>Sign Up</button>
        </div>
      </div>
    <div className="auth-split-right">
  <img src={loginImage} alt="Login visual" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:0}} />
    </div>
      <Modal isOpen={resetModalOpen} title="Reset password" onClose={() => setResetModalOpen(false)} actions={[]}>
        {resetStep === 'request' ? (
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
              <button type="submit" disabled={resetLoading} className="btn btn-primary">{resetLoading ? 'Sending...' : 'Send reset code'}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetConfirm}>
            <div className="form-group">
              <label htmlFor="resetOtp">Verification code</label>
              <input id="resetOtp" name="resetOtp" type="text" value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} placeholder="6-digit code" disabled={resetLoading} />
              {resetErrors.otp && <div className="error-message">{resetErrors.otp}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="resetNewPassword">New password</label>
              <input id="resetNewPassword" name="resetNewPassword" type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} placeholder="New password" disabled={resetLoading} />
              {resetErrors.new_password && <div className="error-message">{resetErrors.new_password}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="resetConfirmPassword">Confirm password</label>
              <input id="resetConfirmPassword" name="resetConfirmPassword" type="password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} placeholder="Confirm password" disabled={resetLoading} />
              {resetErrors.confirm && <div className="error-message">{resetErrors.confirm}</div>}
            </div>
            {resetSuccess && (
              <div style={{ marginBottom: 12, color: resetSuccess.success ? '#10b981' : '#ef4444' }}>{resetSuccess.message}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setResetStep('request')} className="btn btn-secondary">Back</button>
              <button type="submit" disabled={resetLoading} className="btn btn-primary">{resetLoading ? 'Resetting...' : 'Reset password'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default LoginPage;
