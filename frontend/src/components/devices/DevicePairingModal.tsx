import React, { useState } from 'react';
import { 
  QrCode, CheckCircle2, X, Smartphone, 
  RefreshCw, ShieldCheck, ExternalLink, ArrowRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DevicePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevicePaired?: (newDevice: any) => void;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({ 
  isOpen, 
  onClose,
  onDevicePaired 
}) => {
  const [activeTab, setActiveTab] = useState<'qr_scan' | 'manual_code'>('qr_scan');
  const [claimCode, setClaimCode] = useState('SB-7701');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClaim = () => {
    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setIsSuccess(true);
      toast.success('Demo soundbox paired successfully!');

      if (onDevicePaired) {
        onDevicePaired({
          id: 'SB-DEMO-7701',
          name: 'Paytm Soundbox Pro (Simulated)',
          type: 'Demo soundbox (simulated)',
          battery_pct: 88,
          network: 'Airtel 4G IoT Dual SIM',
          status: 'ONLINE',
          last_ping_iso: new Date().toISOString(),
          firmware: 'v4.2.1-prod'
        });
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#FAF9F5] border border-[#2C3426]/20 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-[#151615]">
        
        {/* Header */}
        <div className="p-5 pb-4 border-b border-[#2C3426]/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FE8A70]/20 text-[#151615] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#FE8A70]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#151615]">Pair Demo Soundbox</h2>
              <p className="text-[11px] text-[#151615]/60 font-medium">
                Tara v7 Live Device Telemetry & QR Pairing
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#151615]/60 hover:text-[#151615] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 p-1 bg-[#2C3426]/5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('qr_scan')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'qr_scan' 
                  ? 'bg-white text-[#151615] shadow-xs' 
                  : 'text-[#151615]/60 hover:text-[#151615]'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Live QR Scan Mode
            </button>
            <button
              onClick={() => setActiveTab('manual_code')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'manual_code' 
                  ? 'bg-white text-[#151615] shadow-xs' 
                  : 'text-[#151615]/60 hover:text-[#151615]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Enter Claim Code
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'qr_scan' ? (
            <div className="flex flex-col items-center">
              
              {/* High-Contrast SVG QR Code Representation */}
              <div className="relative p-4 bg-white rounded-2xl border-2 border-[#2C3426]/15 shadow-sm">
                <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Top-left marker */}
                  <rect x="10" y="10" width="46" height="46" rx="8" fill="#151615" />
                  <rect x="18" y="18" width="30" height="30" rx="4" fill="white" />
                  <rect x="25" y="25" width="16" height="16" rx="2" fill="#FE8A70" />

                  {/* Top-right marker */}
                  <rect x="124" y="10" width="46" height="46" rx="8" fill="#151615" />
                  <rect x="132" y="18" width="30" height="30" rx="4" fill="white" />
                  <rect x="139" y="25" width="16" height="16" rx="2" fill="#FE8A70" />

                  {/* Bottom-left marker */}
                  <rect x="10" y="124" width="46" height="46" rx="8" fill="#151615" />
                  <rect x="18" y="132" width="30" height="30" rx="4" fill="white" />
                  <rect x="25" y="139" width="16" height="16" rx="2" fill="#FE8A70" />

                  {/* Matrix grid cells */}
                  <rect x="66" y="14" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="88" y="14" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="102" y="28" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="66" y="42" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="18" y="66" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="36" y="80" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="66" y="66" width="16" height="16" rx="3" fill="#002E6E" />
                  <rect x="98" y="66" width="16" height="16" rx="3" fill="#00BAF2" />
                  <rect x="66" y="98" width="16" height="16" rx="3" fill="#00BAF2" />
                  <rect x="98" y="98" width="16" height="16" rx="3" fill="#002E6E" />
                  <rect x="132" y="66" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="150" y="80" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="18" y="102" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="124" y="124" width="14" height="14" rx="2" fill="#151615" />
                  <rect x="148" y="138" width="14" height="14" rx="2" fill="#151615" />
                  <rect x="66" y="144" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="90" y="132" width="12" height="12" rx="2" fill="#151615" />
                  <rect x="102" y="150" width="12" height="12" rx="2" fill="#151615" />

                  {/* Center Brand Badge */}
                  <circle cx="90" cy="90" r="14" fill="#151615" />
                  <text x="90" y="94" textAnchor="middle" fill="#FE8A70" fontSize="10" fontWeight="bold">T</text>
                </svg>

                {/* Scanning Laser Animation */}
                <div className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-[#FE8A70] to-transparent animate-bounce opacity-80" />
              </div>

              <div className="mt-4 text-center">
                <span className="text-xs font-bold text-[#151615]">
                  Scan with your phone to open the Demo Soundbox
                </span>
                <p className="text-[11px] text-[#151615]/60 mt-0.5">
                  Or launch it directly in a second tab to test audio announcements:
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-2.5 mt-4">
                <a
                  href="/soundbox"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-[#2C3426]/5 border border-[#2C3426]/15 text-xs font-bold text-[#151615] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#FE8A70]" />
                  Open /soundbox
                </a>

                <button
                  onClick={handleClaim}
                  disabled={isClaiming || isSuccess}
                  className="py-2.5 px-3 rounded-xl bg-[#FE8A70] hover:bg-[#FA7F62] text-[#151615] text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                      Paired!
                    </>
                  ) : isClaiming ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Verifying Token...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Pair This Soundbox
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#151615] block mb-1">
                  Single-Use Device Claim Code
                </label>
                <input
                  type="text"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SB-7701"
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#2C3426]/20 font-mono text-base font-bold text-[#151615] tracking-widest focus:outline-none focus:border-[#FE8A70]"
                />
                <p className="text-[11px] text-[#151615]/60 mt-1">
                  Printed on the bottom sticker of your Demo soundbox hardware casing.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FE8A70]/10 border border-[#FE8A70]/20 text-[11px] text-[#151615]/80 space-y-1">
                <div className="font-bold text-[#151615]">Security & Invariant Rules:</div>
                <div>• Single-use opaque token (Rule 38)</div>
                <div>• Auto-invalidated upon binding to merchant</div>
                <div>• Model explicitly registered as "Demo soundbox (simulated)"</div>
              </div>

              <button
                onClick={handleClaim}
                disabled={isClaiming || isSuccess}
                className="w-full py-3 rounded-xl bg-[#FE8A70] hover:bg-[#FA7F62] text-[#151615] font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                    Paired to Store!
                  </>
                ) : isClaiming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Binding Device to Ledger...
                  </>
                ) : (
                  <>
                    Claim Soundbox <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-[#2C3426]/10 bg-white/50 text-[10px] text-[#151615]/50 flex justify-between items-center font-mono">
          <span>TOKEN: PAIR-DEMO-7701</span>
          <span>EXPIRES: 14m 59s</span>
        </div>

      </div>
    </div>
  );
};
