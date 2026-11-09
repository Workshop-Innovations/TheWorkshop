import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, BookOpen, Bot, Clock, Users, Home, User, GraduationCap, MessageSquarePlus, ChevronDown, ListChecks, BarChart3, Gift, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';

// Secondary pages, under "More" on desktop and grouped at the end of the mobile menu
const MORE_LINKS = [
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/rewards', label: 'Rewards', icon: Gift },
  { to: '/feedback', label: 'Feedback', icon: MessageSquarePlus },
];

const Navbar = () => {
  const { user, logout, isAuthenticated, profilePic } = useAuth();
  const { tourWantsMenu } = useOnboarding();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // The guided tour opens the drawer to point at the links inside it
  useEffect(() => {
    setIsMobileOpen(tourWantsMenu);
  }, [tourWantsMenu]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const onDown = (e) => { if (!moreRef.current?.contains(e.target)) setIsMoreOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setIsMoreOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMoreOpen]);

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
              ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50 border border-slate-100/50 rounded-md px-8 py-3'
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
            <div className="hidden xl:flex items-center gap-1">
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" label="Dashboard" tour="nav-dashboard" />
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-md hover:bg-slate-200 transition-colors">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <NavLink to="/past-papers" label="Papers" tour="nav-past-papers" />
                  <NavLink to="/revision-notes" label="Revision Notes" tour="nav-revision-notes" />
                  <NavLink to="/study-suite" label="Study Suite" tour="nav-study-suite" />
                  <NavLink to="/community" label="Community" tour="nav-community" />
                  <NavLink to="/pomodoro" label="Focus Timer" tour="nav-pomodoro" />

                  <div className="relative" ref={moreRef}>
                    <button
                      data-tour="nav-more"
                      onClick={() => setIsMoreOpen((v) => !v)}
                      aria-expanded={isMoreOpen}
                      aria-haspopup="menu"
                      className="flex items-center gap-1 px-4 py-2.5 rounded-md text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      More <ChevronDown className={`w-4 h-4 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMoreOpen && (
                      <div role="menu" className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-xl border border-slate-100 py-2">
                        {MORE_LINKS.map(({ to, label, icon: Icon }) => (
                          <Link
                            key={to}
                            to={to}
                            role="menuitem"
                            onClick={() => setIsMoreOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Icon className="w-4 h-4 text-slate-400" /> {label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-6 w-px bg-slate-200 mx-2"></div>

                  <button onClick={handleLogout} className="text-sm font-bold text-slate-500 hover:text-slate-900 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors">
                    Sign Out
                  </button>
                  <Link
                    to="/profile"
                    data-tour="nav-profile"
                    aria-label={profilePic ? 'My profile' : 'My profile (add a photo)'}
                    className="relative w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-primary text-xs font-bold hover:shadow-md hover:border-primary/50 transition-all ml-2"
                  >
                    <span className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                      {profilePic ? (
                        <img src={profilePic} alt="Me" className="w-full h-full object-cover" />
                      ) : (
                        "ME"
                      )}
                    </span>
                    {!profilePic && <AddPhotoBadge />}
                  </Link>
                </>
              ) : (
                <>
                  <NavLink to="/about" label="About" />
                  <NavLink to="/pricing" label="Pricing" />
                  <NavLink to="/login" label="Log In" />
                  <Link
                    to="/onboarding"
                    className="ml-4 px-8 py-3 bg-primary text-white text-sm font-bold rounded-md shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:scale-95 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button
              data-tour="nav-menu"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="xl:hidden relative p-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              {isAuthenticated && !profilePic && !isMobileOpen && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-white" aria-hidden="true" />
              )}
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
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-[60] flex flex-col overflow-hidden border-l border-slate-100"
            >
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50">
                <span className="text-xl font-black text-slate-900 tracking-tight">Navigation</span>
                <button onClick={closeMobile} aria-label="Close menu" className="p-3 hover:bg-slate-200 rounded-md transition-colors bg-white shadow-sm">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Mobile Menu Links */}
              <div className="flex-1 overflow-y-auto p-6">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <MobileLink to="/dashboard" label="Dashboard" tour="nav-dashboard" icon={<Home className="w-5 h-5" />} onClick={closeMobile} />
                    <MobileLink to="/past-papers" label="Past Papers" tour="nav-past-papers" icon={<BookOpen className="w-5 h-5" />} onClick={closeMobile} />
                    <MobileLink to="/revision-notes" label="Revision Notes" tour="nav-revision-notes" icon={<GraduationCap className="w-5 h-5" />} onClick={closeMobile} />
                    <MobileLink to="/study-suite" label="Study Suite" tour="nav-study-suite" icon={<Bot className="w-5 h-5" />} onClick={closeMobile} />
                    <MobileLink to="/community" label="Community" tour="nav-community" icon={<Users className="w-5 h-5" />} onClick={closeMobile} />
                    <MobileLink to="/pomodoro" label="Focus Timer" tour="nav-pomodoro" icon={<Clock className="w-5 h-5" />} onClick={closeMobile} />
                    <div data-tour="nav-more" className="space-y-2">
                      {MORE_LINKS.map(({ to, label, icon: Icon }) => (
                        <MobileLink key={to} to={to} label={label} icon={<Icon className="w-5 h-5" />} onClick={closeMobile} />
                      ))}
                    </div>
                    {user?.role === 'admin' && (
                      <MobileLink to="/admin" label="Admin Panel" icon={<Shield className="w-5 h-5" />} onClick={closeMobile} />
                    )}
                    <MobileLink
                      to="/profile"
                      label={profilePic ? 'My Profile' : 'My Profile · add a photo'}
                      tour="nav-profile"
                      icon={<User className="w-5 h-5" />}
                      onClick={closeMobile}
                    />

                    <div className="border-t border-slate-100 my-6"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-6 py-4 rounded-md text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center gap-4"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <MobileLink to="/about" label="About" icon={null} onClick={closeMobile} />
                    <MobileLink to="/pricing" label="Pricing" icon={null} onClick={closeMobile} />
                    <MobileLink to="/login" label="Log In" icon={null} onClick={closeMobile} />

                    <div className="pt-8 mt-4 border-t border-slate-100">
                      <Link
                        to="/onboarding"
                        onClick={closeMobile}
                        className="block w-full text-center px-8 py-4 bg-primary text-white font-bold rounded-md shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all"
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

const AddPhotoBadge = () => (
  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center ring-2 ring-white" aria-hidden="true">
    <Camera className="w-3 h-3" />
  </span>
);

const NavLink = ({ to, label, className, tour }) => (
  <Link
    to={to}
    data-tour={tour}
    className={`whitespace-nowrap px-4 py-2.5 rounded-md text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors ${className || ''}`}
  >
    {label}
  </Link>
);

const MobileLink = ({ to, label, icon, onClick, tour }) => (
  <Link
    to={to}
    data-tour={tour}
    onClick={onClick}
    className="flex items-center gap-4 px-6 py-4 rounded-md text-slate-700 font-bold hover:bg-slate-50 hover:text-primary transition-all active:scale-95"
  >
    {icon && <span className="text-slate-400 w-6 h-6 flex items-center justify-center bg-white shadow-sm rounded-md">{icon}</span>}
    {label}
  </Link>
);

export default Navbar;
