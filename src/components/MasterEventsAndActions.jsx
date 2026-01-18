import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

/**
 * Unified Master Events & Action Items Component
 * Shows events and tasks in one simple list
 * - Events can be standalone or have related tasks
 * - Tasks can be standalone or related to events
 * - Starred indicates if someone has tasks for an event
 */
export default function MasterEventsAndActions({ householdId }) {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!householdId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch events from calendar_events
        const { data: eventsData, error: eventsError } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('household_id', householdId)
          .order('start_time', { ascending: true });

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
        } else {
          setEvents(eventsData || []);
        }

        // Fetch tasks from action_items
        const { data: tasksData, error: tasksError } = await supabase
          .from('action_items')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: true });

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
        } else {
          setTasks(tasksData || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Real-time updates
    const channel = supabase
      .channel(`master-events-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `household_id=eq.${householdId}`
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'action_items',
          filter: `household_id=eq.${householdId}`
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  const toggleExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Get tasks related to an event
  const getTasksForEvent = (eventId) => {
    return tasks.filter(t => t.related_event_id === eventId);
  };

  // Get standalone tasks (not related to any event)
  const getStandaloneTasks = () => {
    return tasks.filter(t => !t.related_event_id && !t.parent_id);
  };

  // Get subtasks for a task
  const getSubtasks = (taskId) => {
    return tasks.filter(t => t.parent_id === taskId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getBurdenColor = (score) => {
    if (score === 3) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (score === 2) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-slate-400">
        Loading events and tasks...
      </div>
    );
  }

  const allItems = events.length + tasks.length;

  return (
    <div className="space-y-3">
      {/* Events with related tasks */}
      {events.map((event) => {
        const relatedTasks = getTasksForEvent(event.id);
        const hasTasks = relatedTasks.length > 0;
        const isExpanded = expandedItems.has(`event-${event.id}`);

        return (
          <motion.div
            key={`event-${event.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
          >
            {/* Event Header */}
            <div
              className="flex items-center gap-3 cursor-pointer active:bg-slate-800/50 rounded-lg p-2 -m-2"
              onClick={() => hasTasks && toggleExpand(`event-${event.id}`)}
            >
              {hasTasks && (
                <span className="text-slate-400 text-sm font-bold">
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              {event.starred && (
                <span className="text-yellow-400 text-sm">⭐</span>
              )}
              <div className={`text-xs px-2 py-1 rounded border font-semibold ${getBurdenColor(event.burden_score || 0)}`}>
                {event.burden_score === 3 ? 'High' : event.burden_score === 2 ? 'Medium' : 'Low'}
              </div>
              <h3 className="text-base font-semibold text-white flex-1">{event.title}</h3>
              <span className="text-xs text-slate-400">
                {formatDate(event.start_time)}
              </span>
            </div>

            {/* Related Tasks */}
            <AnimatePresence>
              {isExpanded && hasTasks && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-slate-700/50 space-y-2"
                >
                  {relatedTasks.map((task) => {
                    const subtasks = getSubtasks(task.id);
                    const isTaskExpanded = expandedItems.has(`task-${task.id}`);

                    return (
                      <div key={task.id} className="ml-4 border-l-2 border-slate-700/50 pl-3">
                        <div
                          className="flex items-center gap-2 cursor-pointer active:bg-slate-800/30 rounded-lg p-2 -ml-2"
                          onClick={() => subtasks.length > 0 && toggleExpand(`task-${task.id}`)}
                        >
                          {subtasks.length > 0 && (
                            <span className="text-slate-500 text-xs">
                              {isTaskExpanded ? '▼' : '▶'}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded border ${getBurdenColor(task.burden_score || 0)}`}>
                            {task.burden_score === 3 ? 'High' : task.burden_score === 2 ? 'Medium' : 'Low'}
                          </span>
                          <span className="text-sm text-slate-300 flex-1">{task.title}</span>
                          <span className="text-xs text-slate-500">{task.assigned_to || 'Unassigned'}</span>
                        </div>
                        {/* Subtasks */}
                        <AnimatePresence>
                          {isTaskExpanded && subtasks.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="ml-4 mt-2 space-y-1"
                            >
                              {subtasks.map((subtask) => (
                                <div key={subtask.id} className="text-xs text-slate-400 pl-4 border-l border-slate-700/30">
                                  {subtask.title} ({subtask.assigned_to || 'Unassigned'})
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Standalone Tasks */}
      {getStandaloneTasks().map((task) => {
        const subtasks = getSubtasks(task.id);
        const isExpanded = expandedItems.has(`task-${task.id}`);

        return (
          <motion.div
            key={`task-${task.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
          >
            <div
              className="flex items-center gap-3 cursor-pointer active:bg-slate-800/50 rounded-lg p-2 -m-2"
              onClick={() => subtasks.length > 0 && toggleExpand(`task-${task.id}`)}
            >
              {subtasks.length > 0 && (
                <span className="text-slate-400 text-sm font-bold">
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              <div className={`text-xs px-2 py-1 rounded border font-semibold ${getBurdenColor(task.burden_score || 0)}`}>
                {task.burden_score === 3 ? 'High' : task.burden_score === 2 ? 'Medium' : 'Low'}
              </div>
              <h3 className="text-base font-semibold text-white flex-1">{task.title}</h3>
              <span className="text-xs text-slate-400">{task.assigned_to || 'Unassigned'}</span>
              {task.due_date && (
                <span className="text-xs text-slate-500">{formatDate(task.due_date)}</span>
              )}
            </div>

            {/* Subtasks */}
            <AnimatePresence>
              {isExpanded && subtasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-slate-700/50 space-y-2"
                >
                  {subtasks.map((subtask) => (
                    <div key={subtask.id} className="ml-4 text-sm text-slate-300 border-l-2 border-slate-700/50 pl-3">
                      {subtask.title} ({subtask.assigned_to || 'Unassigned'})
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Empty State */}
      {allItems === 0 && (
        <div className="p-6 text-center">
          <div className="text-slate-400 mb-4">No events or tasks yet</div>
          <p className="text-sm text-slate-500 mb-6">Start by creating your first event or task</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openAddEventModal'))}
              className="px-4 py-2 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-xl active:bg-teal-500/30 transition-all font-medium text-sm"
            >
              + Add Event
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openAddTaskModal'))}
              className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 rounded-xl active:bg-indigo-500/30 transition-all font-medium text-sm"
            >
              + Add Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
