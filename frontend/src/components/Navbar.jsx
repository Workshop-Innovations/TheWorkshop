import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, BookOpen, Bot, Clock, Users, Home, User } from 'lucide-react';
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
    logout();
  };

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 flex justify-center pointer-events-none ${isScrolled ? 'pt-4 px-4' : 'pt-0 px-0'}`}>
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className={`pointer-events-auto transition-all duration-500 ease-[0.16,1,0.3,1] w-full max-w-7xl mx-auto
            ${isScrolled
              ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 border border-slate-100/50 rounded-full px-8 py-3'
              : 'bg-transparent border-transparent rounded-none px-6 py-6'
            }`}
        >
          <div className="flex items-center justify-between">
            {/* LOGO */}
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3 group">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="text-2xl font-black tracking-tighter text-slate-900 group-hover:text-primary transition-colors">
                Work<span className="text-primary">Shop</span>
              </span>
            </Link>

            {/* DESKTOP LINKS */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" label="Dashboard" />
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <NavLink to="/past-papers" label="Papers" />
                  <NavLink to="/study-suite" label="Study Suite" />

                  <div className="h-6 w-px bg-slate-200 mx-2"></div>

                  <button onClick={handleLogout} className="text-sm font-bold text-slate-500 hover:text-slate-900 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors">
                    Sign Out
                  </button>
                  <Link to="/profile" className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-primary text-xs font-bold overflow-hidden hover:shadow-md hover:border-primary/50 transition-all ml-2">
                    {profilePic ? (
                      <img src={profilePic} alt="Me" className="w-full h-full object-cover" />
                    ) : (
                      "ME"
                    )}
                  </Link>
                </>
              ) : (
                <>
                  <NavLink to="/pricing" label="Pricing" />
                  <NavLink to="/login" label="Log In" />
                  <Link
                    to="/register"
                    className="ml-4 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-full shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button 
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[55]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'anticipate' }}
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-[60] flex flex-col rounded-l-[32px] overflow-hidden border-l border-slate-100"
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50">
                <span className="text-xl font-black text-slate-900 tracking-tight">Navigation</span>
                <button onClick={closeMobile} className="p-3 hover:bg-slate-200 rounded-full transition-colors bg-white shadow-sm">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Mobile Menu Links */}
              <div className="flex-1 overflow-y-auto p-6">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <MobileLink to="/dashboard" label="Dashboard" icon={<Home className="w-5 h-5" />} onClick={closeMobile} />
                    <MobileLink to="/past-papers" label="Past Papers" icon={<BookOpen className="w-5 h-5" />} onClick={closeMobile} />
                    <MobileLink to="/study-suite" label="Study Suite" icon={<Bot className="w-5 h-5" />} onClick={closeMobile} />
                    <MobileLink to="/community" label="Community" icon={<Users className="w-5 h-5" />} onClick={closeMobile} />
                    <MobileLink to="/pomodoro" label="Focus Timer" icon={<Clock className="w-5 h-5" />} onClick={closeMobile} />
                    {user?.role === 'admin' && (
                      <MobileLink to="/admin" label="Admin Panel" icon={<Shield className="w-5 h-5" />} onClick={closeMobile} />
                    )}
                    <MobileLink to="/profile" label="My Profile" icon={<User className="w-5 h-5" />} onClick={closeMobile} />
                    
                    <div className="border-t border-slate-100 my-6"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-6 py-4 rounded-2xl text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center gap-4"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <MobileLink to="/pricing" label="Pricing" icon={null} onClick={closeMobile} />
                    <MobileLink to="/login" label="Log In" icon={null} onClick={closeMobile} />
                    
                    <div className="pt-8 mt-4 border-t border-slate-100">
                      <Link
                        to="/register"
                        onClick={closeMobile}
                        className="block w-full text-center px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all"
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
    className={`px-5 py-2.5 rounded-full text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors ${className || ''}`}
  >
    {label}
  </Link>
);

const MobileLink = ({ to, label, icon, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:text-primary transition-all active:scale-95"
  >
    {icon && <span className="text-slate-400 w-6 h-6 flex items-center justify-center bg-white shadow-sm rounded-lg">{icon}</span>}
    {label}
  </Link>
);

export default Navbar;
