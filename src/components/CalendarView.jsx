import React, { useState } from 'react';
import { format, parseISO, isSameDay, startOfDay, addDays } from 'date-fns';

export default function CalendarView({ tasks = [] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  
  // Split into 2 weeks
  const week1 = days.slice(0, 7);
  const week2 = days.slice(7, 14);
  
  // Mobile: Show only current week by default, with toggle
  const [showWeek2, setShowWeek2] = useState(false);

  const getOwnerColor = (owner) => {
    return owner === 'Amy' ? 'bg-blue-500/20 border-blue-500/40' : 'bg-purple-500/20 border-purple-500/40';
  };

  const getOwnerInitials = (owner) => {
    return owner === 'Amy' ? '[A]' : '[K]';
  };

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(parseISO(task.dueDate), day);
    });
  };

  const getWeightGlow = (weight) => {
    if (weight === 'Heavy') {
      return 'shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    }
    return '';
  };

  const renderWeek = (weekDays, weekNum) => (
    <div key={weekNum} className="grid grid-cols-7 gap-px bg-slate-800/50">
      {weekDays.map((day, idx) => {
        const dayTasks = getTasksForDay(day);
        const isToday = isSameDay(day, today);
        const dayOfWeek = format(day, 'EEE');
        const dayNum = format(day, 'd');

        return (
          <div
            key={idx}
            className={`bg-slate-900/80 min-h-[120px] sm:min-h-[180px] p-1.5 sm:p-2 ${
              isToday ? 'ring-1 ring-blue-500/50 bg-slate-900' : ''
            }`}
          >
            {/* Day Header */}
            <div className={`text-[10px] sm:text-xs font-medium mb-1 sm:mb-2 ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider">{dayOfWeek}</div>
              <div className={`text-xs sm:text-sm ${isToday ? 'text-white font-semibold' : 'text-slate-300'}`}>
                {dayNum}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-1">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`text-[9px] sm:text-[10px] p-1 sm:p-1.5 min-h-[36px] sm:min-h-[44px] rounded border ${getOwnerColor(task.owner)} ${getWeightGlow(task.cognitiveWeight)} touch-manipulation`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-semibold text-slate-200 text-[9px] sm:text-[10px]">
                      {getOwnerInitials(task.owner)}
                    </span>
                    <span className="text-slate-300 truncate flex-1 text-[9px] sm:text-[10px]">{task.title}</span>
                  </div>
                  {task.dependent && (
                    <div className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5">
                      {task.dependent}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-800/50 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">14-Day Calendar</h2>
            <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Tasks mapped by due date</p>
          </div>
          {/* Mobile: Toggle for second week */}
          <button
            onClick={() => setShowWeek2(!showWeek2)}
            className="lg:hidden px-2 py-1 text-[10px] bg-slate-800/50 border border-slate-700/50 rounded text-slate-300 hover:bg-slate-800/70"
          >
            {showWeek2 ? 'Week 1' : 'Week 2'}
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-1 sm:p-2">
        {/* Week 1 - Always visible */}
        <div className="mb-px">
          {renderWeek(week1, 1)}
        </div>
        
        {/* Week 2 - Toggle on mobile, always visible on desktop */}
        <div className={`${showWeek2 ? 'block' : 'hidden'} lg:block`}>
          {renderWeek(week2, 2)}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-900/50 border-t border-slate-800/50 px-3 sm:px-4 py-2 flex items-center justify-center gap-3 sm:gap-4 text-[9px] sm:text-[10px]">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border border-blue-500/40 bg-blue-500/20"></div>
          <span className="text-slate-400">Amy</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border border-purple-500/40 bg-purple-500/20"></div>
          <span className="text-slate-400">Kyle</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 ml-2 sm:ml-4">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"></div>
          <span className="text-slate-400">Heavy</span>
        </div>
      </div>
    </div>
  );
}
