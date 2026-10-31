import React, { useState } from 'react';
import { 
  Building2, CreditCard, Bell, Globe, 
  RotateCcw, LogOut, CheckCircle2, Shield
} from 'lucide-react';

export const Settings: React.FC = () => {
  // Toggles state
  const [realSmsEnabled, setRealSmsEnabled] = useState(() => localStorage.getItem('TARA_REAL_SMS') !== 'false');
  const [smsStatus, setSmsStatus] = useState<string>('');
  const [settlementAlerts, setSettlementAlerts] = useState(true);
  const [disputeAlerts, setDisputeAlerts] = useState(true);
  const [offerAlerts, setOfferAlerts] = useState(false);
  
  // Language state
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');

  const handleLogout = () => {
    sessionStorage.setItem('tara_logged_out', 'true');
    window.location.href = '/';
  };

  const handleResetDemo = () => {
    // Clear local storage and reload to completely reset the demo state
    localStorage.clear();
    window.location.href = '/';
  };

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${checked ? 'bg-paytm-blue' : 'bg-soft-border/50'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white-panel rounded-full transition-all ${checked ? 'right-1' : 'left-1'}`}></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pb-10">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2">Settings</h1>
        <p className="text-navy/70">Manage your store profile, preferences, and demo controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* PROFILE SECTION */}
          <div className="bg-white-panel rounded-xl shadow-sm border border-soft-border p-6">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2 mb-4 border-b border-soft-border pb-3">
              <Building2 className="w-5 h-5 text-navy/50" /> Store Profile
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-navy/50 uppercase">Business Name</p>
                <p className="text-sm font-bold text-navy">Sharma Electronics & Mobile Accessories</p>
              </div>
              <div>
                <p className="text-xs font-bold text-navy/50 uppercase">Merchant ID (MID)</p>
                <p className="text-sm font-mono text-navy/80">PAYTM_SHARMA_9982</p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-navy/50 uppercase">KYC Status</p>
                  <p className="text-sm text-navy/80">PAN: ABCP****4J</p>
                </div>
                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              </div>
            </div>
          </div>

          {/* BANK ACCOUNTS */}
          <div className="bg-white-panel rounded-xl shadow-sm border border-soft-border p-6">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2 mb-4 border-b border-soft-border pb-3">
              <CreditCard className="w-5 h-5 text-navy/50" /> Linked Bank Accounts
            </h2>
            
            <div className="bg-light-bg border border-soft-border rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white-panel rounded-full flex items-center justify-center border border-soft-border">
                  <Building2 className="w-5 h-5 text-navy/40" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy">HDFC Bank</p>
                  <p className="text-xs font-mono text-navy/60">XXXX XXXX 4021</p>
                </div>
              </div>
              <span className="bg-paytm-blue/10 text-paytm-blue text-[10px] px-2 py-1 rounded-md uppercase tracking-wider font-bold">
                Primary
              </span>
            </div>
            
            <button className="mt-4 text-sm font-bold text-paytm-blue hover:underline">
              + Add another bank account
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* LANGUAGE & PREFERENCES */}
          <div className="bg-white-panel rounded-xl shadow-sm border border-soft-border p-6">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2 mb-4 border-b border-soft-border pb-3">
              <Globe className="w-5 h-5 text-navy/50" /> Language & Preferences
            </h2>
            
            <div className="mb-6">
              <p className="text-sm font-bold text-navy mb-3">App Language</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setLanguage('EN')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors border ${language === 'EN' ? 'bg-paytm-blue/10 border-paytm-blue text-paytm-blue' : 'border-soft-border text-navy/60 hover:bg-light-bg'}`}
                >
                  English (EN)
                </button>
                <button 
                  onClick={() => setLanguage('HI')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors border ${language === 'HI' ? 'bg-paytm-blue/10 border-paytm-blue text-paytm-blue' : 'border-soft-border text-navy/60 hover:bg-light-bg'}`}
                >
                  हिंदी (HI)
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-navy mb-3 flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-navy/80">Daily Settlement Alerts</span>
                  <Toggle checked={settlementAlerts} onChange={() => setSettlementAlerts(!settlementAlerts)} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-navy/80">Dispute & Chargeback Alerts</span>
                  <Toggle checked={disputeAlerts} onChange={() => setDisputeAlerts(!disputeAlerts)} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-navy/80">Offers & Loans Promotions</span>
                  <Toggle checked={offerAlerts} onChange={() => setOfferAlerts(!offerAlerts)} />
                </div>
              </div>
            </div>
          </div>

          {/* DEMO CONTROLS */}
          <div className="bg-white-panel rounded-xl shadow-sm border border-soft-border p-6">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2 mb-4 border-b border-soft-border pb-3">
              <Shield className="w-5 h-5 text-navy/50" /> Demo & Security
            </h2>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-navy flex items-center gap-2">
                  Send real SMS OTP 
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">AWS Connected</span>
                </h3>
                <p className="text-sm text-navy/60 mt-1">
                  AWS IAM / SNS Gateway (us-east-1) configured. Real SMS OTP & mobile alerts enabled.
                </p>
                {smsStatus && (
                  <p className="text-xs font-semibold text-emerald-700 mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    {smsStatus}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Toggle 
                  checked={realSmsEnabled} 
                  onChange={() => {
                    const next = !realSmsEnabled;
                    setRealSmsEnabled(next);
                    localStorage.setItem('TARA_REAL_SMS', String(next));
                  }} 
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setSmsStatus('Dispatching test SMS...');
                      const res = await fetch('http://localhost:8000/api/sms/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          phoneNumber: '+919876543210',
                          message: 'Tara Merchant Teammate Test SMS: Your Soundbox and store settlements are fully active.'
                        })
                      });
                      const data = await res.json();
                      setSmsStatus(`✅ SMS Dispatched (${data.gateway} - ID: ${data.message_id})`);
                    } catch (e) {
                      setSmsStatus('SMS Gateway Error: ' + e);
                    }
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline mt-1"
                >
                  Send Test SMS
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-soft-border">
              <button 
                onClick={handleResetDemo}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-soft-border text-sm font-bold text-navy hover:bg-light-bg transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset Demo State
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-sm font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
