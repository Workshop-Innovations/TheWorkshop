import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';

const Navbar = ({
  currentView = 'timer', // Default view to 'timer' for safety
  setCurrentView = () => { }, // Default to a no-op function if not passed
}) => {
  const navigate = useNavigate();

  // ADD: State to track authentication status
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ADD: Effect to check login status on mount and listen for localStorage changes
  useEffect(() => {
    const checkLoginStatus = () => {
      // NOTE: Using a mock access token check for demonstration
      const token = localStorage.getItem('accessToken');
      setIsLoggedIn(!!token); // Set true if token exists, false otherwise
    };

    // Initial check when component mounts
    checkLoginStatus();

    // Listen for storage events (e.g., login/logout from another tab)
    window.addEventListener('storage', checkLoginStatus);

    // Cleanup the event listener when component unmounts
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []); // Empty dependency array means this runs once on mount

  // ADD: Logout function
  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // Clear the token
    setIsLoggedIn(false); // Update local state
    navigate('/login'); // Redirect to login page
  };

  const motionProps = {
    whileHover: { scale: 1.05 },
    transition: { type: 'spring', stiffness: 400, damping: 10 },
  };

  return (
    <div className="w-full fixed top-0 left-0 z-50 bg-[#121212] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-20">

          {/* --- LEFT: LOGO --- */}
          <motion.div {...motionProps} className="flex-shrink-0">
            <Link to={isLoggedIn ? "/dashboard" : "/"} className="text-3xl font-bold text-white tracking-tight">
              WorkShop
            </Link>
          </motion.div>

          {/* --- RIGHT: NAVIGATION & ACTIONS --- */}
          <div className="flex items-center gap-6">

            {/* Common Links */}
            {isLoggedIn && (
              <>
                <Link to="/dashboard" className="px-3 py-2 text-base font-medium text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link to="/materials" className="px-3 py-2 text-base font-medium text-gray-300 hover:text-white transition-colors">
                  Materials
                </Link>
              </>
            )}

            <Link to="/feedback" className="px-3 py-2 text-base font-medium text-gray-300 hover:text-white transition-colors">
              Feedback
            </Link>

            {/* Auth Actions */}
            {isLoggedIn ? (
              <div className="flex items-center gap-4 ml-2 pl-4 border-l border-white/10">
                <motion.button
                  onClick={() => navigate('/profile')}
                  {...motionProps}
                  className="flex items-center gap-2 px-4 py-2 text-base text-white bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors"
                >
                  <FaUser className="text-sm" />
                  <span className="hidden sm:inline">Profile</span>
                </motion.button>
                <motion.button
                  onClick={handleLogout}
                  {...motionProps}
                  className="flex items-center gap-2 px-4 py-2 text-base text-red-400 border border-red-400/20 rounded-md hover:bg-red-400/10 transition-colors"
                >
                  <FaSignOutAlt className="text-sm" />
                  <span className="hidden sm:inline">Sign Out</span>
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-4 ml-2 pl-4 border-l border-white/10">
                <Link
                  to="/login"
                  className="px-4 py-2 text-base font-medium text-white hover:text-gray-300 transition-colors"
                >
                  Login
                </Link>
                <motion.div {...motionProps}>
                  <Link
                    to="/register"
                    className="px-5 py-2 text-base font-medium bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Register
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

        </nav>
      </div>
    </div>
  )
}

export default Navbar;
