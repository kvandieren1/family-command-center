import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    householdName: '',
    heads: [{ name: '', email: '', role: '', initials: '' }],
    support: [],
    dependents: []
  });

  const [currentSupport, setCurrentSupport] = useState('');
  const [currentDependent, setCurrentDependent] = useState('');

  const addHead = () => {
    setFormData({
      ...formData,
      heads: [...formData.heads, { name: '', email: '', role: '', initials: '' }]
    });
  };

  const updateHead = (index, field, value) => {
    const updatedHeads = [...formData.heads];
    updatedHeads[index][field] = value;
    
    // Auto-generate initials from name
    if (field === 'name' && value) {
      const parts = value.trim().split(' ');
      if (parts.length >= 2) {
        updatedHeads[index].initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.length === 1) {
        updatedHeads[index].initials = parts[0].substring(0, 2).toUpperCase();
      }
    }
    
    setFormData({ ...formData, heads: updatedHeads });
  };

  const removeHead = (index) => {
    if (formData.heads.length > 1) {
      setFormData({
        ...formData,
        heads: formData.heads.filter((_, i) => i !== index)
      });
    }
  };

  const addSupport = () => {
    if (currentSupport.trim()) {
      setFormData({
        ...formData,
        support: [...formData.support, currentSupport.trim()]
      });
      setCurrentSupport('');
    }
  };

  const removeSupport = (index) => {
    setFormData({
      ...formData,
      support: formData.support.filter((_, i) => i !== index)
    });
  };

  const addDependent = () => {
    if (currentDependent.trim()) {
      setFormData({
        ...formData,
        dependents: [...formData.dependents, currentDependent.trim()]
      });
      setCurrentDependent('');
    }
  };

  const removeDependent = (index) => {
    setFormData({
      ...formData,
      dependents: formData.dependents.filter((_, i) => i !== index)
    });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Save to localStorage
    const householdData = {
      name: formData.householdName,
      heads: formData.heads.map(h => h.initials || h.name.substring(0, 2).toUpperCase()),
      support: formData.support,
      dependents: formData.dependents
    };
    
    localStorage.setItem('householdData', JSON.stringify(householdData));
    localStorage.setItem('onboardingComplete', 'true');
    
    // Call completion handler
    onComplete(householdData);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.householdName.trim().length > 0;
      case 2:
        return formData.heads.every(h => h.name.trim() && h.email.trim() && h.role.trim());
      case 3:
        return true; // Support and dependents are optional
      default:
        return false;
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-lg overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-1 bg-slate-800/50">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="px-6 sm:px-8 py-6 border-b border-slate-800/50">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
            Welcome to Command Center
          </h1>
          <p className="text-sm text-slate-400">
            Step {step} of 3: {step === 1 ? 'Household Setup' : step === 2 ? 'User Profiles' : 'Support & Dependents'}
          </p>
        </div>

        {/* Step Content */}
        <div className="px-6 sm:px-8 py-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Household Name
                  </label>
                  <input
                    type="text"
                    value={formData.householdName}
                    onChange={(e) => setFormData({ ...formData, householdName: e.target.value })}
                    placeholder="e.g., Van Dieren Family"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    This will be your household's primary identifier
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-slate-300">
                      The Cockpit
                    </label>
                    <button
                      type="button"
                      onClick={addHead}
                      className="px-3 py-1.5 text-xs bg-slate-800/50 border border-slate-700/50 rounded text-slate-300 hover:bg-slate-800/70 transition-colors"
                    >
                      + Add Pilot
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.heads.map((head, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400">Pilot {index + 1}</span>
                          {formData.heads.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeHead(index)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Name</label>
                            <input
                              type="text"
                              value={head.name}
                              onChange={(e) => updateHead(index, 'name', e.target.value)}
                              placeholder="Full name"
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Email</label>
                            <input
                              type="email"
                              value={head.email}
                              onChange={(e) => updateHead(index, 'email', e.target.value)}
                              placeholder="email@example.com"
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Role</label>
                            <input
                              type="text"
                              value={head.role}
                              onChange={(e) => updateHead(index, 'role', e.target.value)}
                              placeholder="e.g., Parent, Co-Pilot"
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Initials</label>
                            <input
                              type="text"
                              value={head.initials}
                              onChange={(e) => updateHead(index, 'initials', e.target.value.toUpperCase().substring(0, 2))}
                              placeholder="Auto-generated"
                              maxLength={2}
                              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Support */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Supporting Cast (Optional)
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Add nannies, au pairs, or other support staff
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={currentSupport}
                      onChange={(e) => setCurrentSupport(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSupport()}
                      placeholder="e.g., Nanny, Au Pair"
                      className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                      type="button"
                      onClick={addSupport}
                      className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.support.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.support.map((item, index) => (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-slate-300"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeSupport(index)}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            ×
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dependents */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dependents (Optional)
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Add children or other dependents
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={currentDependent}
                      onChange={(e) => setCurrentDependent(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addDependent()}
                      placeholder="e.g., Noah, Leia"
                      className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                      type="button"
                      onClick={addDependent}
                      className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.dependents.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.dependents.map((item, index) => (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-slate-300"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeDependent(index)}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            ×
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="px-6 sm:px-8 py-6 border-t border-slate-800/50 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-4 py-2 rounded-lg border transition-all ${
              step === 1
                ? 'border-slate-700/30 text-slate-600 cursor-not-allowed'
                : 'border-slate-700/50 text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            Back
          </button>
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg border font-medium transition-all ${
                canProceed()
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30'
                  : 'border-slate-700/30 text-slate-600 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 font-medium hover:bg-blue-500/30 transition-all shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            >
              Complete Setup
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
