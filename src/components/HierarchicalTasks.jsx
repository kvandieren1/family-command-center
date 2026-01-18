import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

/**
 * HierarchicalTasks Component
 * Displays master items from households table with nested action_items
 * Structure: Master Event (households) -> Sub-task (action_items) -> Nested Sub-task (action_items)
 */
export default function HierarchicalTasks({ householdId }) {
  const [masterItems, setMasterItems] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!householdId) return;

    const fetchHierarchicalData = async () => {
      try {
        setIsLoading(true);

        // Fetch master items - check if households table has been extended with event fields
        // If not, use calendar_events as master items
        let masterEvents = [];
        
        // Try to fetch from households first (if extended with title, burden_score, etc.)
        try {
          const { data: householdsData, error: householdsError } = await supabase
            .from('households')
            .select('*')
            .eq('id', householdId)
            .single();

          // Check if household record has event-like fields (title, burden_score)
          if (!householdsError && householdsData && (householdsData.title || householdsData.burden_score)) {
            // Households table has been extended - use it as master
            masterEvents = [householdsData];
          }
        } catch (err) {
          // Households table doesn't have event fields - that's okay
        }

        // If no master events from households, try calendar_events
        if (masterEvents.length === 0) {
          const { data: eventsData, error: eventsError } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('household_id', householdId)
            .order('start_time', { ascending: true });

          if (eventsError) {
            console.error('Error fetching calendar_events:', eventsError);
          } else {
            masterEvents = eventsData || [];
          }
        }

        // Fetch all action_items for this household (including parent_id for nesting)
        const { data: tasksData, error: tasksError } = await supabase
          .from('action_items')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: true });

        if (tasksError) {
          console.error('Error fetching action_items:', tasksError);
        }

        // Build hierarchy: Match action_items to master events by title or parent_id
        const tasks = tasksData || [];

        // Group tasks by parent_id (for nested tasks) or by matching to master events
        const taskMap = new Map(); // Maps parent_id -> [child tasks]
        const rootTasks = []; // Tasks without parent_id that don't match events

        tasks.forEach(task => {
          // Check if task has parent_id (for nested tasks like "Buy Chocolate" under "Get Goody Bags")
          if (task.parent_id) {
            if (!taskMap.has(task.parent_id)) {
              taskMap.set(task.parent_id, []);
            }
            taskMap.get(task.parent_id).push(task);
          } else {
            // Root-level task - try to match to a master event
            const matchingEvent = masterEvents.find(e => {
              const eventTitle = (e.title || '').toLowerCase();
              const taskTitle = (task.title || '').toLowerCase();
              return eventTitle && taskTitle && 
                (eventTitle.includes(taskTitle) || taskTitle.includes(eventTitle));
            });
            
            if (matchingEvent) {
              // Link task to master event
              const eventKey = `event_${matchingEvent.id}`;
              if (!taskMap.has(eventKey)) {
                taskMap.set(eventKey, []);
              }
              taskMap.get(eventKey).push(task);
            } else {
              // Standalone root task (not linked to any master event)
              rootTasks.push(task);
            }
          }
        });

        // Recursively build nested task structure
        const buildNestedTasks = (parentId) => {
          const children = taskMap.get(parentId) || [];
          return children.map(child => ({
            ...child,
            subTasks: buildNestedTasks(child.id) // Recursively get nested tasks
          }));
        };

        // Build master items structure
        const masters = masterEvents.map(event => {
          const eventKey = `event_${event.id}`;
          const directSubTasks = taskMap.get(eventKey) || [];
          
          return {
            id: eventKey,
            type: 'master',
            title: event.title || event.name || 'Untitled Event',
            description: event.description,
            startTime: event.start_time,
            endTime: event.end_time,
            burdenScore: event.burden_score || 0,
            assignedTo: event.assigned_to || null,
            subTasks: directSubTasks.map(task => ({
              ...task,
              subTasks: buildNestedTasks(task.id) // Get nested tasks for each sub-task
            }))
          };
        });

        // Add standalone root tasks as masters (if any)
        rootTasks.forEach(task => {
          masters.push({
            id: `task_${task.id}`,
            type: 'task',
            title: task.title,
            description: task.description,
            dueDate: task.due_date,
            burdenScore: task.burden_score || 0,
            assignedTo: task.assigned_to || null,
            subTasks: buildNestedTasks(task.id) // Get nested tasks
          });
        });

        setMasterItems(masters);
        setActionItems(tasks);
      } catch (err) {
        console.error('Error fetching hierarchical data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHierarchicalData();

    // Set up real-time subscription for instant updates
    const channel = supabase
      .channel(`hierarchical-tasks-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'action_items',
          filter: `household_id=eq.${householdId}`
        },
        () => {
          // Re-fetch on any change
          fetchHierarchicalData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `household_id=eq.${householdId}`
        },
        () => {
          // Re-fetch on any change
          fetchHierarchicalData();
        }
      )
      .subscribe();

    // Refresh every 5 minutes as backup
    const interval = setInterval(fetchHierarchicalData, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
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

  const getBurdenColor = (score) => {
    if (score >= 3) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (score >= 2) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  const getAssignedColor = (assignedTo) => {
    if (assignedTo === 'Pilot') return 'text-teal-400';
    if (assignedTo === 'Co-Pilot') return 'text-indigo-400';
    return 'text-slate-400';
  };

  const renderSubTask = (subTask, level = 1) => {
    const isExpanded = expandedItems.has(`subtask_${subTask.id}`);
    const hasNested = actionItems.some(t => t.parent_id === subTask.id);

    return (
      <motion.div
        key={subTask.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`ml-${level * 4} border-l-2 border-slate-700/50 pl-3 py-2`}
      >
        <div
          className="flex items-center gap-2 cursor-pointer active:bg-slate-800/30 rounded-lg p-2 -ml-2"
          onClick={() => hasNested && toggleExpand(`subtask_${subTask.id}`)}
        >
          {hasNested && (
            <span className="text-slate-500 text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded border ${getBurdenColor(subTask.burden_score || 0)}`}>
            {subTask.burden_score === 3 ? 'High' : subTask.burden_score === 2 ? 'Medium' : 'Low'}
          </span>
          <span className={`text-sm font-medium ${getAssignedColor(subTask.assigned_to)}`}>
            {subTask.assigned_to || 'Unassigned'}
          </span>
          <span className="text-sm text-slate-300 flex-1">{subTask.title}</span>
        </div>
        <AnimatePresence>
          {isExpanded && hasNested && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {actionItems
                .filter(t => t.parent_id === subTask.id)
                .map(nested => renderSubTask(nested, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-slate-400">
        Loading hierarchical tasks...
      </div>
    );
  }

  if (masterItems.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-slate-400 mb-4">Welcome to your Master Schedule</div>
        <p className="text-sm text-slate-500 mb-6">No events or tasks yet. Start by adding your first master item.</p>
        <button
          onClick={() => {
            // Trigger add task modal or navigate to add event
            window.dispatchEvent(new CustomEvent('openAddTaskModal'));
          }}
          className="px-6 py-3 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-xl active:bg-teal-500/30 transition-all font-medium"
        >
          + Add Master Item
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {masterItems.map((master) => {
        const isExpanded = expandedItems.has(master.id);
        const hasSubTasks = master.subTasks && master.subTasks.length > 0;

        return (
          <motion.div
            key={master.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
          >
            {/* Master Item Header */}
            <div
              className="flex items-center gap-3 cursor-pointer active:bg-slate-800/50 rounded-lg p-2 -m-2"
              onClick={() => hasSubTasks && toggleExpand(master.id)}
            >
              {hasSubTasks && (
                <span className="text-slate-400 text-sm font-bold">
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              <div className={`text-xs px-2 py-1 rounded border font-semibold ${getBurdenColor(master.burdenScore)}`}>
                {master.burdenScore === 3 ? 'High' : master.burdenScore === 2 ? 'Medium' : 'Low'}
              </div>
              <span className={`text-sm font-semibold ${getAssignedColor(master.assignedTo)}`}>
                {master.assignedTo || 'Unassigned'}
              </span>
              <h3 className="text-base font-semibold text-white flex-1">{master.title}</h3>
              {master.startTime && (
                <span className="text-xs text-slate-400">
                  {new Date(master.startTime).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Sub-tasks */}
            <AnimatePresence>
              {isExpanded && hasSubTasks && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-slate-700/50"
                >
                  {master.subTasks.map(subTask => renderSubTask(subTask, 1))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
