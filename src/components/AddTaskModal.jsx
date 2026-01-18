import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AddTaskModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    owner: 'Amy',
    cognitiveWeight: 'Medium', // Low, Medium, or High (1-3 scale)
    cpePhase: 'Planning',
    dueDate: '',
    dependent: '',
    status: 'Not started',
  });
  const [dependents, setDependents] = useState([]);
  const [householdId, setHouseholdId] = useState(null);

  // Fetch dependents from profiles table
  useEffect(() => {
    const fetchDependents = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Get household ID from user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('household_id')
          .eq('user_id', session.user.id)
          .single();

        if (profile?.household_id) {
          setHouseholdId(profile.household_id);

          // Fetch dependents from profiles table
          const { data: dependentsData, error } = await supabase
            .from('profiles')
            .select('name, type')
            .eq('household_id', profile.household_id)
            .eq('type', 'dependent');

          if (error) {
            console.error('Error fetching dependents:', error);
          } else {
            setDependents(dependentsData || []);
          }
        }
      } catch (err) {
        console.error('Error fetching dependents:', err);
      }
    };

    fetchDependents();
  }, []);

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
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Cognitive Load
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, cognitiveWeight: 'Low' })}
                className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                  formData.cognitiveWeight === 'Low'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-300 active:bg-slate-800/70 active:border-slate-600/50'
                }`}
              >
                Low
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, cognitiveWeight: 'Medium' })}
                className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                  formData.cognitiveWeight === 'Medium'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-300 active:bg-slate-800/70 active:border-slate-600/50'
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, cognitiveWeight: 'High' })}
                className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                  formData.cognitiveWeight === 'High'
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-300 active:bg-slate-800/70 active:border-slate-600/50'
                }`}
              >
                High
              </button>
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
              {dependents.length > 0 ? (
                dependents.map(dep => (
                  <option key={dep.name} value={dep.name}>{dep.name}</option>
                ))
              ) : (
                <option disabled>No dependents found</option>
              )}
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

