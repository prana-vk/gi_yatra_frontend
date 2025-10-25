import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signupRequestOtp, requestPasswordReset } from '../services/giyatraApi';
import Modal from './Modal';
import '../styles/Auth.css';
const signupImage = 'https://mapacademy.io/wp-content/uploads/2023/11/channapatna-toys-1l.jpg';

function SignupPage({ onNavigate }) {
  const { signupConfirmOtpFlow } = useAuth();

  const [step, setStep] = useState('request'); // 'request' | 'confirm'
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(null);

  useEffect(() => {
    let timer;
    if (resendDisabled) {
      timer = setTimeout(() => setResendDisabled(false), 30000); // 30s throttle
    }
    return () => clearTimeout(timer);
  }, [resendDisabled]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateEmailOnly = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOtp = async (e) => {
    e && e.preventDefault();
    if (!validateEmailOnly()) return;
    try {
      setRequestLoading(true);
      const resp = await signupRequestOtp(formData.email);
      // Backend is neutral — show generic message and move to confirm step
      setRequestMessage(resp.message || 'If this email is available, a verification code was sent.');
      setExpiresAt(resp.expires_at || null);
      setStep('confirm');
      setResendDisabled(true);
    } catch (error) {
      console.error('Signup OTP request failed:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || '';
      const errorLower = errorMsg.toLowerCase();
      
      // Check if email already registered
      if (errorLower.includes('already registered') || errorLower.includes('already exists') || errorLower.includes('email already')) {
        setErrors({ email: 'Email already registered' });
        setRequestMessage('This email is already registered. Please log in instead.');
      } else {
        setRequestMessage(errorMsg || 'Could not request code. Please try again later.');
      }
    } finally {
      setRequestLoading(false);
    }
  };

  const validateConfirmForm = () => {
    const newErrors = {};
    if (!formData.otp || !/^[0-9]{6}$/.test(formData.otp)) newErrors.otp = 'Enter the 6-digit code';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async (e) => {
    e && e.preventDefault();
    if (!validateConfirmForm()) return;
    try {
      setLoading(true);
      const result = await signupConfirmOtpFlow(formData.email, formData.otp, formData.password);
      if (result.success) {
        if (onNavigate) onNavigate('home');
      } else {
        // Parse error and show specific messages
        const err = result.error || {};
        const errorMsg = err.error || err.detail || '';
        const errorLower = errorMsg.toLowerCase();
        
        // Check for specific errors
        if (errorLower.includes('already registered') || errorLower.includes('already exists')) {
          setErrors({ email: 'Email already registered', detail: 'This email is already registered. Please log in instead.' });
        } else if (errorLower.includes('invalid') && errorLower.includes('code')) {
          setErrors({ otp: 'Invalid verification code', detail: err.remaining_attempts ? `${err.remaining_attempts} attempts remaining` : '' });
        } else if (errorLower.includes('expired')) {
          setErrors({ otp: 'Code expired', detail: 'Please request a new verification code.' });
        } else {
          setErrors(err);
        }
      }
    } catch (error) {
      console.error('Signup confirm error:', error);
      const errData = error.response?.data || {};
      const errorMsg = errData.error || errData.detail || '';
      const errorLower = errorMsg.toLowerCase();
      
      if (errorLower.includes('already registered') || errorLower.includes('already exists')) {
        setErrors({ email: 'Email already registered', detail: 'This email is already registered. Please log in instead.' });
      } else if (errorLower.includes('invalid') && errorLower.includes('code')) {
        setErrors({ otp: 'Invalid verification code', detail: errData.remaining_attempts ? `${errData.remaining_attempts} attempts remaining` : '' });
      } else if (errorLower.includes('expired')) {
        setErrors({ otp: 'Code expired', detail: 'Please request a new verification code.' });
      } else {
        setErrors({ detail: errorMsg || 'Signup failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const openResetModal = (email = '') => {
    setResetEmail(email || formData.email || '');
    setResetSuccess(null);
    setResetModalOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e && e.preventDefault();
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetSuccess({ success: false, message: 'Please enter a valid email address.' });
      return;
    }
    try {
      setResetLoading(true);
      await requestPasswordReset(resetEmail);
      setResetSuccess({ success: true, message: 'If an account exists for this email, you will receive password reset instructions.' });
    } catch (error) {
      console.error('Password reset request failed:', error);
      setResetSuccess({ success: false, message: error.response?.data?.detail || 'Could not request password reset. Please try again later.' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-split-left">
        <div className="auth-header" style={{textAlign:'left'}}>
          <h1 style={{fontSize:'2.3rem',fontWeight:800,marginBottom:8, color:'#181818'}}>Create Your GI Yatra Account</h1>
          <p style={{color:'#888',fontSize:'1.08rem',marginBottom:32}}>Embark on a journey through Karnataka's heritage.</p>
        </div>
        {step === 'request' ? (
          <form onSubmit={handleRequestOtp} className="auth-form">
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
                disabled={requestLoading}
                style={{fontSize:'1.1rem'}} />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            <button type="submit" disabled={requestLoading} style={{marginTop:24,background:'#ff7a18',color:'#fff',fontWeight:700,fontSize:'1.15rem',border:'none',borderRadius:16,padding:'1rem 0',width:'100%',boxShadow:'none'}}>
              {requestLoading ? 'Sending...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="auth-form">
            <div className="form-group">
              <label htmlFor="otp">Verification code</label>
              <input
                id="otp"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="6-digit code"
                className={errors.otp ? 'error' : ''}
                disabled={loading}
                style={{fontSize:'1.1rem'}} />
              {errors.otp && <span className="error-message">{errors.otp}</span>}
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
                placeholder="At least 6 characters"
                disabled={loading}
                style={{fontSize:'1.1rem'}} />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Re-enter password"
                disabled={loading}
                style={{fontSize:'1.1rem'}} />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
            <button type="submit" disabled={loading} style={{marginTop:24,background:'#ff7a18',color:'#fff',fontWeight:700,fontSize:'1.15rem',border:'none',borderRadius:16,padding:'1rem 0',width:'100%',boxShadow:'none'}}>
              {loading ? 'Creating...' : 'Continue'}
            </button>
          </form>
        )}
        <div style={{marginTop:32,textAlign:'center'}}>
          <span style={{color:'#888'}}>Already have an account? </span>
          <button
            onClick={() => onNavigate && onNavigate('login')}
            style={{background:'none',border:'none',color:'#ff7a18',fontWeight:600,cursor:'pointer',fontSize:'1.05rem',padding:0,marginLeft:4}}>Log In</button>
        </div>
      </div>
      <div className="auth-split-right">
        <img src={signupImage} alt="Signup visual" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:32}} />
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

export default SignupPage;
