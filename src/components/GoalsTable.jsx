import React from 'react';
import { format, parseISO } from 'date-fns';

export default function GoalsTable({ goals = [] }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'planning':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'in progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'not started':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getQuarterColor = (quarter) => {
    switch (quarter) {
      case 'Q1':
        return 'text-blue-400';
      case 'Q2':
        return 'text-emerald-400';
      case 'Q3':
        return 'text-amber-400';
      case 'Q4':
        return 'text-purple-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-800/50 px-4 py-3">
        <h2 className="text-base font-semibold text-white">2026 Goals</h2>
        <p className="text-[10px] text-slate-400 mt-0.5">Strategic priorities</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-800/50">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Goal
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Quarter
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Target
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {goals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                  No goals available
                </td>
              </tr>
            ) : (
              goals.map((goal, index) => (
                <tr key={index} className="hover:bg-slate-800/30 active:bg-slate-800/40 transition-colors min-h-[44px] touch-manipulation">
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-white">{goal.goal}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${getQuarterColor(goal.quarter)}`}>
                      {goal.quarter}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-400">
                      {goal.targetDate ? format(parseISO(goal.targetDate), 'MMM yyyy') : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] rounded border ${getStatusColor(goal.status)}`}>
                      {goal.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
