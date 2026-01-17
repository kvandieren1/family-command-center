import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroOverlay({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window === 'undefined') return;
    
    // Mark as shown in sessionStorage (using same key as Dashboard)
    try {
      sessionStorage.setItem('introPlayed', 'true');
    } catch (e) {
      console.warn('Could not access sessionStorage:', e);
    }
    
    // Hide after 3 seconds (allowing time for exit animation)
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call onComplete callback after a brief delay to allow exit animation
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 500);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Main Content Container */}
          <motion.div
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{
              opacity: { duration: 0.8, delay: 0.2 },
              y: { duration: 0.5, delay: 2.5, ease: [0.4, 0, 0.2, 1] }
            }}
            className="text-center px-6 sm:px-8"
          >
            {/* Main Text */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white mb-4 leading-tight"
              style={{
                textShadow: '0 0 40px rgba(20, 184, 166, 0.3), 0 0 80px rgba(99, 102, 241, 0.2)',
                letterSpacing: '-0.02em'
              }}
            >
              Goodbye Mental Load,
            </motion.h1>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-indigo-400 mb-8 leading-tight"
              style={{
                textShadow: '0 0 60px rgba(20, 184, 166, 0.4)',
                letterSpacing: '-0.02em',
                filter: 'drop-shadow(0 0 20px rgba(20, 184, 166, 0.3))'
              }}
            >
              get in the cockpit of your life!
            </motion.h2>

            {/* Subtle Loading Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex items-center justify-center gap-2 mt-8"
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-teal-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-indigo-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.2,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-teal-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.4,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>

          {/* Decorative Gradient Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: 2,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
