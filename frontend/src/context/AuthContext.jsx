import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem('userProfilePic') || null);

  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async (token) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        if (userData.profile_pic) {
          setProfilePic(userData.profile_pic);
          localStorage.setItem('userProfilePic', userData.profile_pic);
        } else {
          setProfilePic(null);
          localStorage.removeItem('userProfilePic');
        }
        return userData;
      } else {
        console.error("Failed to fetch user profile");
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (token) => {
    localStorage.setItem('accessToken', token);
    setAccessToken(token);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        if (userData.profile_pic) {
          setProfilePic(userData.profile_pic);
          localStorage.setItem('userProfilePic', userData.profile_pic);
        } else {
          setProfilePic(null);
          localStorage.removeItem('userProfilePic');
        }
        toast.success("Login successful!");
        if (!userData.study_goal && !userData.profile_pic) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
        return;
      }
    } catch (error) {
      console.error("Error fetching user profile on login:", error);
    }

    // Profile fetch failed — don't show success, clean up and notify user
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setUser(null);
    toast.error("Login failed: could not load your profile. Please try again.");
  }, [navigate]);

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setUser(null);
    localStorage.removeItem('username');
    setProfilePic(null);
    localStorage.removeItem('userProfilePic');

    toast.info("You have been logged out.");
    navigate('/login');
  }, [navigate]);

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
    if (newPicBase64) {
      setProfilePic(newPicBase64);
      localStorage.setItem('userProfilePic', newPicBase64);
    } else {
      setProfilePic(null);
      localStorage.removeItem('userProfilePic');
    }

    if (accessToken) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ profile_pic: newPicBase64 })
        });

        if (!response.ok) {
          console.error("Failed to save profile picture to server:", await response.text());
          toast.error("Failed to save profile picture to server.");
        }
      } catch (error) {
        console.error("Error saving profile picture:", error);
        toast.error("Network error while saving profile picture.");
      }
    }
  }, [accessToken]);

  const authContextValue = {
    accessToken,
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!accessToken,
    profilePic,
    updateProfilePic
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
