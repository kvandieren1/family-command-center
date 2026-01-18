import React from 'react';
import { MOCK_DATA } from '../lib/mockData';

export default function CognitiveLoadChart() {
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

  const calculateWeekStats = (days) => {
    // Filter tasks that match any day in the week
    const weekTasks = MOCK_DATA.tasks.filter(t => {
      if (!t.dueDate) return false;
      // Direct string comparison - tasks have dates like "2026-01-15"
      return days.includes(t.dueDate);
    });
    
    // Count by owner name (not initials) - tasks have owner: "Amy" or "Kyle"
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
    <div className="flex-1 flex flex-col items-center h-full group px-4">
      <div className="relative w-full h-[180px] bg-zinc-900/30 rounded-sm overflow-hidden flex flex-col-reverse border border-zinc-800">
        {stats.total > 0 ? (
          <>
            {/* Amy's Segment (Teal) - bottom */}
            <div 
              className="w-full bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.4)] transition-all duration-700" 
              style={{ height: `${stats.amyPct}%` }}
              title={`Amy: ${stats.amyCount} tasks (${stats.amyPct.toFixed(1)}%)`}
            />
            {/* Kyle's Segment (Indigo) - top */}
            <div 
              className="w-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all duration-700" 
              style={{ height: `${stats.kylePct}%` }}
              title={`Kyle: ${stats.kyleCount} tasks (${stats.kylePct.toFixed(1)}%)`}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[8px] text-zinc-800 uppercase italic">No Data</div>
        )}
      </div>
      <span className="text-[10px] font-bold text-zinc-500 mt-3 tracking-tighter uppercase">{label}</span>
      <span className="text-[8px] text-zinc-700 uppercase mt-1">{stats.total} Total Tasks</span>
    </div>
  );

  return (
    <div className="border border-zinc-800 bg-zinc-950/50 p-4 font-mono h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xs text-zinc-400 font-bold uppercase tracking-widest underline">Weekly_Balance_Report</h2>
        <p className="text-[9px] text-zinc-600 mt-1">100% Stacked Proportion: Amy vs Kyle</p>
      </div>
      
      <div className="flex-1 flex items-end justify-around gap-4 pb-4">
        <WeeklyBar stats={w1} label="CURRENT_WEEK" />
        <WeeklyBar stats={w2} label="NEXT_WEEK" />
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-center gap-6 text-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-teal-500 rounded-full" /> <span className="text-zinc-400">AMY</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-600 rounded-full" /> <span className="text-zinc-400">KYLE</span>
        </div>
      </div>
    </div>
  );
}
