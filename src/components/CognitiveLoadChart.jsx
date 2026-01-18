import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function CognitiveLoadChart({ householdId }) {
  const [tasks, setTasks] = useState([]);
  // Use current date instead of hardcoded date for dynamic week calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  // Calculate start of current week (Sunday)
  const currentWeekStart = new Date(today);
  const dayOfWeek = currentWeekStart.getDay();
  currentWeekStart.setDate(currentWeekStart.getDate() - dayOfWeek);
  
  // Define the two-week windows (current week and next week)
  const week1Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const week2Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7 + i); // Next week
    return d.toISOString().split('T')[0];
  });

  // Fetch tasks from action_items when householdId is available
  useEffect(() => {
    if (!householdId) return;

    const fetchTasks = async () => {
      try {
        const { data: actionItems, error } = await supabase
          .from('action_items')
          .select('*')
          .eq('household_id', householdId)
          .order('due_date', { ascending: true, nullsLast: true });

        if (error) {
          console.error('Error fetching action_items for CognitiveLoadChart:', error);
          return;
        }

        // Transform to match expected format
        const transformedTasks = (actionItems || []).map(item => ({
          id: item.id,
          dueDate: item.due_date,
          owner: item.assigned_to === 'Pilot' ? 'Amy' : item.assigned_to === 'Co-Pilot' ? 'Kyle' : 'Unknown'
        }));

        setTasks(transformedTasks);
      } catch (err) {
        console.error('Error in fetchTasks (CognitiveLoadChart):', err);
      }
    };

    fetchTasks();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTasks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [householdId]);

  const calculateWeekStats = (days) => {
    // Filter tasks that match any day in the week
    const weekTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      // Format due_date to match day strings (YYYY-MM-DD)
      const dateStr = typeof t.dueDate === 'string' ? t.dueDate.split('T')[0] : t.dueDate;
      return days.includes(dateStr);
    });
    
    // Count by owner name - tasks have owner: "Amy" or "Kyle"
    const amyCount = weekTasks.filter(t => t.owner === 'Amy').length;
    const kyleCount = weekTasks.filter(t => t.owner === 'Kyle').length;
    const total = amyCount + kyleCount;
    
    return {
      amyPct: total > 0 ? (amyCount / total) * 100 : 0,
      kylePct: total > 0 ? (kyleCount / total) * 100 : 0,
      total,
      amyCount,
      kyleCount
    };
  };

  const w1 = calculateWeekStats(week1Days);
  const w2 = calculateWeekStats(week2Days);

  const WeeklyBar = ({ stats, label }) => (
    <div className="flex-1 flex flex-col items-center h-full group px-2 sm:px-4">
      <div className="relative w-full h-[180px] sm:h-[200px] bg-slate-800/40 rounded-lg overflow-hidden flex flex-col-reverse border border-slate-700/50 shadow-inner">
        {stats.total > 0 ? (
          <>
            {/* Pilot 1 Segment (Teal) - bottom */}
            <div 
              className="w-full bg-gradient-to-t from-teal-500 to-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)] transition-all duration-700 hover:shadow-[0_0_20px_rgba(20,184,166,0.7)]" 
              style={{ height: `${stats.amyPct}%` }}
              title={`Pilot 1: ${stats.amyCount} tasks (${stats.amyPct.toFixed(1)}%)`}
            />
            {/* Co-Pilot Segment (Indigo) - top */}
            <div 
              className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-700 hover:shadow-[0_0_20px_rgba(99,102,241,0.7)]" 
              style={{ height: `${stats.kylePct}%` }}
              title={`Co-Pilot: ${stats.kyleCount} tasks (${stats.kylePct.toFixed(1)}%)`}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[8px] text-slate-600 uppercase italic">No Data</div>
        )}
      </div>
      <span className="text-[10px] sm:text-xs font-bold text-slate-400 mt-3 tracking-tighter uppercase">{label}</span>
      <span className="text-[8px] text-slate-600 uppercase mt-1">{stats.total} Tasks</span>
    </div>
  );

  return (
    <div className="border border-slate-700/50 bg-slate-900/40 backdrop-blur-md rounded-xl shadow-lg p-4 sm:p-6 font-mono h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xs sm:text-sm text-slate-300 font-bold uppercase tracking-widest">Weekly Balance</h2>
        <p className="text-[9px] text-slate-500 mt-1">Pilot vs Co-Pilot Distribution</p>
      </div>
      
      <div className="flex-1 flex items-end justify-around gap-3 sm:gap-4 pb-4">
        <WeeklyBar stats={w1} label="CURRENT_WEEK" />
        <WeeklyBar stats={w2} label="NEXT_WEEK" />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-center gap-6 text-[10px] sm:text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.4)]" /> 
          <span className="text-slate-400 font-semibold">PILOT 1</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]" /> 
          <span className="text-slate-400 font-semibold">CO-PILOT</span>
        </div>
      </div>
    </div>
  );
}
