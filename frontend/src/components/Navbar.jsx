import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaBars, FaTimes, FaBookOpen, FaRobot, FaClock, FaUsers } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated, profilePic } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    setIsMobileOpen(false);
    logout(); // AuthContext.logout() already navigates to /login
  };

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
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

            {/* DESKTOP LINKS */}
            <div className="hidden md:flex items-center gap-2 md:gap-6">
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" label="Dashboard" />
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1 rounded-full transition-colors border border-purple-100">
                      <FaShieldAlt className="text-xs" />
                      Admin
                    </Link>
                  )}
                  <NavLink to="/past-papers" label="Papers" />
                  <NavLink to="/study-suite" label="Study Suite" />

                  <div className="h-4 w-px bg-slate-200"></div>

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
                  <NavLink to="/pricing" label="Pricing" />
                  <NavLink to="/login" label="Log In" />
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full shadow-lg hover:bg-primary transition-all hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button 
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>
        </motion.nav>
      </div>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-[60] flex flex-col"
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <span className="text-lg font-bold text-slate-900">Menu</span>
                <button onClick={closeMobile} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <FaTimes className="text-slate-500" />
                </button>
              </div>

              {/* Mobile Menu Links */}
              <div className="flex-1 overflow-y-auto py-4">
                {isAuthenticated ? (
                  <div className="space-y-1 px-3">
                    <MobileLink to="/dashboard" label="Dashboard" icon="🏠" onClick={closeMobile} />
                    <MobileLink to="/past-papers" label="Past Papers" icon={<FaBookOpen />} onClick={closeMobile} />
                    <MobileLink to="/study-suite" label="Study Suite" icon={<FaRobot />} onClick={closeMobile} />
                    <MobileLink to="/community" label="Community" icon={<FaUsers />} onClick={closeMobile} />
                    <MobileLink to="/pomodoro" label="Focus Timer" icon={<FaClock />} onClick={closeMobile} />
                    {user?.role === 'admin' && (
                      <MobileLink to="/admin" label="Admin Panel" icon={<FaShieldAlt />} onClick={closeMobile} />
                    )}
                    <MobileLink to="/profile" label="My Profile" icon="👤" onClick={closeMobile} />
                    
                    <div className="border-t border-slate-100 my-3 mx-1"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 rounded-xl text-red-500 font-medium hover:bg-red-50 transition-colors flex items-center gap-3"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 px-3">
                    <MobileLink to="/pricing" label="Pricing" icon="💰" onClick={closeMobile} />
                    <MobileLink to="/login" label="Log In" icon="🔑" onClick={closeMobile} />
                    
                    <div className="px-3 pt-4">
                      <Link
                        to="/register"
                        onClick={closeMobile}
                        className="block w-full text-center px-5 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-primary transition-all"
                      >
                        Get Started
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const NavLink = ({ to, label, className }) => (
  <Link
    to={to}
    className={`text-sm font-medium text-slate-600 hover:text-primary transition-colors ${className || ''}`}
  >
    {label}
  </Link>
);

const MobileLink = ({ to, label, icon, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
  >
    <span className="text-slate-400 text-sm w-5 flex-shrink-0 flex items-center justify-center">{icon}</span>
    {label}
  </Link>
);

export default Navbar;
