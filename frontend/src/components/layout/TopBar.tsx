import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Landmark, 
  Smartphone,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MockBankConsole } from '../bank/MockBankConsole';
import { TaraLogo } from '../common/TaraLogo';
import { useDerivedState } from '../../context/DerivedStateContext';

interface TopBarProps {
  isTaraOpen?: boolean;
  onToggleTara?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isTaraOpen = true, onToggleTara }) => {
  const navigate = useNavigate();
  const { state } = useDerivedState();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBankSimulator, setShowBankSimulator] = useState(false);

  const handleReset = async () => {
    if (window.confirm('Reset sandbox demo state to default clean ledger?')) {
      try {
        await fetch('/api/reset', { method: 'POST' });
        toast.success('Sandbox demo state reset successfully');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        toast.error('Failed to reset demo state');
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#2C3426]/10 flex items-center px-6 shrink-0 w-full justify-between sticky top-0 z-30 select-none">
      
      {/* Left: Origin-Style Clean Brand & Merchant Badge */}
      <div className="flex items-center gap-4">
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate('/home')}
          title="Return to Dashboard"
        >
          <TaraLogo size="md" showSubtitle={true} />
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[#2C3426]/10 text-xs text-[#5E625A]">
          <span className="font-bold text-[#151615]">Paytm for Business</span>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
            Verified
          </span>
        </div>
      </div>

      {/* Center: Clean Status Indicator (Origin Style Minimalist) */}
      <div className="hidden lg:flex items-center gap-3 text-xs">
        <span className="font-semibold text-[#5E625A]">
          Store Operations Workspace
        </span>
        <span className="w-1 h-1 rounded-full bg-[#5E625A]/40" />
        <span className="font-bold text-[#151615] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SB-4421 Live</span>
        </span>
      </div>

      {/* Right Side: Clean Origin-Style Action Cluster */}
      <div className="flex items-center gap-2.5">
        
        {/* Dedicated Separate Mobile App Link */}
        <a
          href="/mobile"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold bg-[#FAF9F5] hover:bg-[#F1F5F9] text-[#002970] border border-[#2C3426]/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all"
          title="Open Dedicated Mobile App View (/mobile)"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00BAF2]" />
          <span>Mobile App (/mobile)</span>
        </a>

        {/* Action: Mock Bank Simulator */}
        <button
          onClick={() => setShowBankSimulator(true)}
          className="text-xs font-bold bg-[#151615] hover:bg-black text-[#FAF9F5] transition-all px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs"
          title="Open Mock Bank Core Server"
        >
          <Landmark className="w-3.5 h-3.5 text-[#FE8A70]" />
          <span>Core Bank</span>
        </button>

        {/* Toggle Tara AI Teammate Panel */}
        <button
          onClick={() => {
            if (onToggleTara) onToggleTara();
            else window.dispatchEvent(new CustomEvent('tara:toggle_panel'));
          }}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs ${
            isTaraOpen 
              ? 'bg-[#FE8A70]/15 text-[#151615] border border-[#FE8A70]/40' 
              : 'bg-white hover:bg-[#FAF9F5] text-[#151615] border border-[#2C3426]/15'
          }`}
          title={isTaraOpen ? "Close Tara Side Chat" : "Open Tara Side Chat"}
          aria-label={isTaraOpen ? "Close Tara Side Chat" : "Open Tara Side Chat"}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FA7F62]" />
          <span>{isTaraOpen ? 'Close Tara' : 'Ask Tara'}</span>
        </button>

        {/* Security & Trust Center */}
        <button
          onClick={() => navigate('/security')}
          className="text-xs font-semibold text-[#5E625A] hover:text-[#151615] hover:bg-[#FAF9F5] border border-transparent hover:border-[#2C3426]/10 transition-all p-2 rounded-xl"
          title="Security & Trust Center"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </button>

        {/* Reset State */}
        <button 
          onClick={handleReset}
          className="text-xs font-semibold text-[#5E625A] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all p-2 rounded-xl"
          title="Reset sandbox state"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-[#2C3426]/10"></div>
        
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="p-2 rounded-xl text-[#5E625A] hover:text-[#151615] hover:bg-[#FAF9F5] relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></div>
          </button>
          
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#2C3426]/10 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-[#2C3426]/10 flex justify-between items-center">
                <span className="font-bold text-xs text-[#151615]">Notifications</span>
                <span className="text-[11px] text-[#FA7F62] font-semibold cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#2C3426]/5 text-xs">
                <div className="px-4 py-3 hover:bg-[#FAF9F5] cursor-pointer flex gap-3 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#151615]">Morning T+0 Settlement Complete</div>
                    <div className="text-[11px] text-[#5E625A] mt-0.5">₹42,500.00 credited to HDFC Bank A/c •••• 1111 at 06:00 AM.</div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-[#FAF9F5] cursor-pointer flex gap-3 items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#151615]">Soundbox Audio Re-sync Verified</div>
                    <div className="text-[11px] text-[#5E625A] mt-0.5">Device SB-4421 reconnected and test chime completed in 142ms.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Merchant User Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-[#FAF9F5] transition-colors border border-transparent hover:border-[#2C3426]/10"
          >
            <div className="w-7 h-7 rounded-lg bg-[#2C3426] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              RK
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-[#151615] leading-none">{state.business_name}</div>
              <div className="text-[10px] text-[#5E625A] font-medium leading-none mt-1">{state.owner_name} · Owner</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#5E625A]" />
          </button>

          {showProfile && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#2C3426]/10 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
              <div className="px-4 py-2 border-b border-[#2C3426]/10">
                <div className="font-bold text-[#151615]">{state.business_name}</div>
                <div className="text-[11px] text-[#5E625A] font-mono">MID: {state.merchant_id}</div>
              </div>
              <div className="py-1">
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-full text-left px-4 py-2 hover:bg-[#FAF9F5] text-[#151615] font-medium flex items-center justify-between"
                >
                  <span>Store Settings</span>
                </button>
                <button 
                  onClick={() => navigate('/security')}
                  className="w-full text-left px-4 py-2 hover:bg-[#FAF9F5] text-[#151615] font-medium flex items-center justify-between"
                >
                  <span>Security & Access</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </button>
                <button 
                  onClick={() => navigate('/integration')}
                  className="w-full text-left px-4 py-2 hover:bg-[#FAF9F5] text-[#151615] font-medium flex items-center justify-between"
                >
                  <span>Paytm API Docs</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#FA7F62]" />
                </button>
              </div>
              <div className="pt-1 border-t border-[#2C3426]/10">
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Mock Bank Simulator Modal */}
      {showBankSimulator && (
        <MockBankConsole isOpen={showBankSimulator} onClose={() => setShowBankSimulator(false)} />
      )}

    </header>
  );
};
