import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaSignOutAlt, FaShieldAlt } from 'react-icons/fa'; // Added FaShieldAlt
import { useAuth } from '../context/AuthContext'; // Import useAuth

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, profilePic } = useAuth(); // Use useAuth
  const [isScrolled, setIsScrolled] = useState(false);
  // const [isLoggedIn, setIsLoggedIn] = useState(false); // Remove local state

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none flex justify-center ${isScrolled ? 'pt-4' : 'pt-0'}`}>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`pointer-events-auto transition-all duration-500 ease-in-out
          ${isScrolled
            ? 'w-[90%] md:w-[80%] max-w-5xl bg-white/80 backdrop-blur-md rounded-full px-6 py-3 shadow-lg shadow-blue-900/5 border border-white/40'
            : 'w-full bg-transparent px-6 py-4 border-b border-transparent'
          }
        `}
      >
        <div className={`max-w-7xl mx-auto flex items-center justify-between ${!isScrolled && 'px-4'}`}>

          {/* LOGO */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <img src="/logo.png" alt="WorkShop Logo" className="h-10 w-auto group-hover:scale-105 transition-transform object-contain" />
            <span className={`text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 ${!isScrolled && 'text-slate-900'}`}>
              WorkShop
            </span>
          </Link>

          {/* LINKS */}
          <div className="flex items-center gap-2 md:gap-6">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" label="Dashboard" />
                {user?.role === 'admin' && (
                  <Link to="/admin" className="hidden sm:flex items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1 rounded-full transition-colors border border-purple-100">
                    <FaShieldAlt className="text-xs" />
                    Admin
                  </Link>
                )}
                <NavLink to="/past-papers" label="Papers" className="hidden sm:block" />
                <NavLink to="/study-suite" label="Study Suite" className="hidden sm:block" />

                <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

                <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors">
                  Sign Out
                </button>
                <Link to="/profile" className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] overflow-hidden group">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primary text-xs font-bold overflow-hidden">
                    {profilePic ? (
                      <img src={profilePic} alt="Me" className="w-full h-full object-cover" />
                    ) : (
                      "ME"
                    )}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <div className="hidden md:flex items-center gap-6">
                  <NavLink to="/pricing" label="Pricing" />
                  <NavLink to="/login" label="Log In" />
                </div>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full shadow-lg hover:bg-primary transition-all hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>
    </div>
  );
};

const NavLink = ({ to, label, className }) => (
  <Link
    to={to}
    className={`text-sm font-medium text-slate-600 hover:text-primary transition-colors ${className}`}
  >
    {label}
  </Link>
);

export default Navbar;
