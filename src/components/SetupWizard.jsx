import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, signInWithGoogle } from '../lib/supabase';

const COLOR_OPTIONS = [
  { name: 'Teal', value: '#14b8a6', class: 'bg-teal-500' },
  { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500' },
  { name: 'Rose', value: '#f43f5e', class: 'bg-rose-500' },
  { name: 'Amber', value: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Emerald', value: '#10b981', class: 'bg-emerald-500' },
  { name: 'Violet', value: '#8b5cf6', class: 'bg-violet-500' },
  { name: 'Cyan', value: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Slate', value: '#64748b', class: 'bg-slate-500' },
  { name: 'Crimson', value: '#dc2626', class: 'bg-red-600' }
];

const SUPPORT_ROLES = ['Nanny', 'Grandparent', 'Au Pair', 'Babysitter'];

export default function SetupWizard({ onComplete, isLoggedIn, onGoogleLoginComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    familyName: '',
    heads: [
      { name: '', email: '', color: COLOR_OPTIONS[0].value, initials: '' },
      { name: '', email: '', color: COLOR_OPTIONS[1].value, initials: '' }
    ],
    support: [],
    dependents: [],
    apiConnections: {
      googleCalendar: false,
      plaid: false,
      amazon: false
    }
  });

  const [currentSupport, setCurrentSupport] = useState({ name: '', role: '', color: COLOR_OPTIONS[0].value });
  const [currentDependent, setCurrentDependent] = useState({ name: '', type: '', color: COLOR_OPTIONS[0].value });
  const [householdNameSaved, setHouseholdNameSaved] = useState(false);

  /**
   * Helper function to check if a color is available for selection
   * Prevents duplicate color selection between Pilot 1 and Pilot 2
   * @param {string} colorValue - The color value to check
   * @param {number} currentPilotIndex - The index of the pilot currently selecting (0 or 1)
   * @returns {boolean} - True if color is available, false if already selected by other pilot
   */
  const isColorAvailable = (colorValue, currentPilotIndex) => {
    const otherPilotIndex = currentPilotIndex === 0 ? 1 : 0;
    const otherPilotColor = formData.heads[otherPilotIndex]?.color;
    return otherPilotColor !== colorValue;
  };

  const updateHead = (index, field, value) => {
    const updatedHeads = [...formData.heads];
    updatedHeads[index][field] = value;
    
    // Auto-generate initials
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

  const addSupport = () => {
    if (currentSupport.name.trim() && currentSupport.role.trim()) {
      setFormData({
        ...formData,
        support: [...formData.support, { ...currentSupport, id: `support-${Date.now()}` }]
      });
      setCurrentSupport({ name: '', role: '', color: COLOR_OPTIONS[0].value });
    }
  };

  const removeSupport = (id) => {
    setFormData({
      ...formData,
      support: formData.support.filter(s => s.id !== id)
    });
  };

  const addDependent = () => {
    if (currentDependent.name.trim() && currentDependent.type.trim()) {
      setFormData({
        ...formData,
        dependents: [...formData.dependents, { 
          name: currentDependent.name.trim(), 
          type: currentDependent.type,
          color: currentDependent.color,
          id: `dep-${Date.now()}` 
        }]
      });
      setCurrentDependent({ name: '', type: '', color: COLOR_OPTIONS[0].value });
    }
  };

  const removeDependent = (id) => {
    setFormData({
      ...formData,
      dependents: formData.dependents.filter(d => d.id !== id)
    });
  };

  const toggleApiConnection = (service) => {
    setFormData({
      ...formData,
      apiConnections: {
        ...formData.apiConnections,
        [service]: !formData.apiConnections[service]
      }
    });
  };

  const handleNext = async () => {
    if (step < 4 && canProceed()) {
      // Save family name to Supabase when on step 1
      if (step === 1 && formData.familyName.trim() && !householdNameSaved) {
        try {
          const { data, error } = await supabase
            .from('households')
            .insert([
              {
                name: formData.familyName.trim(),
                created_at: new Date().toISOString()
              }
            ])
            .select();
          
          if (error) {
            console.error('Error saving household to Supabase:', error);
          } else {
            console.log('Household saved to Supabase:', data);
            setHouseholdNameSaved(true);
            // Save to localStorage as well
            localStorage.setItem('householdData', JSON.stringify({ name: formData.familyName.trim() }));
          }
        } catch (err) {
          console.error('Failed to save household:', err);
        }
      } else if (step > 1) {
        // For other steps, proceed normally
        setStep(step + 1);
      }
    }
  };

  const handleSaveHouseholdName = async () => {
    if (formData.familyName.trim()) {
      try {
        const { data, error } = await supabase
          .from('households')
          .insert([
            {
              name: formData.familyName.trim(),
              created_at: new Date().toISOString()
            }
          ])
          .select();
        
        if (error) {
          console.error('Error saving household to Supabase:', error);
        } else {
          console.log('Household saved to Supabase:', data);
          setHouseholdNameSaved(true);
          // Save to localStorage as well
          localStorage.setItem('householdData', JSON.stringify({ name: formData.familyName.trim() }));
        }
      } catch (err) {
        console.error('Failed to save household:', err);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    // Get household ID from user's session (if available)
    // During onboarding, household might not exist yet, so this is optional
    let householdId = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Try to get household from user's profile
        const { data: profiles } = await supabase
          .from('profiles')
          .select('household_id')
          .eq('user_id', session.user.id)
          .limit(1)
          .single();
        
        if (profiles?.household_id) {
          householdId = profiles.household_id;
        }
      }
    } catch (err) {
      console.warn('Could not retrieve household ID during setup:', err);
    }
    
    // Save dependents with their types to Supabase profiles table (only if household exists)
    if (householdId) {
      try {
        // Save each dependent as a profile with dependent_type
        for (const dependent of formData.dependents) {
          if (dependent.name && dependent.type) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                household_id: householdId,
                name: dependent.name,
                type: 'dependent',
                dependent_type: dependent.type,
                created_at: new Date().toISOString()
              });

            if (profileError) {
              console.error('Error saving dependent to Supabase:', profileError);
            } else {
              console.log('Dependent saved to Supabase:', dependent.name, dependent.type);
            }
          }
        }
      } catch (err) {
        console.error('Failed to save dependents:', err);
      }
    } else {
      console.log('Household ID not available - dependents will be saved after household creation');
    }

    const householdData = {
      name: formData.familyName,
      heads: formData.heads.map(h => ({
        initials: h.initials || h.name.substring(0, 2).toUpperCase(),
        name: h.name,
        email: h.email,
        color: h.color
      })),
      support: formData.support,
      dependents: formData.dependents,
      apiConnections: formData.apiConnections
    };
    
    localStorage.setItem('householdData', JSON.stringify(householdData));
    localStorage.setItem('onboardingComplete', 'true');
    
    onComplete(householdData);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        // Step 1: Can proceed only if family name is entered and saved
        return householdNameSaved && formData.familyName.trim().length > 0;
      case 2:
        return formData.heads.every(h => h.name.trim() && h.email.trim());
      case 3:
        return true; // Support and dependents are optional
      case 4:
        return true; // API connections are optional
      default:
        return false;
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-2xl"
      >
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Step {step} of 4</span>
            <span className="text-xs text-slate-500">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-500 to-indigo-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl"
          layout
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Name Your Cockpit */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="p-8 sm:p-12"
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3">
                      Step 1: Name Your Cockpit
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base">
                      Your family's mission control. Let's get your crew synchronized.
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="max-w-md mx-auto"
                >
                  {!householdNameSaved ? (
                    <>
                      {/* Show input field and Next button when name not saved */}
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Household/Family Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.familyName}
                        onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && formData.familyName.trim() && handleSaveHouseholdName()}
                        placeholder="e.g., Van Dieren Family"
                        className="w-full px-5 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all text-lg"
                        autoFocus
                      />
                      <p className="mt-3 text-xs text-slate-500 text-center mb-6">
                        This will appear throughout your command center
                      </p>
                      
                      {/* Next Button - Disabled until name is entered */}
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={handleSaveHouseholdName}
                        disabled={!formData.familyName.trim()}
                        className="w-full px-5 py-4 bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-medium rounded-xl active:from-teal-600 active:to-indigo-600 transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)] disabled:opacity-30 disabled:cursor-not-allowed disabled:active:from-teal-500 disabled:active:to-indigo-500"
                      >
                        Next →
                      </motion.button>
                    </>
                  ) : (
                    <>
                      {/* Show saved name confirmation and Google Calendar button when name is saved */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-6"
                      >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/20 border border-teal-500/40 rounded-xl mb-4">
                          <span className="text-teal-400 text-sm">✓ Household name saved</span>
                        </div>
                        <p className="text-slate-300 text-lg font-medium">
                          {formData.familyName}
                        </p>
                      </motion.div>

                      {/* Google Calendar Connect Button - Only appears after name is saved */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="pt-6 border-t border-slate-800/50"
                      >
                        <button
                          type="button"
                          onClick={async () => {
                            const result = await signInWithGoogle();
                            if (result.success && result.redirectUrl) {
                              window.location.href = result.redirectUrl;
                            } else if (result.error) {
                              alert(`Error: ${result.error}`);
                            }
                          }}
                          className="w-full px-5 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white active:bg-slate-800/70 active:border-blue-500/50 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all flex items-center justify-center gap-3"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span>Connect Google Calendar</span>
                        </button>
                        <p className="mt-3 text-xs text-slate-500 text-center">
                          Connect your calendar to get started
                        </p>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: The Cockpit */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="p-8 sm:p-12"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3">
                    The Cockpit
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base mb-2">
                    The people who actually do stuff around the house.
                  </p>
                </div>

                <div className="space-y-6 max-w-2xl mx-auto">
                  {formData.heads.map((head, index) => (
                    <motion.div
                      key={index}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                          style={{ backgroundColor: head.color }}
                        >
                          {head.initials || '?'}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Pilot {index + 1}</h3>
                          <input
                            type="text"
                            value={head.name}
                            onChange={(e) => updateHead(index, 'name', e.target.value)}
                            placeholder="Full name"
                            className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-2">Email</label>
                          <input
                            type="email"
                            value={head.email}
                            onChange={(e) => updateHead(index, 'email', e.target.value)}
                            placeholder="email@example.com"
                            className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-2">Signature Color</label>
                          <div className="grid grid-cols-3 gap-2">
                            {COLOR_OPTIONS.map((color) => {
                              const isSelected = head.color === color.value;
                              const isDisabled = !isColorAvailable(color.value, index);
                              
                              return (
                                <button
                                  key={color.name}
                                  type="button"
                                  onClick={() => !isDisabled && updateHead(index, 'color', color.value)}
                                  disabled={isDisabled}
                                  className={`px-3 py-2 rounded-lg border-2 transition-all ${
                                    isSelected
                                      ? 'border-white/50 bg-slate-800/50'
                                      : isDisabled
                                      ? 'border-slate-800/30 bg-slate-900/20 opacity-40 cursor-not-allowed'
                                      : 'border-slate-700/50 bg-slate-900/30 active:border-slate-600/50'
                                  }`}
                                  title={isDisabled ? `Color already selected by ${index === 0 ? 'Pilot 2' : 'Pilot 1'}` : ''}
                                >
                                  <div className="flex items-center gap-2 justify-center">
                                    <div
                                      className={`w-4 h-4 rounded-full ${color.class}`}
                                      style={{ backgroundColor: color.value }}
                                    ></div>
                                    <span className="text-xs text-slate-300">{color.name}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: The Crew */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="p-8 sm:p-12"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3">
                    The Crew
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base">
                    Add your supporting cast and dependents
                  </p>
                </div>

                <div className="space-y-8 max-w-2xl mx-auto">
                  {/* Supporting Cast */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Supporting Cast
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <input
                        type="text"
                        value={currentSupport.name}
                        onChange={(e) => setCurrentSupport({ ...currentSupport, name: e.target.value })}
                        placeholder="Name"
                        className="px-4 py-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
                      />
                      <select
                        value={currentSupport.role}
                        onChange={(e) => setCurrentSupport({ ...currentSupport, role: e.target.value })}
                        className="px-4 py-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="">Select role</option>
                        {SUPPORT_ROLES.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs text-slate-400 mb-2">Signature Color</label>
                      <div className="grid grid-cols-3 gap-2">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setCurrentSupport({ ...currentSupport, color: color.value })}
                            className={`px-3 py-2 rounded-lg border-2 transition-all ${
                              currentSupport.color === color.value
                                ? 'border-white/50 bg-slate-800/50'
                                : 'border-slate-700/50 bg-slate-900/30 active:border-slate-600/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 justify-center">
                              <div
                                className={`w-4 h-4 rounded-full ${color.class}`}
                                style={{ backgroundColor: color.value }}
                              ></div>
                              <span className="text-xs text-slate-300">{color.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addSupport}
                      disabled={!currentSupport.name.trim() || !currentSupport.role.trim()}
                      className="w-full sm:w-auto px-6 py-3 bg-teal-500/20 border border-teal-500/40 rounded-xl text-teal-400 active:bg-teal-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      + Add Support
                    </button>

                    {formData.support.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {formData.support.map((item) => (
                          <motion.span
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-sm text-slate-300"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color || COLOR_OPTIONS[0].value }}
                            ></div>
                            <span>{item.name}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 text-xs">{item.role}</span>
                            <button
                              type="button"
                              onClick={() => removeSupport(item.id)}
                              className="ml-1 text-slate-500 active:text-slate-300"
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
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Dependents
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <input
                        type="text"
                        value={currentDependent.name}
                        onChange={(e) => setCurrentDependent({ ...currentDependent, name: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && addDependent()}
                        placeholder="Name"
                        className="px-4 py-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
                      />
                      <select
                        value={currentDependent.type}
                        onChange={(e) => setCurrentDependent({ ...currentDependent, type: e.target.value })}
                        className="px-4 py-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="">Select type</option>
                        <option value="Child">Child</option>
                        <option value="Pet">Pet</option>
                        <option value="Relative">Relative</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs text-slate-400 mb-2">Signature Color</label>
                      <div className="grid grid-cols-3 gap-2">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setCurrentDependent({ ...currentDependent, color: color.value })}
                            className={`px-3 py-2 rounded-lg border-2 transition-all ${
                              currentDependent.color === color.value
                                ? 'border-white/50 bg-slate-800/50'
                                : 'border-slate-700/50 bg-slate-900/30 active:border-slate-600/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 justify-center">
                              <div
                                className={`w-4 h-4 rounded-full ${color.class}`}
                                style={{ backgroundColor: color.value }}
                              ></div>
                              <span className="text-xs text-slate-300">{color.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addDependent}
                      disabled={!currentDependent.name.trim() || !currentDependent.type.trim()}
                      className="w-full sm:w-auto px-6 py-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400 active:bg-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      + Add Dependent
                    </button>

                    {formData.dependents.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {formData.dependents.map((item) => (
                          <motion.span
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-sm text-slate-300"
                          >
                            <span>{item.name}</span>
                            {item.type && (
                              <>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-400 text-xs">{item.type}</span>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => removeDependent(item.id)}
                              className="ml-1 text-slate-500 active:text-slate-300"
                            >
                              ×
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: API Permissions Preview */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="p-8 sm:p-12"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3">
                    Connect Your Life
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base">
                    Link your services for seamless automation
                  </p>
                </div>

                <div className="space-y-4 max-w-xl mx-auto">
                  {/* Google Calendar */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl active:border-slate-600/50 transition-all cursor-pointer"
                    onClick={() => toggleApiConnection('googleCalendar')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">📅</span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium mb-1">Google Calendar</h3>
                          <p className="text-xs text-slate-400">Sync events and appointments</p>
                        </div>
                      </div>
                      <motion.div
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          formData.apiConnections.googleCalendar
                            ? 'bg-teal-500'
                            : 'bg-slate-700'
                        }`}
                        animate={{
                          backgroundColor: formData.apiConnections.googleCalendar ? '#14b8a6' : '#475569'
                        }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full"
                          animate={{
                            x: formData.apiConnections.googleCalendar ? 24 : 0
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Plaid */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl active:border-slate-600/50 transition-all cursor-pointer"
                    onClick={() => toggleApiConnection('plaid')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">💳</span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium mb-1">Plaid</h3>
                          <p className="text-xs text-slate-400">Connect bank accounts for expense tracking</p>
                        </div>
                      </div>
                      <motion.div
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          formData.apiConnections.plaid
                            ? 'bg-teal-500'
                            : 'bg-slate-700'
                        }`}
                        animate={{
                          backgroundColor: formData.apiConnections.plaid ? '#14b8a6' : '#475569'
                        }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full"
                          animate={{
                            x: formData.apiConnections.plaid ? 24 : 0
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Amazon */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl active:border-slate-600/50 transition-all cursor-pointer"
                    onClick={() => toggleApiConnection('amazon')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">📦</span>
                        </div>
                        <div>
                          <h3 className="text-white font-medium mb-1">Amazon</h3>
                          <p className="text-xs text-slate-400">Track orders and auto-generate shopping lists</p>
                        </div>
                      </div>
                      <motion.div
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                          formData.apiConnections.amazon
                            ? 'bg-teal-500'
                            : 'bg-slate-700'
                        }`}
                        animate={{
                          backgroundColor: formData.apiConnections.amazon ? '#14b8a6' : '#475569'
                        }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full"
                          animate={{
                            x: formData.apiConnections.amazon ? 24 : 0
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 text-center text-xs text-slate-500"
                >
                  You can connect these services later in settings
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Footer */}
          <div className="px-8 sm:px-12 py-6 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`px-6 py-3 rounded-xl border font-medium transition-all ${
                step === 1
                  ? 'border-slate-700/30 text-slate-600 cursor-not-allowed'
                  : 'border-slate-700/50 text-slate-300 active:bg-slate-800/50 active:border-slate-600/50'
              }`}
            >
              Back
            </button>
            
            {step < 4 ? (
              step === 1 ? (
                // Step 1: No Continue button - only Google Calendar button
                <div className="w-full"></div>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`px-8 py-3 rounded-xl border font-medium transition-all ${
                    canProceed()
                      ? 'bg-gradient-to-r from-teal-500/20 to-indigo-500/20 border-teal-500/40 text-teal-400 active:from-teal-500/30 active:to-indigo-500/30 shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                      : 'border-slate-700/30 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  Continue →
                </button>
              )
            ) : (
              <button
                onClick={handleComplete}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-medium active:from-teal-600 active:to-indigo-600 transition-all shadow-[0_0_20px_rgba(20,184,166,0.4)]"
              >
                Complete Setup
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

