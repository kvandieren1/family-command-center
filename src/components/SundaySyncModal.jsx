import React, { useState } from 'react';

export default function SundaySyncModal({ onClose, isFullScreen = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const handleRecordSession = () => {
    setIsRecording(!isRecording);
    // In production, this would start Web Speech API recording
    if (!isRecording) {
      alert('Recording started! (In production, this would use Web Speech API)');
    } else {
      alert('Recording stopped! (In production, this would process transcript)');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would process the manual input
    console.log('Manual sync input:', manualInput);
    alert('Sync submitted! (In production, this would process and save)');
    onClose();
  };

  if (isFullScreen) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg w-full shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Sunday Sync</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Record Live Session */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Record Live Session</h3>
            <button
              onClick={handleRecordSession}
              className={`w-full px-4 py-3 rounded border transition-all ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                  : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-800/70'
              }`}
            >
              {isRecording ? '⏹ Stop Recording' : '🎤 Record Live Session'}
            </button>
            {isRecording && (
              <div className="mt-2 text-xs text-slate-400 text-center">
                Recording in progress... (Web Speech API integration)
              </div>
            )}
          </div>

          {/* Manual Input */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Manual Input</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
                placeholder="Enter sync notes, tasks, or conversation transcript..."
                rows="6"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm font-medium text-slate-300 hover:bg-slate-800/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded text-sm font-medium text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  Submit Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800/50 rounded-lg w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Sunday Sync</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Record Live Session */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Record Live Session</h3>
            <button
              onClick={handleRecordSession}
              className={`w-full px-4 py-3 rounded border transition-all ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                  : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-800/70'
              }`}
            >
              {isRecording ? '⏹ Stop Recording' : '🎤 Record Live Session'}
            </button>
            {isRecording && (
              <div className="mt-2 text-xs text-slate-400 text-center">
                Recording in progress... (Web Speech API integration)
              </div>
            )}
          </div>

          {/* Manual Input */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Manual Input</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm text-white focus:outline-none focus:border-blue-500/50"
                placeholder="Enter sync notes, tasks, or conversation transcript..."
                rows="6"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-sm font-medium text-slate-300 hover:bg-slate-800/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded text-sm font-medium text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  Submit Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
