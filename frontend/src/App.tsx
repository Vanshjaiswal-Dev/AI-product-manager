import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SmoothScroll from './components/SmoothScroll';
import PageTransition from './components/PageTransition';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import Landing from './pages/Landing';
import IdeaInput from './pages/IdeaInput';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <SmoothScroll>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

          {/* App pages — wrapped in AppLayout and ProtectedRoute */}
          <Route element={<AppLayout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/new" element={<PageTransition><IdeaInput /></PageTransition>} />
              <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
              <Route path="/dashboard/:id" element={<PageTransition><Dashboard /></PageTransition>} />
              <Route path="/history" element={<PageTransition><History /></PageTransition>} />
            </Route>
          </Route>
        </Routes>
      </AnimatePresence>
    </SmoothScroll>
  );
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#FFFFFF' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
        }}
      />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
