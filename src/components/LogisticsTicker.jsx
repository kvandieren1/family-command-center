import React from 'react';

export default function LogisticsTicker({ tickerData = [], daysUntilVacation = 0, vacationName = '' }) {
  // Calculate progress bar (max 200 days for scale)
  const maxDays = 200;
  const progress = Math.min((daysUntilVacation / maxDays) * 100, 100);
  const filledBars = Math.floor(progress / 5); // 20 bars total (5% each)
  
  return (
    <div className="overflow-hidden bg-slate-900 border-b border-slate-800/50">
      {/* Vacation Banner */}
      {daysUntilVacation > 0 && (
        <div className="px-6 py-2 bg-slate-800/50 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {vacationName}
            </span>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-slate-900/50 rounded h-4 border border-slate-700/50 overflow-hidden">
                <div className="h-full flex">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full ${
                        i < filledBars
                          ? 'bg-emerald-500/60 border-r border-emerald-600/40'
                          : 'bg-slate-800/30 border-r border-slate-700/20'
                      }`}
                      style={{ width: '5%' }}
                    ></div>
                  ))}
                </div>
              </div>
              <span className="text-xs font-medium text-slate-300 min-w-[80px] text-right">
                {daysUntilVacation} Days
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Live Feed Ticker */}
      <div className="flex items-center gap-2 px-6 py-3">
        <div className="flex-shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Live Feed
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-8 animate-scroll">
            {tickerData.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 text-sm text-slate-300 whitespace-nowrap"
              >
                {item}
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {tickerData.map((item, index) => (
              <div
                key={`duplicate-${index}`}
                className="flex-shrink-0 text-sm text-slate-300 whitespace-nowrap"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
