import React, { createContext, useState, useContext, useEffect } from 'react';
import { signup, login, logout, getCurrentUser, signupConfirmOtp } from '../services/giyatraApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error);
          // Token might be invalid, clear it
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const handleSignup = async (email, password) => {
    try {
      const data = await signup(email, password);
      const newToken = data.token;
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      
      // Fetch user data after signup
      const userData = await getCurrentUser();
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      return { 
        success: false, 
        error: error.response?.data || { detail: 'Signup failed. Please try again.' }
      };
    }
  };

  // Confirm signup using SPA OTP confirm endpoint. This returns the token on success
  const handleSignupConfirmOtp = async (email, otp, password) => {
    try {
      const data = await signupConfirmOtp(email, otp, password);
      const newToken = data.token;
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);

      // Fetch user data after signup
      const userData = await getCurrentUser();
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Signup (OTP confirm) failed:', error);
      return {
        success: false,
        error: error.response?.data || { detail: 'Signup failed. Please try again.' }
      };
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const data = await login(email, password);
      const newToken = data.token;
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      
      // Fetch user data after login
      const userData = await getCurrentUser();
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: {
          ...(error.response?.data || { detail: 'Login failed. Please check your credentials.' }),
          status: error.response?.status
        }
      };
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout request failed:', error);
      // Continue with local cleanup even if server request fails
    }
    
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    signup: handleSignup,
    signupConfirmOtpFlow: handleSignupConfirmOtp,
    login: handleLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
