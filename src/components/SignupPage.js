import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signupRequestOtp, passwordResetRequestOtp, passwordResetConfirmOtp } from '../services/giyatraApi';
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

  const [resetStep, setResetStep] = useState('request');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetErrors, setResetErrors] = useState({});

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
      const respData = error.response?.data || {};
      const errorMsg = respData.error || respData.detail || '';

      // If backend explicitly returns 409 for existing user, respect that message
      if (error.response?.status === 409) {
        setErrors({ email: 'Email already registered' });
        setRequestMessage(errorMsg || 'This email is already registered. Please log in instead.');
      } else {
        const errorLower = String(errorMsg).toLowerCase();
        // Fallback checks for older/different error text
        if (errorLower.includes('already registered') || errorLower.includes('already exists') || errorLower.includes('email already')) {
          setErrors({ email: 'Email already registered' });
          setRequestMessage('This email is already registered. Please log in instead.');
        } else {
          setRequestMessage(errorMsg || 'Could not request code. Please try again later.');
        }
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

      // If backend returns 409 explicitly, surface that as an "already registered" case
      if (error.response?.status === 409) {
        setErrors({ email: 'Email already registered', detail: errorMsg || 'This email is already registered. Please log in instead.' });
      } else {
        const errorLower = String(errorMsg).toLowerCase();
        if (errorLower.includes('already registered') || errorLower.includes('already exists')) {
          setErrors({ email: 'Email already registered', detail: 'This email is already registered. Please log in instead.' });
        } else if (errorLower.includes('invalid') && errorLower.includes('code')) {
          setErrors({ otp: 'Invalid verification code', detail: errData.remaining_attempts ? `${errData.remaining_attempts} attempts remaining` : '' });
        } else if (errorLower.includes('expired')) {
          setErrors({ otp: 'Code expired', detail: 'Please request a new verification code.' });
        } else {
          setErrors({ detail: errorMsg || 'Signup failed. Please try again.' });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Note: reset modal is opened directly by UI actions where needed
  const handleResetSubmit = async (e) => {
    e && e.preventDefault();
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetSuccess({ success: false, message: 'Please enter a valid email address.' });
      return;
    }
    try {
      setResetLoading(true);
      const resp = await passwordResetRequestOtp(resetEmail);
  setResetSuccess({ success: true, message: resp?.message || 'Email sent', expires_at: resp?.expires_at });
      setResetStep('confirm');
    } catch (error) {
      console.error('Password reset request failed:', error);
      const data = error?.response?.data || {};
      const serverMsg = data.error || data.detail || data.message || '';
      if (error.response?.status === 404) {
        // show backend 'email not found' message explicitly
        setResetSuccess({ success: false, message: serverMsg || 'This email is not found in our database.' });
        setResetErrors({ email: serverMsg || 'Email not found' });
      } else {
        setResetSuccess({ success: false, message: serverMsg || 'Could not request password reset. Please try again later.' });
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetConfirm = async (e) => {
    e && e.preventDefault();
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
      console.error('Password reset confirm failed:', error);
      const data = error?.response?.data || {};
      const serverMsg = data.error || data.detail || data.message || '';
      if (error.response?.status === 404) {
        setResetSuccess({ success: false, message: serverMsg || 'This email is not found in our database.' });
        setResetErrors({ email: serverMsg || 'Email not found' });
      } else {
        setResetSuccess({ success: false, message: serverMsg || 'Could not reset password. Please try again.' });
        if (data?.errors) setResetErrors(data.errors);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-split-left">
        <div className="auth-header" style={{textAlign:'left'}}>
          <h1 style={{fontSize:'1.9rem',fontWeight:800,marginBottom:6, color:'#181818'}}>Create Your GI Yatra Account</h1>
          <p style={{color:'#888',fontSize:'0.96rem',marginBottom:12}}>Embark on a journey through Karnataka's heritage.</p>
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
            <button type="submit" disabled={requestLoading} style={{marginTop:12,background:'#ff7a18',color:'#fff',fontWeight:700,fontSize:'1rem',border:'none',borderRadius:12,padding:'0.6rem 0',width:'100%',boxShadow:'none'}}>
              {requestLoading ? 'Sending...' : 'Continue'}
            </button>
            {requestMessage && (
              <div style={{ marginTop: 12, color: '#0f172a', fontSize: '0.95rem' }}>{requestMessage}{expiresAt ? ` (expires at ${new Date(expiresAt).toLocaleString()})` : ''}</div>
            )}
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
            <button type="submit" disabled={loading} style={{marginTop:12,background:'#ff7a18',color:'#fff',fontWeight:700,fontSize:'1rem',border:'none',borderRadius:12,padding:'0.6rem 0',width:'100%',boxShadow:'none'}}>
              {loading ? 'Creating...' : 'Continue'}
            </button>
          </form>
        )}
        <div style={{marginTop:12,textAlign:'center'}}>
          <span style={{color:'#888'}}>Already have an account? </span>
          <button
            onClick={() => onNavigate && onNavigate('login')}
            style={{background:'none',border:'none',color:'#ff7a18',fontWeight:600,cursor:'pointer',fontSize:'1.05rem',padding:0,marginLeft:4}}>Log In</button>
        </div>
      </div>
    <div className="auth-split-right">
  <img src={signupImage} alt="Signup visual" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:0}} />
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

export default SignupPage;
