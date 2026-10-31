import React from 'react';
import { RoomCanvas } from '../components/room/RoomCanvas';
import { useDerivedState } from '../context/DerivedStateContext';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Room3D: React.FC = () => {
  const { state } = useDerivedState();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pb-10">
      {/* Main Content Header */}
      <div className="mb-6 flex justify-between items-start shrink-0">
        <div className="max-w-xl">
          <div className="text-sm font-bold text-paytm-blue mb-1">
            Step 1 · Explore
          </div>
          <h1 className="text-4xl font-bold text-navy mb-2">Your merchant space</h1>
          <p className="text-navy/70 leading-relaxed text-sm">
            Live digital twin of {state.business_name}. Tara monitors Soundbox telemetry, EDC connectivity, and POS status in real time.
          </p>
        </div>
        <div 
          onClick={() => navigate('/devices')}
          className={`cursor-pointer px-4 py-2 rounded-full border shadow-sm flex items-center gap-2 mt-2 transition-all hover:scale-105 ${
            state.all_systems_active
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
          data-testid="room-status-badge"
        >
          <div className={`w-2.5 h-2.5 rounded-full ${state.all_systems_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm font-bold">{state.system_status.status_label}</span>
        </div>
      </div>

      {/* Honest Alert when offline device exists */}
      {!state.all_systems_active && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-xs font-semibold text-red-900">
              {state.system_status.subtext}
            </span>
          </div>
          <button 
            onClick={() => navigate('/devices')}
            className="text-xs font-bold text-red-700 underline hover:text-red-900 shrink-0 ml-4"
          >
            Manage Soundbox
          </button>
        </div>
      )}

      {/* Room Canvas Area */}
      <div className="flex-1 min-h-0 mb-4 shrink-0" style={{ minHeight: '440px' }}>
        <RoomCanvas />
      </div>

      {/* Merchant Quick Assurance & Consent Status */}
      <div className="bg-white-panel p-4 rounded-xl border border-soft-border/60 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-paytm-blue/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-paytm-blue" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-navy">Autonomous Protection Active</h4>
            <p className="text-[11px] text-navy/60">
              Tara is observing heartbeats every 30s. Tier-1 automated recovery triggers automatically before any human ops dispatch.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-paytm-blue">Consent Protocol v2</span>
        </div>
      </div>
    </div>
  );
};

