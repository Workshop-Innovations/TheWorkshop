import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null);

  // State flag to track a successful, yet unhandled, login
  const [didLogin, setDidLogin] = useState(false); 

  const navigate = useNavigate();

  // 1. LOGIN: Only updates state and sets the flag
  const login = useCallback((token, providedUsername) => {
    // 1a. Store data synchronously
    localStorage.setItem('accessToken', token);
    setAccessToken(token);
    
    if (providedUsername) {
      localStorage.setItem('username', providedUsername);
      setUsername(providedUsername);
    }
    
    // 1b. Set flag to trigger the independent redirect effect
    setDidLogin(true); 

    toast.success("Login successful! Redirecting...");
  }, []); 

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    setUsername(null);
    localStorage.removeItem('username');
    
    // Ensure didLogin is always false on logout
    setDidLogin(false); 
    
    toast.info("You have been logged out.");
    navigate('/login');
  }, [navigate]);

  // 2. REDIRECT EFFECT: Runs only when didLogin is set to true
  useEffect(() => {
    if (didLogin) {
      // Clear the flag immediately
      setDidLogin(false); 
      
      // CRITICAL FIX: setTimeout(0) pushes navigation to the end of the event loop.
      // This ensures the current rendering/cleanup of the Login component is complete
      // before the navigation command executes.
      const timer = setTimeout(() => {
          // Use { replace: true } for cleaner history
          navigate('/dashboard', { replace: true }); 
      }, 0);

      // Cleanup function
      return () => clearTimeout(timer); 
    }
  }, [didLogin, navigate]); 
  
  // 3. INITIALIZATION EFFECT: Runs only on component mount to sync state with localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken && storedToken !== accessToken) {
      setAccessToken(storedToken);
    }
    
    const storedUsername = localStorage.getItem('username');
    if (storedUsername && storedUsername !== username) {
      setUsername(storedUsername);
    }
  }, []); 


  const authContextValue = {
    accessToken,
    username,
    login,
    logout,
    // Expose authentication status
    isAuthenticated: !!accessToken, 
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};