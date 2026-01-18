import React, { useState } from 'react';
import { format, parseISO, isPast, isToday } from 'date-fns';

export default function TaskManager({ tasks = [] }) {
  const [filter, setFilter] = useState('all'); // all, amy, kyle
  const [sortBy, setSortBy] = useState('dueDate'); // dueDate, weight, status

  const getWeightColor = (weight) => {
    switch (weight?.toLowerCase()) {
      case 'heavy': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status, dueDate) => {
    if (status === 'completed') {
      return <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Completed</span>;
    }
    if (dueDate && isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate))) {
      return <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30">Overdue</span>;
    }
    return <span className="px-2 py-0.5 text-xs rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">Pending</span>;
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.owner?.toLowerCase() === filter.toLowerCase();
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
    }
    if (sortBy === 'weight') {
      const weightOrder = { 'Heavy': 3, 'Medium': 2, 'Low': 1 };
      return (weightOrder[b.cognitiveWeight] || 0) - (weightOrder[a.cognitiveWeight] || 0);
    }
    return 0;
  });

  const amyTasks = tasks.filter(t => t.owner === 'Amy').length;
  const kyleTasks = tasks.filter(t => t.owner === 'Kyle').length;
  const heavyTasks = tasks.filter(t => t.cognitiveWeight === 'Heavy').length;

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Action Items</h2>
            <p className="text-xs text-slate-400 mt-1">
              {tasks.length} total tasks • {heavyTasks} heavy cognitive load
            </p>
          </div>
        </div>

        {/* Filters and Stats */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filter === 'all'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 active:border-slate-600'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('amy')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filter === 'amy'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 active:border-slate-600'
              }`}
            >
              Amy ({amyTasks})
            </button>
            <button
              onClick={() => setFilter('kyle')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                filter === 'kyle'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 active:border-slate-600'
              }`}
            >
              Kyle ({kyleTasks})
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="ml-auto px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded focus:outline-none focus:border-blue-500/50"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="weight">Sort by Weight</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
        {sortedTasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No tasks found
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className="px-6 py-4 active:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Left: Weight Indicator */}
                <div className={`w-1 h-full min-h-[60px] rounded ${getWeightColor(task.cognitiveWeight).split(' ')[0]}`}></div>

                {/* Center: Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium mb-1 ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-slate-400">
                          <span className="font-medium text-slate-300">{task.ownerInitials}</span> • {task.owner}
                        </span>
                        {task.dependent && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {task.dependent}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded border ${getWeightColor(task.cognitiveWeight)}`}>
                          {task.cognitiveWeight}
                        </span>
                        {task.cpePhase && (
                          <span className="text-xs text-slate-500">
                            {task.cpePhase}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Status and Due Date */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {getStatusBadge(task.status, task.dueDate)}
                      {task.dueDate && (
                        <div className="text-xs text-slate-400">
                          {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

