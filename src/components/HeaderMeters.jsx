import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Vacation Meter Component
function VacationMeter({ daysUntilVacation, vacationName }) {
  // Show empty state if no vacation data
  if (daysUntilVacation === null || !vacationName) {
    return (
      <div className="relative p-4 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
        <div className="flex flex-col items-center gap-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Vacation</div>
          <div className="text-sm text-slate-500 text-center">No vacation planned</div>
          <button className="text-xs text-teal-400 active:text-teal-300 mt-1">+ Add</button>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-xl pointer-events-none"></div>
      </div>
    );
  }
  
  return (
    <div className="relative p-4 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
      <div className="flex flex-col items-center gap-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Vacation</div>
        <div className="text-2xl font-bold text-emerald-400">{daysUntilVacation}</div>
        <div className="text-xs text-slate-300 text-center">{vacationName}</div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-xl pointer-events-none"></div>
    </div>
  );
}

// Date Night Countdown Component
function DateNightMeter({ householdId }) {
  const [daysUntil, setDaysUntil] = useState(null);
  const [eventTitle, setEventTitle] = useState('');

  useEffect(() => {
    if (!householdId) return;

    const fetchDateNight = async () => {
      try {
        // Fetch events from calendar_events table
        // Look for events with "Date Night" in title or description
        const { data: events, error } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('household_id', householdId)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(50);

        if (error) {
          console.error('Error fetching date night events:', error);
          return;
        }

        // Find the next "Date Night" event
        const dateNightEvent = events?.find(event => {
          const title = (event.title || '').toLowerCase();
          const description = (event.description || '').toLowerCase();
          return title.includes('date night') || 
                 title.includes('date') && (title.includes('night') || description.includes('date night'));
        });

        if (dateNightEvent) {
          const eventDate = new Date(dateNightEvent.start_time);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0);
          
          const timeDiff = eventDate.getTime() - today.getTime();
          const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          
          setDaysUntil(days);
          setEventTitle(dateNightEvent.title || 'Date Night');
        } else {
          setDaysUntil(null);
        }
      } catch (err) {
        console.error('Error calculating date night countdown:', err);
      }
    };

    fetchDateNight();
    // Refresh every hour
    const interval = setInterval(fetchDateNight, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [householdId]);

  if (daysUntil === null) {
    return (
      <div className="relative p-4 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.1)]">
        <div className="flex flex-col items-center gap-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Date Night</div>
          <div className="text-2xl font-bold text-slate-500">—</div>
          <div className="text-xs text-slate-500 text-center">No event scheduled</div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent rounded-xl pointer-events-none"></div>
      </div>
    );
  }

  return (
    <div className="relative p-4 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.1)]">
      <div className="flex flex-col items-center gap-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Date Night</div>
        <div className="text-2xl font-bold text-violet-400">{daysUntil}</div>
        <div className="text-xs text-slate-300 text-center">{eventTitle}</div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent rounded-xl pointer-events-none"></div>
    </div>
  );
}

// Mental Load Radial Gauge Component - Separate Pilot/Co-Pilot Meters
function MentalLoadMeter({ householdId }) {
  const [pilotLoad, setPilotLoad] = useState(0);
  const [coPilotLoad, setCoPilotLoad] = useState(0);
  const [totalLoad, setTotalLoad] = useState(0);

  useEffect(() => {
    if (!householdId) return;

    const calculateMentalLoad = async () => {
      try {
        // Use recursive cognitive load calculator
        const { calculateTotalMentalLoad } = await import('../lib/cognitiveLoad');
        const result = await calculateTotalMentalLoad(householdId);
        
        // Multiply by 10 for impact (since max burden_score is 3)
        const pilotCalculated = result.pilot * 10;
        const coPilotCalculated = result.coPilot * 10;
        const totalCalculated = result.total * 10;

        setPilotLoad(pilotCalculated);
        setCoPilotLoad(coPilotCalculated);
        setTotalLoad(totalCalculated);
      } catch (err) {
        console.error('Error calculating mental load:', err);
      }
    };

    calculateMentalLoad();
    
    // Set up real-time subscription for action_items changes
    const channel = supabase
      .channel(`mental-load-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'action_items',
          filter: `household_id=eq.${householdId}`
        },
        () => {
          // Recalculate on any change
          calculateMentalLoad();
        }
      )
      .subscribe();

    // Refresh every 5 minutes as backup
    const interval = setInterval(calculateMentalLoad, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  const getColorForLoad = (loadValue) => {
    if (loadValue < 30) return { text: 'text-emerald-400', stroke: 'stroke-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]', bg: 'from-emerald-500/5' };
    if (loadValue <= 70) return { text: 'text-amber-400', stroke: 'stroke-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]', bg: 'from-amber-500/5' };
    return { text: 'text-red-400', stroke: 'stroke-red-400', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]', bg: 'from-red-500/5' };
  };

  const pilotColor = getColorForLoad(pilotLoad);
  const coPilotColor = getColorForLoad(coPilotLoad);
  const totalColor = getColorForLoad(totalLoad);

  const renderRadialGauge = (load, color, label, size = 16) => {
    const percentage = Math.min((load / 100) * 100, 100);
    const circumference = 2 * Math.PI * (size * 2.25); // radius based on size
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={`relative p-2 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-lg ${color.glow}`}>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
          <div className="relative" style={{ width: `${size * 4}px`, height: `${size * 4}px` }}>
            <svg className="transform -rotate-90" style={{ width: `${size * 4}px`, height: `${size * 4}px` }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800/30" />
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={color.stroke}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${color.text}`}>{load}</span>
            </div>
          </div>
        </div>
        <div className={`absolute inset-0 bg-gradient-to-br ${color.bg} to-transparent rounded-lg pointer-events-none`}></div>
      </div>
    );
  };

  return (
    <div className="relative p-3 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-xl">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 text-center">Mental Load</div>
      <div className="flex items-center justify-center gap-2">
        {renderRadialGauge(pilotLoad, pilotColor, 'Pilot', 14)}
        {renderRadialGauge(coPilotLoad, coPilotColor, 'Co-Pilot', 14)}
      </div>
      <div className="mt-2 text-center">
        <span className={`text-xs font-medium ${totalColor.text}`}>
          Total: {totalLoad}
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-transparent rounded-xl pointer-events-none"></div>
    </div>
  );
}

// Main Header Meters Component
export default function HeaderMeters({ householdId }) {
  return (
    <div className="bg-slate-900/80 border-b border-slate-800/50 px-4 py-3">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <VacationMeter 
            daysUntilVacation={null} 
            vacationName="" 
          />
          <DateNightMeter householdId={householdId} />
          <MentalLoadMeter householdId={householdId} />
        </div>
      </div>
    </div>
  );
}
