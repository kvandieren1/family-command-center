import React, { useState } from 'react';

export default function AddGoalModal({ onClose }) {
  const [formData, setFormData] = useState({
    goal: '',
    quarter: 'Q1',
    targetDate: '',
    status: 'Planning',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would save to Supabase
    console.log('New goal:', formData);
    alert('Goal added! (In production, this would save to database)');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800/50 rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Add 2026 Strategic Goal</h2>
            <button
              onClick={onClose}
              className="text-slate-400 active:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Goal Description
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
              placeholder="e.g., Family Hawaii Trip - 4 Seasons, 1 Week!"
              rows="3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Quarter
              </label>
              <select
                value={formData.quarter}
                onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Date
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="Planning">Planning</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm font-medium text-slate-300 active:bg-slate-800/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded text-sm font-medium text-blue-400 active:bg-blue-500/30 transition-colors"
            >
              Add Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

