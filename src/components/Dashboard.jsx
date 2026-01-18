import React, { useState, useEffect, useRef } from 'react';
import { MOCK_DATA } from '../lib/mockData';
import { getHouseholdData } from '../lib/householdStorage';
import { supabase } from '../lib/supabase';
import HeaderMeters from './HeaderMeters';
import CalendarView from './CalendarView';
import CognitiveLoadChart from './CognitiveLoadChart';
import DeliveryStats from './DeliveryStats';
import GoalsTable from './GoalsTable';
import TaskSummary from './TaskSummary';
import CommandBar from './CommandBar';
import AddTaskModal from './AddTaskModal';
import AddGoalModal from './AddGoalModal';
import SundaySyncModal from './SundaySyncModal';
import IntroOverlay from './IntroOverlay';

export default function Dashboard() {
  const [household, setHousehold] = useState(MOCK_DATA.household);
  const [activeModal, setActiveModal] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [showIntro, setShowIntro] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window === 'undefined') return;

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
            // Update household with ID if we have it
            setHousehold(prev => ({
              ...prev,
              id: profile.household_id,
              ...(profile.household || {})
            }));
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
  }, []);

  const handleToggle = (modal, view) => {
    setActiveModal(modal);
    if (view) {
      setActiveView(view);
    }
  };

  // Render Sunday Sync view
  if (activeView === 'sundaySync') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-32 safe-area-inset-bottom">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">Sunday Sync</h1>
            <p className="text-xs sm:text-sm text-slate-400">Record and process your weekly sync session</p>
          </div>
          <SundaySyncModal onClose={() => handleToggle(null, 'dashboard')} isFullScreen={true} />
        </div>
        <CommandBar onToggle={handleToggle} activeModal={activeModal} activeView={activeView} />
      </div>
    );
  }

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

      {/* Main Content - Mobile-First Vertical Stack */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4">
          {/* 1. Weekly Balance Chart - First on mobile */}
          <div className="order-1 lg:col-span-3">
            <CognitiveLoadChart />
          </div>

          {/* 2. 14-Day Calendar - Second on mobile */}
          <div className="order-2 lg:col-span-6 lg:row-span-2">
            <CalendarView tasks={MOCK_DATA.tasks} />
          </div>

          {/* 3. 2026 Goals - Third on mobile */}
          <div className="order-3 lg:col-span-3">
            <GoalsTable goals={MOCK_DATA.goals2026} />
          </div>

          {/* 4. Delivery Stats - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block lg:col-span-3">
            <DeliveryStats tasks={MOCK_DATA.tasks} />
          </div>

          {/* 5. Upcoming Tasks - Fourth on mobile */}
          <div className="order-4 lg:col-span-3">
            <TaskSummary tasks={MOCK_DATA.tasks} />
          </div>
        </div>
      </main>

      {/* Fixed Bottom Command Bar */}
      <CommandBar onToggle={handleToggle} activeModal={activeModal} activeView={activeView} />

      {/* Modals */}
      {activeModal === 'addTask' && (
        <AddTaskModal onClose={() => handleToggle(null, 'dashboard')} />
      )}
      {activeModal === 'addGoal' && (
        <AddGoalModal onClose={() => handleToggle(null, 'dashboard')} />
      )}
      {activeModal === 'sundaySync' && activeView !== 'sundaySync' && (
        <SundaySyncModal onClose={() => handleToggle(null, 'dashboard')} />
      )}
    </div>
  );
}