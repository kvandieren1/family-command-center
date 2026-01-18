import React from 'react';
import { parseISO, format, isPast, isToday } from 'date-fns';

export default function TaskSummary({ tasks = [] }) {
  // Get top 3 upcoming tasks (not completed, sorted by due date)
  const upcomingTasks = tasks
    .filter(task => {
      if (!task.dueDate) return false;
      const dueDate = parseISO(task.dueDate);
      return !isPast(dueDate) || isToday(dueDate);
    })
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
    })
    .slice(0, 3);

  const getOwnerColor = (owner) => {
    return owner === 'Amy' ? 'text-blue-400' : 'text-purple-400';
  };

  const getWeightGlow = (weight) => {
    if (weight === 'Heavy') {
      return 'shadow-[0_0_6px_rgba(239,68,68,0.3)]';
    }
    return '';
  };

  const getDependentColor = (dependent) => {
    if (dependent === 'Noah') return '#4a9eff';
    if (dependent === 'Leia') return '#ff6b9d';
    return '#94a3b8';
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-800/50 px-4 py-3">
        <h2 className="text-base font-semibold text-white">Upcoming Tasks</h2>
        <p className="text-[10px] text-slate-400 mt-0.5">Top 3 priorities</p>
      </div>

      {/* Task List */}
      <div className="divide-y divide-slate-800/50">
        {upcomingTasks.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No upcoming tasks
          </div>
        ) : (
          upcomingTasks.map((task, index) => (
            <div key={task.id} className="p-4 min-h-[44px] active:bg-slate-800/30 transition-colors touch-manipulation">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${getOwnerColor(task.owner)}`}>
                      {task.ownerInitials}
                    </span>
                    <h3 className={`text-sm font-medium text-white truncate ${getWeightGlow(task.cognitiveWeight)}`}>
                      {task.title}
                    </h3>
                  </div>
                  
                  {/* Dependents */}
                  {task.dependent && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: getDependentColor(task.dependent) }}
                      ></div>
                      <span className="text-[10px] text-slate-400">{task.dependent}</span>
                    </div>
                  )}

                  {/* Notes/CPE Phase */}
                  {task.cpePhase && (
                    <div className="text-[10px] text-slate-500 mt-1">
                      Phase: {task.cpePhase}
                    </div>
                  )}
                </div>

                {/* Due Date */}
                {task.dueDate && (
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-medium text-slate-300">
                      {format(parseISO(task.dueDate), 'MMM d')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {format(parseISO(task.dueDate), 'EEE')}
                    </div>
                  </div>
                )}
              </div>

              {/* Cognitive Weight Indicator */}
              <div className="flex items-center gap-2 mt-2">
                <div
                  className={`h-0.5 rounded-full ${
                    task.cognitiveWeight === 'Heavy'
                      ? 'bg-red-500'
                      : task.cognitiveWeight === 'Medium'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  } ${getWeightGlow(task.cognitiveWeight)}`}
                  style={{ width: '60px' }}
                ></div>
                <span className="text-[10px] text-slate-500">
                  {task.cognitiveWeight} Load
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
