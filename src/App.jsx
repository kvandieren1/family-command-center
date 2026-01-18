import React, { useState, useEffect } from 'react';
import { supabase, handleGoogleCallback } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import SetupWizard from './components/SetupWizard';
import EventReviewer from './components/EventReviewer';
import PremiumGate from './components/PremiumGate';

// Household ID is now dynamically retrieved from authenticated user's household
// No hardcoded household ID - each user accesses only their own household data

function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [starredCount, setStarredCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showEventReviewer, setShowEventReviewer] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [household, setHousehold] = useState(null);

  useEffect(() => {
    // Check if user is already logged in on initial load
    checkAuthStatus();

    // Listen for auth state changes (handles OAuth callbacks)
    let subscription = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User just signed in via OAuth
          setIsLoggedIn(true);
          await handleOAuthCallback(session);
        } else if (event === 'SIGNED_OUT') {
          // User signed out
          setIsLoggedIn(false);
          setOnboardingComplete(false);
          setHousehold(null);
          setShowEventReviewer(false);
        }
      });
      subscription = data.subscription;
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
    }

    return () => {
      // Safely unsubscribe only if subscription was successfully created
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth state:', error);
        }
      }
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        // Only fetch household if user is logged in
        await handleOAuthCallback(session);
      } else {
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      setIsLoggedIn(false);
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (session) => {
    try {
      if (!session) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        session = currentSession;
      }

      if (!session) {
        setIsLoading(false);
        return;
      }

      setIsLoggedIn(true);
      const result = await handleGoogleCallback();
      
      if (result.success && result.household) {
        // Found existing household
        console.log('Existing household found via Google login:', result.household);
        setHousehold(result.household);
        setOnboardingComplete(true);
        setIsPremium(result.household.is_premium || false);
        
        // If premium, skip EventReviewer and go straight to Dashboard
        if (result.household.is_premium) {
          setShowEventReviewer(false);
        } else {
          // Show Event Reviewer after successful login
          setShowEventReviewer(true);
        }
        
        localStorage.setItem('onboardingComplete', 'true');
        if (result.household.name) {
          localStorage.setItem('householdData', JSON.stringify(result.household));
        }
      } else if (result.success && result.user) {
        // User logged in but no household found - advance to Event Reviewer
        console.log('User logged in, no household found. Advancing to Event Reviewer.');
        setOnboardingComplete(true);
        setShowEventReviewer(true);
        // User can complete onboarding later if needed
      }
    } catch (err) {
      console.error('Error handling OAuth callback:', err);
    } finally {
      setIsLoading(false);
      // Clean up URL parameters
      if (window.location.search.includes('code=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };

  // Handler for when user completes Google login from SetupWizard
  const handleGoogleLoginComplete = () => {
    // This will be called after OAuth callback processes
    // The auth state change handler will take care of the rest
  };

  const handleStarredCountChange = (count) => {
    setStarredCount(count);
  };

  const handlePremiumUnlock = async () => {
    // Immediately update local state to clear "Initializing Cockpit" screen
    setIsPremium(true);
    setShowEventReviewer(false);
    
    // Also verify in Supabase (but don't wait for it)
    // Use household from state instead of hardcoded ID
    if (!household?.id) {
      console.warn('Cannot verify premium status: no household ID available');
      return;
    }
    
    const { data, error } = await supabase
      .from('households')
      .select('is_premium')
      .eq('id', household.id)
      .single();

    if (error) {
      console.error('Error verifying premium status:', error);
    } else if (data?.is_premium) {
      console.log('Premium status confirmed in database');
    }
  };

  // Poll for premium status changes (in case it's updated elsewhere)
  useEffect(() => {
    if (onboardingComplete && !isPremium && showEventReviewer && household?.id) {
      const interval = setInterval(async () => {
        const { data } = await supabase
          .from('households')
          .select('is_premium')
          .eq('id', household.id)
          .single();

        if (data?.is_premium && !isPremium) {
          setIsPremium(true);
          setShowEventReviewer(false);
          clearInterval(interval);
        }
      }, 2000); // Check every 2 seconds

      return () => clearInterval(interval);
    }
  }, [onboardingComplete, isPremium, showEventReviewer]);

  const handleEventReviewerComplete = () => {
    setShowEventReviewer(false);
  };

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
    localStorage.setItem('onboardingComplete', 'true');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Initializing Cockpit...</div>
      </div>
    );
  }

  return (
    <div className="App bg-slate-950 min-h-screen overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!isLoggedIn || !onboardingComplete ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SetupWizard 
              onComplete={handleOnboardingComplete}
              isLoggedIn={isLoggedIn}
              onGoogleLoginComplete={handleGoogleLoginComplete}
            />
          </motion.div>
        ) : showEventReviewer ? (
          <motion.div
            key="eventReviewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EventReviewer 
              householdId={household?.id}
              onStarredCountChange={handleStarredCountChange}
              onComplete={handleEventReviewerComplete}
            />
            {/* Premium Gate - shows when starredCount >= 3 AND not premium */}
            {starredCount >= 3 && !isPremium && (
              <PremiumGate 
                starredCount={starredCount}
                onUnlock={handlePremiumUnlock}
                householdId={household?.id}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;