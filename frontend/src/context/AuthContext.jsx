import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [user, setUser] = useState(null); // Store full user object including role
  const [loading, setLoading] = useState(true); // Loading state for user fetch

  const navigate = useNavigate();

  // Function to fetch user profile
  const fetchUserProfile = useCallback(async (token) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // If token is invalid, logout (but maybe don't redirect strictly yet)
        console.error("Failed to fetch user profile");
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. LOGIN
  const login = useCallback((token) => {
    localStorage.setItem('accessToken', token);
    setAccessToken(token);
    // Fetch user profile immediately
    fetchUserProfile(token);

    toast.success("Login successful!");
    navigate('/dashboard', { replace: true });
  }, [navigate, fetchUserProfile]);

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setUser(null);
    localStorage.removeItem('username'); // Clean up legacy

    toast.info("You have been logged out.");
    navigate('/login');
  }, [navigate]);

  // 2. INITIALIZATION EFFECT
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setAccessToken(storedToken);
      fetchUserProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const authContextValue = {
    accessToken,
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!accessToken,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};