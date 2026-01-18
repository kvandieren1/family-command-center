import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { daysUntilVacation } from '../lib/mockData';
import { MOCK_DATA } from '../lib/mockData';

// Vacation Meter Component
function VacationMeter({ daysUntilVacation, vacationName }) {
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

// Mental Load Radial Gauge Component
function MentalLoadMeter({ householdId }) {
  const [load, setLoad] = useState(0);
  const [color, setColor] = useState('emerald');

  useEffect(() => {
    if (!householdId) return;

    const calculateMentalLoad = async () => {
      try {
        // Fetch all active action_items (tasks) - pending or in_progress
        const { data: actionItemsData, error: actionItemsError } = await supabase
          .from('action_items')
          .select('burden_score, status, assigned_to')
          .eq('household_id', householdId)
          .in('status', ['pending', 'in_progress']);

        // Ensure actionItems is always an array (fallback to empty array on error or undefined)
        let actionItems = [];
        if (actionItemsError) {
          console.error('Error fetching action_items for mental load:', actionItemsError);
        } else if (Array.isArray(actionItemsData)) {
          actionItems = actionItemsData;
        }

        // Fetch master items from households table (if they have burden_score)
        // Note: Assuming households table has been extended with burden_score and assigned_to
        // If not, we'll also check calendar_events for master events
        let householdsBurden = 0;
        try {
          const { data: householdData, error: householdError } = await supabase
            .from('households')
            .select('burden_score, assigned_to')
            .eq('id', householdId)
            .single();

          if (!householdError && householdData?.burden_score) {
            householdsBurden = householdData.burden_score || 0;
          }
        } catch (err) {
          // If households table doesn't have burden_score, try calendar_events
          const { data: eventsData, error: eventsError } = await supabase
            .from('calendar_events')
            .select('burden_score, assigned_to')
            .eq('household_id', householdId);

          if (!eventsError && eventsData) {
            householdsBurden = (eventsData || []).reduce((sum, event) => {
              return sum + (event.burden_score || 0);
            }, 0);
          }
        }

        // Sum burden_scores from action_items
        // burden_score is numeric: 1=Low, 2=Medium, 3=High
        const actionItemsBurden = (actionItems || []).reduce((sum, item) => {
          return sum + (item.burden_score || 0);
        }, 0);

        // Calculate total burden (sum of households/master events + action_items)
        const totalBurden = householdsBurden + actionItemsBurden;
        
        // Multiply by 10 to keep the meter impactful (since max is now 3 instead of 10)
        const calculatedLoad = totalBurden * 10;
        setLoad(calculatedLoad);

        // Set color based on load
        if (calculatedLoad < 30) {
          setColor('emerald');
        } else if (calculatedLoad <= 70) {
          setColor('amber');
        } else {
          setColor('red');
        }
      } catch (err) {
        console.error('Error calculating mental load:', err);
      }
    };

    calculateMentalLoad();
    // Refresh every 5 minutes
    const interval = setInterval(calculateMentalLoad, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [householdId]);

  const percentage = Math.min((load / 100) * 100, 100);
  const circumference = 2 * Math.PI * 36; // radius = 36
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    emerald: {
      text: 'text-emerald-400',
      stroke: 'stroke-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      bg: 'from-emerald-500/5'
    },
    amber: {
      text: 'text-amber-400',
      stroke: 'stroke-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      bg: 'from-amber-500/5'
    },
    red: {
      text: 'text-red-400',
      stroke: 'stroke-red-400',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
      bg: 'from-red-500/5'
    }
  };

  const currentColor = colorClasses[color];

  return (
    <div className={`relative p-4 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-xl ${currentColor.glow}`}>
      <div className="flex flex-col items-center gap-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Mental Load</div>
        <div className="relative w-20 h-20">
          <svg className="transform -rotate-90 w-20 h-20" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-800/30"
            />
            {/* Progress circle */}
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
              className={currentColor.stroke}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${currentColor.text}`}>{load}</span>
          </div>
        </div>
        <div className={`text-xs font-medium ${currentColor.text}`}>
          {color === 'emerald' ? 'Low' : color === 'amber' ? 'Moderate' : 'High'}
        </div>
      </div>
      <div className={`absolute inset-0 bg-gradient-to-br ${currentColor.bg} to-transparent rounded-xl pointer-events-none`}></div>
    </div>
  );
}

// Main Header Meters Component
export default function HeaderMeters({ householdId }) {
  return (
    <div className="bg-slate-900/80 border-b border-slate-800/50 px-4 py-3">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-3 gap-3">
          <VacationMeter 
            daysUntilVacation={daysUntilVacation()} 
            vacationName={MOCK_DATA.nextVacation.name} 
          />
          <DateNightMeter householdId={householdId} />
          <MentalLoadMeter householdId={householdId} />
        </div>
      </div>
    </div>
  );
}
