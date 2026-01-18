import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function WeeklySummary({ householdId, household }) {
  const [eventCount, setEventCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [pilot1Tasks, setPilot1Tasks] = useState(0);
  const [pilot2Tasks, setPilot2Tasks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tintColor, setTintColor] = useState(null); // 'pilot1', 'pilot2', or null (neutral)

  useEffect(() => {
    if (!householdId) {
      setIsLoading(false);
      return;
    }

    const fetchWeeklyData = async () => {
      try {
        setIsLoading(true);

        // Calculate date range (next 7 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Fetch events from calendar_events table for next 7 days
        const { data: events, error: eventsError } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('household_id', householdId)
          .gte('start_time', today.toISOString())
          .lt('start_time', nextWeek.toISOString())
          .order('start_time', { ascending: true });

        if (eventsError) {
          console.error('Error fetching weekly events:', eventsError);
        } else {
          setEventCount(events?.length || 0);
        }

        // Fetch action_items (tasks) with due_date in next 7 days
        const { data: actionItems, error: actionItemsError } = await supabase
          .from('action_items')
          .select('*')
          .eq('household_id', householdId)
          .gte('due_date', today.toISOString().split('T')[0])
          .lt('due_date', nextWeek.toISOString().split('T')[0])
          .in('status', ['pending', 'in_progress']);

        if (actionItemsError) {
          console.error('Error fetching weekly action_items:', actionItemsError);
        }

        // Count total tasks from action_items only (for now)
        // If master items/events from households table need to be included, add them here
        const totalActionItems = actionItems?.length || 0;
        const totalTasks = totalActionItems;

        setTaskCount(totalTasks);

        // Get pilot names from household
        const pilots = household?.heads || [];
        const pilot1Name = pilots[0] ? (typeof pilots[0] === 'string' ? pilots[0] : pilots[0].name) : null;
        const pilot2Name = pilots[1] ? (typeof pilots[1] === 'string' ? pilots[1] : pilots[1].name) : null;

        if (totalTasks > 0 && pilot1Name && pilot2Name) {
          // Count tasks per pilot using assigned_to field
          // assigned_to should be 'Pilot' or 'Co-Pilot'
          let pilot1Count = 0;
          let pilot2Count = 0;

          // Count from action_items only (matching the totalTasks denominator)
          actionItems?.forEach(item => {
            const assignedTo = item.assigned_to || '';
            if (assignedTo === 'Pilot') {
              pilot1Count++;
            } else if (assignedTo === 'Co-Pilot') {
              pilot2Count++;
            }
          });

          setPilot1Tasks(pilot1Count);
          setPilot2Tasks(pilot2Count);

          // Determine color tint (>60% threshold)
          const pilot1Percentage = (pilot1Count / totalTasks) * 100;
          const pilot2Percentage = (pilot2Count / totalTasks) * 100;

          if (pilot1Percentage > 60) {
            setTintColor('pilot1');
          } else if (pilot2Percentage > 60) {
            setTintColor('pilot2');
          } else {
            setTintColor(null); // Neutral
          }
        } else {
          setTintColor(null);
        }
      } catch (err) {
        console.error('Error fetching weekly summary:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchWeeklyData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [householdId, household]);

  // Get pilot colors from household
  const pilots = household?.heads || [];
  const pilot1 = pilots[0] ? (typeof pilots[0] === 'string' ? { name: pilots[0] } : pilots[0]) : null;
  const pilot2 = pilots[1] ? (typeof pilots[1] === 'string' ? { name: pilots[1] } : pilots[1]) : null;

  // Get color codes - default to teal and indigo if not set
  const pilot1Color = pilot1?.color || '#14b8a6'; // Teal
  const pilot2Color = pilot2?.color || '#6366f1'; // Indigo

  // Determine card styling based on tint - Enhanced mobile polish
  let cardClasses = 'relative p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-xl shadow-lg';
  let glowClasses = '';
  let borderClasses = 'border-slate-700/30';

  if (tintColor === 'pilot1') {
    // Tint with pilot 1 color (teal)
    cardClasses += ' bg-gradient-to-br from-slate-900/40 to-slate-900/60';
    glowClasses = `shadow-[0_0_30px_rgba(20,184,166,0.2)]`;
    borderClasses = 'border-teal-500/30';
  } else if (tintColor === 'pilot2') {
    // Tint with pilot 2 color (indigo)
    cardClasses += ' bg-gradient-to-br from-slate-900/40 to-slate-900/60';
    glowClasses = `shadow-[0_0_30px_rgba(99,102,241,0.2)]`;
    borderClasses = 'border-indigo-500/30';
  }

  return (
    <div className={`${cardClasses} ${glowClasses} ${borderClasses} min-h-[50vh] flex flex-col justify-center`}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-slate-400 text-sm">Loading weekly summary...</div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">1-Week Summary</h2>
            <p className="text-xs text-slate-400">Next 7 days</p>
          </div>

          {/* Summary Card */}
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                {eventCount} Events | {taskCount} Tasks
              </div>
              <div className="text-xs text-slate-400">
                {taskCount > 0 && (
                  <>
                    {pilot1?.name || 'Pilot 1'}: {pilot1Tasks} • {pilot2?.name || 'Pilot 2'}: {pilot2Tasks}
                  </>
                )}
              </div>
            </div>

            {/* Task Distribution Indicator */}
            {taskCount > 0 && tintColor && (
              <div className="w-full max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex-1 h-2 rounded-full ${
                    tintColor === 'pilot1' ? 'bg-teal-500/30' : 'bg-slate-700/30'
                  }`}>
                    <div 
                      className={`h-full rounded-full ${
                        tintColor === 'pilot1' ? 'bg-teal-500' : 'bg-slate-600'
                      }`}
                      style={{ width: `${(pilot1Tasks / taskCount) * 100}%` }}
                    ></div>
                  </div>
                  <div className={`flex-1 h-2 rounded-full ${
                    tintColor === 'pilot2' ? 'bg-indigo-500/30' : 'bg-slate-700/30'
                  }`}>
                    <div 
                      className={`h-full rounded-full ${
                        tintColor === 'pilot2' ? 'bg-indigo-500' : 'bg-slate-600'
                      }`}
                      style={{ width: `${(pilot2Tasks / taskCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-center text-slate-400">
                  {tintColor === 'pilot1' && `${pilot1?.name || 'Pilot 1'} has ${Math.round((pilot1Tasks / taskCount) * 100)}% of tasks`}
                  {tintColor === 'pilot2' && `${pilot2?.name || 'Pilot 2'} has ${Math.round((pilot2Tasks / taskCount) * 100)}% of tasks`}
                </div>
              </div>
            )}
          </div>

          {/* Subtle gradient overlay based on tint */}
          {tintColor && (
            <div 
              className="absolute inset-0 bg-gradient-to-br opacity-10 rounded-xl pointer-events-none"
              style={{
                background: tintColor === 'pilot1' 
                  ? `linear-gradient(135deg, ${pilot1Color} 0%, transparent 50%)`
                  : `linear-gradient(135deg, ${pilot2Color} 0%, transparent 50%)`
              }}
            ></div>
          )}
        </>
      )}
    </div>
  );
}
