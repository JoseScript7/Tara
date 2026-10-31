import React from 'react';
import { Activity, Inbox, AlertTriangle, RefreshCcw } from 'lucide-react';

export type StateMode = 'loading' | 'empty' | 'error';

interface StateFeedbackProps {
  mode: StateMode;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const StateFeedback: React.FC<StateFeedbackProps> = ({ 
  mode, 
  title, 
  message, 
  onRetry,
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] ${className}`}>
      
      {mode === 'loading' && (
        <>
          <Activity className="w-8 h-8 text-paytm-blue animate-pulse mb-4" />
          <h3 className="text-navy font-bold">{title || "Loading..."}</h3>
          {message && <p className="text-navy/60 text-sm mt-2">{message}</p>}
        </>
      )}

      {mode === 'empty' && (
        <>
          <div className="w-16 h-16 bg-light-bg rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-navy/30" />
          </div>
          <h3 className="text-navy font-bold text-lg">{title || "No data found"}</h3>
          {message && <p className="text-navy/60 text-sm mt-2 max-w-sm">{message}</p>}
        </>
      )}

      {mode === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-navy font-bold text-lg">{title || "Something went wrong"}</h3>
          {message && <p className="text-navy/60 text-sm mt-2 max-w-sm">{message}</p>}
          
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-light-bg text-navy hover:bg-soft-border/50 rounded-lg text-sm font-bold transition-colors"
            >
              <RefreshCcw className="w-4 h-4" /> Try Again
            </button>
          )}
        </>
      )}

    </div>
  );
};
