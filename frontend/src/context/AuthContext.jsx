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
  // Profile Picture Management — must be declared before fetchUserProfile which uses setProfilePic
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem('userProfilePic') || null);

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
        // Sync profile pic from backend
        if (userData.profile_pic) {
          setProfilePic(userData.profile_pic);
          localStorage.setItem('userProfilePic', userData.profile_pic);
        }
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

  const updateProfilePic = useCallback(async (newPicBase64) => {
    // 1. Optimistic Update (Local)
    if (newPicBase64) {
      setProfilePic(newPicBase64);
      localStorage.setItem('userProfilePic', newPicBase64);
    } else {
      setProfilePic(null);
      localStorage.removeItem('userProfilePic');
    }

    // 2. Sync with Backend
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ profile_pic: newPicBase64 })
        });

        if (!response.ok) {
          console.error("Failed to save profile picture to server:", await response.text());
          toast.error("Failed to save profile picture to server.");
          // Optional: Revert local state if critically needed, but keep it simple for now
        }
      } catch (error) {
        console.error("Error saving profile picture:", error);
        toast.error("Network error while saving profile picture.");
      }
    }
  }, []);

  const authContextValue = {
    accessToken,
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!accessToken,
    profilePic,      // Expose profilePic
    updateProfilePic // Expose updater function
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};