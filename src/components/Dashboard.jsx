import React, { useState, useEffect, useRef } from 'react';
import { getHouseholdData } from '../lib/householdStorage';
import { supabase } from '../lib/supabase';
import HeaderMeters from './HeaderMeters';
import MasterEventsAndActions from './MasterEventsAndActions';
import CommandBar from './CommandBar';
import AddTaskModal from './AddTaskModal';
import EventReviewer from './EventReviewer';
import IntroOverlay from './IntroOverlay';

export default function Dashboard() {
  const [household, setHousehold] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [showGCalImport, setShowGCalImport] = useState(false);
  const isMountedRef = useRef(true);

  // Check for active session - protect Dashboard
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // No session - redirect to login
          window.location.href = '/';
          return;
        }
        setHasSession(true);
      } catch (err) {
        console.error('Error checking session:', err);
        window.location.href = '/';
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window === 'undefined') return;
    if (!hasSession) return; // Don't proceed if no session

    // Mark component as mounted
    isMountedRef.current = true;

    // 1. Check if intro has played this session
    try {
      const hasPlayed = sessionStorage.getItem('introPlayed');
      if (!hasPlayed) {
        setShowIntro(true);
        // Don't set it here - let IntroOverlay set it when it mounts
      }
    } catch (e) {
      console.warn('Could not access sessionStorage:', e);
      // If sessionStorage fails, show intro anyway (better UX)
      setShowIntro(true);
    }

    // Load household data from localStorage if available
    const storedHousehold = getHouseholdData();
    if (storedHousehold) {
      setHousehold(storedHousehold);
    }

    // Try to get household ID from user session
    const fetchHouseholdId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Check if component is still mounted before proceeding
        if (!isMountedRef.current) return;
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('household_id, household:households(*)')
            .eq('user_id', session.user.id)
            .single();
          
          // Check again after async operation
          if (!isMountedRef.current) return;
          
          if (profile?.household_id) {
            // Update household with full data from database (not mock data)
            setHousehold({
              id: profile.household_id,
              ...(profile.household || {})
            });
          }
        }
      } catch (err) {
        // Only log if component is still mounted
        if (isMountedRef.current) {
          console.warn('Could not fetch household ID:', err);
        }
      }
    };

    fetchHouseholdId();

    // Cleanup: Mark component as unmounted
    return () => {
      isMountedRef.current = false;
    };
  }, [hasSession]);


  // Don't render if no session
  if (!hasSession) {
    return null;
  }

  const handleToggle = (modal) => {
    setActiveModal(modal);
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-32 safe-area-inset-bottom">
      {/* Splash Screen */}
      {showIntro && (
        <IntroOverlay 
          onComplete={() => {
            setShowIntro(false);
          }} 
        />
      )}

      {/* Top Header Meters - 3 Column Grid */}
      <HeaderMeters householdId={household?.id} />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-b border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3">
          <h2 className="text-sm sm:text-base font-medium text-slate-200 tracking-wide">
            Welcome to your Household Command Center!
          </h2>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold text-white mb-1">
                {household?.name || 'Van Dieren'} Family Command Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                The Cockpit: {household?.heads?.map(h => typeof h === 'string' ? h : h.name).join(' & ') || 'Not set'} • 
                {household?.support?.length > 0 && `Support: ${household.support.map(s => typeof s === 'string' ? s : s.name).join(', ')} • `}
                Dependents: {household?.dependents?.map(d => typeof d === 'string' ? d : d.name || d).join(', ') || 'None'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[10px] sm:text-xs text-slate-500 mb-1">System Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] sm:text-xs text-slate-400">Synced with Notion</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - SIMPLIFIED */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Optional GCal Import Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowGCalImport(true)}
            className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-xl active:bg-blue-500/30 transition-all font-medium text-sm"
          >
            📅 Import from Google Calendar
          </button>
        </div>

        {/* Master Events & Action Items - Unified View */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Master Events & Action Items</h2>
          <MasterEventsAndActions householdId={household?.id} />
        </div>
      </main>

      {/* Optional GCal Import Modal */}
      {showGCalImport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Import from Google Calendar</h3>
            <EventReviewer 
              householdId={household?.id}
              onStarredCountChange={() => {}}
              onComplete={() => {
                setShowGCalImport(false);
                // Refresh the page to show new events
                window.location.reload();
              }}
            />
            <button
              onClick={() => setShowGCalImport(false)}
              className="mt-4 w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl active:bg-slate-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Command Bar */}
      <CommandBar onToggle={handleToggle} activeModal={activeModal} activeView="dashboard" />

      {/* Modals */}
      {activeModal === 'addTask' && (
        <AddTaskModal onClose={() => handleToggle(null, 'dashboard')} />
      )}
    </div>
  );
}