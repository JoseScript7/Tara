import React, { useState } from 'react';
import { useVoiceJobs } from '../../context/VoiceJobsContext';
import { CheckCircle2, ChevronUp, ChevronDown, X } from 'lucide-react';

export const VoiceJobHUD: React.FC = () => {
  const { 
    isListening, transcript, activeJobs, completedJobs, latestNotification,
    dismissNotification 
  } = useVoiceJobs();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Only display if active jobs are running or there is an active notification
  const shouldShow = (activeJobs.length > 0 || (latestNotification && !isDismissed));

  return (
    <>
      {/* Active Speech / Listening Banner (Clean top indicator when wake-word is triggered) */}
      {isListening && (
        <div className="fixed top-20 right-6 z-50 bg-[#151615]/95 backdrop-blur-xl border border-[#FA7F62]/50 text-white p-3.5 rounded-2xl shadow-2xl max-w-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FA7F62] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FA7F62] animate-ping" />
            Listening to your voice command...
          </div>
          <p className="text-sm font-semibold text-white/90 italic">
            {transcript ? `"${transcript}"` : 'Speak now (English or Hindi)...'}
          </p>
        </div>
      )}

      {/* Floating Background Job Status Capsule (Bottom Left) - Auto-collapses when done */}
      {shouldShow && (
        <div className="fixed bottom-6 left-6 z-40 max-w-md animate-in slide-in-from-bottom-4">
          <div className="bg-[#151615]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-3.5 text-white">
            
            {/* Header / Active Job Indicator */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {activeJobs.length > 0 ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wide">
                    {activeJobs.length > 0 ? (
                      `Background Jobs Active (${activeJobs.length})`
                    ) : (
                      'System Execution Complete'
                    )}
                  </span>
                  <span className="text-[10px] text-white/50 font-mono">
                    Autonomous Multi-System Execution
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white/80 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {isDrawerOpen ? 'Hide' : 'Details'}
                  {isDrawerOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>
                <button 
                  onClick={() => {
                    setIsDismissed(true);
                    dismissNotification();
                  }} 
                  className="text-white/40 hover:text-white p-1"
                  title="Close notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Currently Running Job Progress Bar */}
            {activeJobs.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-white/10">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="font-semibold text-amber-300 truncate max-w-[280px]">
                    {activeJobs[0].title}
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{activeJobs[0].progress}%</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-[#FA7F62] h-full transition-all duration-300" 
                    style={{ width: `${activeJobs[0].progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/60 mt-1 truncate">{activeJobs[0].description}</p>
              </div>
            )}

            {/* Latest Completed Notification Toast */}
            {activeJobs.length === 0 && latestNotification && (
              <div className="mt-2.5 pt-2 border-t border-white/10 text-xs text-emerald-300 flex items-center justify-between">
                <span>{latestNotification}</span>
              </div>
            )}

            {/* Expanded Background Jobs History Drawer */}
            {isDrawerOpen && (
              <div className="mt-3 pt-3 border-t border-white/10 max-h-56 overflow-y-auto space-y-2 pr-1">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Completed System Jobs</p>
                {completedJobs.slice(0, 4).map(job => (
                  <div key={job.id} className="p-2 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px] mb-0.5">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {job.title}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">{job.completedAt}</span>
                    </div>
                    <p className="text-[10px] text-white/70">{job.result || job.description}</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};

