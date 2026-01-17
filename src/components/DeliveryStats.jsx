import React from 'react';
import { parseISO, isPast, isToday } from 'date-fns';

export default function DeliveryStats({ tasks = [] }) {
  const calculateOnTimeRate = (owner) => {
    const ownerTasks = tasks.filter(t => t.owner === owner && t.dueDate);
    if (ownerTasks.length === 0) return 0;

    // For prototype, assume tasks with status "Not started" and past due are overdue
    // Tasks completed or not yet due are considered "on time"
    const onTimeTasks = ownerTasks.filter(task => {
      const isDueDatePast = isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
      // If task is completed or not yet due, it's on time
      // If task is past due and not started, it's overdue
      return task.status === 'completed' || !isDueDatePast;
    });

    return Math.round((onTimeTasks.length / ownerTasks.length) * 100);
  };

  const amyRate = calculateOnTimeRate('Amy');
  const kyleRate = calculateOnTimeRate('Kyle');
  const overallRate = Math.round((amyRate + kyleRate) / 2);

  const getRateColor = (rate) => {
    if (rate >= 80) return 'text-emerald-400';
    if (rate >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRateBg = (rate) => {
    if (rate >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (rate >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-800/50 px-4 py-3">
        <h2 className="text-base font-semibold text-white">On-Time Delivery</h2>
        <p className="text-[10px] text-slate-400 mt-0.5">Completion rate by owner</p>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-4">
        {/* Overall */}
        <div className="text-center pb-4 border-b border-slate-800/50">
          <div className="text-3xl font-bold text-white mb-1">{overallRate}%</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Overall Rate</div>
        </div>

        {/* Amy */}
        <div className={`p-3 rounded border ${getRateBg(amyRate)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">Amy</span>
            <span className={`text-lg font-bold ${getRateColor(amyRate)}`}>
              {amyRate}%
            </span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${
                amyRate >= 80 ? 'bg-emerald-500' : amyRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${amyRate}%` }}
            ></div>
          </div>
        </div>

        {/* Kyle */}
        <div className={`p-3 rounded border ${getRateBg(kyleRate)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">Kyle</span>
            <span className={`text-lg font-bold ${getRateColor(kyleRate)}`}>
              {kyleRate}%
            </span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${
                kyleRate >= 80 ? 'bg-emerald-500' : kyleRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${kyleRate}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
