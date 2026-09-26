import { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { useLocation } from 'react-router-dom';

export default function SmoothScroll({ children }) {
  const location = useLocation();
  const lenisRef = useRef(null);
  const reqIdRef = useRef(null);

  // Initialize Lenis ONCE
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.65, // Reduced for snappier response (close to native settling time)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1.35, // Increased to match native scroll distance
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });
    
    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      reqIdRef.current = requestAnimationFrame(raf);
    }

    reqIdRef.current = requestAnimationFrame(raf);

    return () => {
      if (reqIdRef.current) {
        cancelAnimationFrame(reqIdRef.current);
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []); // Empty dependency array ensures it only runs ONCE

  // Handle Route Changes independently
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
  }, [location.pathname]);

  return <>{children}</>;
}
