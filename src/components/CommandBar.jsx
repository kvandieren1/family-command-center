import React from 'react';

export default function CommandBar({ onToggle, activeModal, activeView }) {
  const buttons = [
    { 
      id: 'dashboard', 
      label: 'DASHBOARD', 
      icon: '📊',
      active: !activeModal && (!activeView || activeView === 'dashboard'),
      action: () => onToggle(null, 'dashboard')
    },
    { 
      id: 'addTask', 
      label: 'ADD TASK', 
      icon: '➕',
      active: activeModal === 'addTask',
      action: () => onToggle('addTask', 'dashboard')
    },
    { 
      id: 'addGoal', 
      label: 'ADD GOAL', 
      icon: '🎯',
      active: activeModal === 'addGoal',
      action: () => onToggle('addGoal', 'dashboard')
    },
    { 
      id: 'sundaySync', 
      label: 'SUNDAY SYNC', 
      icon: '🔄',
      active: activeModal === 'sundaySync' || activeView === 'sundaySync',
      action: () => onToggle('sundaySync', 'sundaySync')
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/50 z-50 safe-area-inset-bottom">
      <div className="max-w-[1800px] mx-auto px-2 sm:px-4 md:px-6">
        <div className="flex items-center justify-center gap-0.5 sm:gap-1 py-2 sm:py-3" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 2rem))' }}>
          {buttons.map((button) => (
            <button
              key={button.id}
              onClick={button.action}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 md:px-4 min-h-[44px] text-[8px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-wider transition-all border ${
                button.active
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700/50 active:bg-slate-800/70 active:text-slate-300 touch-none'
              }`}
            >
              <span className="text-sm sm:text-base md:text-lg leading-none">{button.icon}</span>
              <span className="hidden md:inline">{button.label}</span>
              <span className="md:hidden text-[8px] sm:text-[9px] leading-tight">{button.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
