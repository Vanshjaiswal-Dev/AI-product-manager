import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlanStore } from '../store/planStore';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';

export default function Navbar({ variant = 'marketing' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentPlanId = usePlanStore((s) => s.currentPlanId);
  const { user, isAuthenticated, logout } = useAuthStore();

  const [activeHash, setActiveHash] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    setActiveHash(location.hash || '#home');
  }, [location.hash]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (pathOrHash) => {
    if (pathOrHash.startsWith('#')) return activeHash === pathOrHash;
    if (pathOrHash.startsWith('/dashboard') && location.pathname.startsWith('/dashboard')) return true;
    return location.pathname === pathOrHash;
  };

  const marketingLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
  ];

  const appLinks = [
    { label: 'Dashboard', to: currentPlanId ? `/dashboard/${currentPlanId}` : '/dashboard' },
    { label: 'History', to: '/history' },
    { label: 'New Idea', to: '/new' },
  ];

  const links = variant === 'marketing' ? marketingLinks : appLinks;

  return (
    <>
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100vw-32px)] max-w-[1000px] transition-all duration-300 animate-[slideDown_0.5s_ease]">
        <div className="flex items-center justify-between h-16 px-4 md:px-6 bg-background/60 backdrop-blur-2xl border border-card-border rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-heading text-xl md:text-2xl font-bold text-primary-text tracking-wide shrink-0">
            <Logo className="w-7 h-7 text-accent" />
            <span className="max-sm:hidden">Planify</span>
          </Link>

          {/* Nav Links — Desktop */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-card/50 border border-card-border rounded-full mx-4">
            {links.map((link) => {
              const target = link.to || link.href;
              const active = isActive(target);
              return link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`relative px-4 py-1.5 text-sm font-medium transition-colors z-10 rounded-full
                    ${active ? 'text-white' : 'text-secondary-text hover:text-primary-text'}
                  `}
                >
                  {active && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-accent rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setActiveHash(link.href)}
                  className={`relative px-4 py-1.5 text-sm font-medium transition-colors z-10 rounded-full
                    ${active ? 'text-white' : 'text-secondary-text hover:text-primary-text'}
                  `}
                >
                  {active && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 bg-accent rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2 border pl-2 pr-3 py-1.5 rounded-full transition-all max-sm:pr-2
                    ${profileOpen ? 'bg-card-border border-gray-600' : 'bg-card hover:bg-card-border border-card-border hover:border-gray-600'}
                  `}
                >
                  <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 text-accent font-bold flex items-center justify-center text-xs uppercase">
                    {user?.name?.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-primary-text max-sm:hidden">
                    {user?.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-secondary-text transition-transform duration-200 max-sm:hidden ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-background/95 backdrop-blur-2xl border border-card-border rounded-2xl p-2 shadow-2xl flex flex-col gap-1"
                    >
                      <div className="px-3 py-2.5 border-b border-card-border mb-1">
                        <div className="text-sm font-bold text-primary-text truncate">{user?.name}</div>
                        <div className="text-xs text-secondary-text truncate mt-0.5">{user?.email}</div>
                      </div>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              variant === 'marketing' && (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center font-semibold text-sm
                    px-5 py-2.5 rounded-full bg-accent text-white
                    shadow-[0_2px_12px_rgba(79,70,229,0.4)]
                    hover:bg-accent-hover hover:shadow-[0_4px_16px_rgba(79,70,229,0.5)]
                    hover:-translate-y-0.5 transition-all duration-300 max-sm:px-4 max-sm:py-2 max-sm:text-xs"
                >
                  Get Started
                </Link>
              )
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden flex flex-col gap-[5px] p-2 cursor-pointer bg-card border border-card-border rounded-full hover:bg-card-border transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-4 h-4 text-primary-text" />
              ) : (
                <Menu className="w-4 h-4 text-primary-text" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-[76px] left-0 right-0 bg-background/90 backdrop-blur-2xl border border-card-border rounded-3xl p-4 shadow-2xl flex flex-col gap-2"
            >
              {links.map((link) => {
                const target = link.to || link.href;
                const active = isActive(target);
                return link.to ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-colors
                      ${active ? 'bg-accent/10 text-accent' : 'text-secondary-text hover:bg-card hover:text-primary-text'}
                    `}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => {
                      setActiveHash(link.href);
                      setMobileOpen(false);
                    }}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-colors
                      ${active ? 'bg-accent/10 text-accent' : 'text-secondary-text hover:bg-card hover:text-primary-text'}
                    `}
                  >
                    {link.label}
                  </a>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
