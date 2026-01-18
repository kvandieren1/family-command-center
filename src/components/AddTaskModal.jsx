import React, { useState } from 'react';
import { MOCK_DATA } from '../lib/mockData';

export default function AddTaskModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    owner: 'Amy',
    cognitiveWeight: 'Medium',
    cpePhase: 'Planning',
    dueDate: '',
    dependent: '',
    status: 'Not started',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would save to Supabase
    console.log('New task:', formData);
    alert('Task added! (In production, this would save to database)');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800/50 rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Add Master Action Item</h2>
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
              Task Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
              placeholder="e.g., Find Tax Specialist"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Owner
              </label>
              <select
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="Amy">Amy</option>
                <option value="Kyle">Kyle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Cognitive Weight
              </label>
              <select
                value={formData.cognitiveWeight}
                onChange={(e) => setFormData({ ...formData, cognitiveWeight: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="Heavy">Heavy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                CPE Phase
              </label>
              <select
                value={formData.cpePhase}
                onChange={(e) => setFormData({ ...formData, cpePhase: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="Conception">Conception</option>
                <option value="Planning">Planning</option>
                <option value="Execution">Execution</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Dependent (Optional)
            </label>
            <select
              value={formData.dependent}
              onChange={(e) => setFormData({ ...formData, dependent: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="">None</option>
              {MOCK_DATA.household.dependents.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
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
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

