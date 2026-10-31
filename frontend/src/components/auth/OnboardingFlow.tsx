import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, ArrowRight, ShieldCheck, ArrowLeft, Landmark, Plus } from 'lucide-react';
import { WelcomeHero, type SupportedLanguage } from './WelcomeHero';
import { MockBankConsole, type BankAccount } from '../bank/MockBankConsole';

interface OnboardingFlowProps {
  onLogin: () => void;
}

const MOCK_CARDS = [
  { id: '1', name: 'Rahul Sharma', number: '4111 1111 1111 1111', bank: 'HDFC Bank' },
  { id: '2', name: 'Sneha Gupta', number: '5555 5555 5555 4444', bank: 'ICICI Bank' },
  { id: '3', name: 'Ankit Verma', number: '4222 2222 2222 2222', bank: 'SBI' },
  { id: '4', name: 'Priya Desai', number: '6011 0000 0000 0000', bank: 'Axis Bank' }
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onLogin }) => {
  const [step, setStep] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('mode=onboarding')) {
      return 1;
    }
    return 0;
  }); // 0: Welcome Screen, 1: Mobile Phone, 2: Select Profile, 3: Verify OTP
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [phone, setPhone] = useState('');
  const [, setSelectedCard] = useState<string | null>(null);
  const [liveAccounts, setLiveAccounts] = useState<BankAccount[]>([]);
  const [isBankConsoleOpen, setIsBankConsoleOpen] = useState(false);
  
  // Fetch live bank accounts from mock server
  useEffect(() => {
    fetch('/api/bank/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts?.length > 0) {
          setLiveAccounts(data.accounts);
        }
      })
      .catch((err) => console.log('Mock bank offline or unreachable:', err));
  }, [isBankConsoleOpen]);
  
  // OTP State
  const [otp] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [smsInfo, setSmsInfo] = useState<{ isRealAws: boolean; gateway: string; awsError?: string } | null>(null);

  useEffect(() => {
    if (step === 3 && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      // Dispatch real SMS OTP via AWS SNS
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      fetch('/api/sms/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          message: `Your Tara AI Teammate login verification code is ${otp}. Valid for 10 minutes.`
        })
      })
      .then(res => res.json())
      .then(data => {
        setSmsInfo({
          isRealAws: Boolean(data.is_real_aws),
          gateway: data.gateway || 'Simulated Gateway',
          awsError: data.aws_error
        });
      })
      .catch(err => console.warn('SMS OTP dispatch error:', err));

      setStep(2);
    }
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCard(cardId);
    setStep(3);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...enteredOtp];
    newOtp[index] = value;
    setEnteredOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.join('').length === 6) {
      if (newOtp.join('') === otp) {
        setTimeout(onLogin, 500);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const [landingMode, setLandingMode] = useState<'3d-robot' | 'split-hero'>(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    if (search.includes('landing=3d')) return '3d-robot';
    return 'split-hero';
  });

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'LAUNCH_TARA' || e.data?.type === 'LAUNCH_NOVA') {
        setStep(1);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Step 0: Welcome / Landing Page (Defaults to 3D Ceramic Robot)
  if (step === 0) {
    if (landingMode === '3d-robot') {
      return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
          <iframe
            src="/robot-landing.html"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
            title="NOVA AGENT — 3D Robot Landing"
          />
          {/* Quick toggle to split-hero or direct launch */}
          <div
            style={{
              position: 'fixed',
              bottom: '18px',
              left: '18px',
              zIndex: 100,
              display: 'flex',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '6px 14px',
                background: '#141414',
                color: '#FAF9F5',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              Enter Merchant App →
            </button>
            <button
              type="button"
              onClick={() => setLandingMode('split-hero')}
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '6px 12px',
                background: 'rgba(239, 236, 230, 0.92)',
                color: '#141414',
                border: '1px solid rgba(20,20,20,0.25)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="Switch to 2D split hero"
            >
              View 2D Split Hero
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        <WelcomeHero
          onGetStarted={() => setStep(1)}
          currentLang={lang}
          onLanguageChange={setLang}
        />
        <div style={{ position: 'fixed', bottom: '18px', right: '18px', zIndex: 100 }}>
          <button
            type="button"
            onClick={() => setLandingMode('3d-robot')}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '6px 12px',
              background: '#141414',
              color: '#FAF9F5',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            ← Back to 3D Robot Landing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-ground)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {step === 3 && (
        <aside
          role="status"
          aria-label="Demo OTP Verification Code"
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#151615',
            color: '#FAF9F5',
            padding: '10px 20px',
            borderRadius: '100px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '92vw',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(250, 127, 98, 0.18)',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(250, 127, 98, 0.4)',
              color: '#FF9B85',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            <ShieldCheck size={14} color="#FF7E62" />
            <span>DEMO TEST MODE</span>
          </div>

          <span style={{ color: '#FAF9F5', fontSize: '0.875rem', fontWeight: 500 }}>
            Your 6-digit test OTP:
          </span>

          <span
            className="tracking-widest"
            style={{
              backgroundColor: '#FA7F62',
              color: '#151615',
              padding: '4px 14px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '0.22em',
              fontFamily: 'var(--font-mono, monospace)',
              boxShadow: '0 2px 10px rgba(250, 127, 98, 0.4)',
            }}
          >
            {otp}
          </span>
        </aside>
      )}

      <div style={{ width: '100%', maxWidth: '440px', boxSizing: 'border-box' }}>
        {/* Back button */}
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          style={{
            background: 'none',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-ink-soft)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            cursor: 'pointer',
            marginBottom: 'var(--space-4)',
            padding: '6px 0',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-ink)',
            }}
          >
            <span>Tara</span>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-cta)',
                display: 'inline-block',
              }}
            />
          </div>
          <h1
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-ink)',
              margin: '8px 0 4px',
            }}
          >
            {step === 1 && 'Enter Mobile Number'}
            {step === 2 && 'Select Demo Account'}
            {step === 3 && 'Verify OTP'}
          </h1>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-ink-soft)',
              margin: 0,
            }}
          >
            {step === 1 && 'We will send a 6-digit verification code.'}
            {step === 2 && 'Choose a profile to preview store operations.'}
            {step === 3 && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-ink-soft)' }}>
                  Enter the 6-digit verification code for +91 {phone}
                </span>
                {smsInfo?.isRealAws ? (
                  <div style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '8px', backgroundColor: '#E8F5E9', border: '1px solid #C8E6C9', color: '#145A19', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>✅ Live SMS dispatched via AWS SNS to +91 {phone}</span>
                  </div>
                ) : (
                  <div style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '8px', backgroundColor: '#FFF8E1', border: '1px solid #FFE082', color: '#6B4700', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚡ Verification code generated · Test OTP: {otp}</span>
                  </div>
                )}
              </div>
            )}
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(21, 22, 21, 0.08)',
            padding: '28px 24px',
            boxSizing: 'border-box',
          }}
        >
          {step === 1 && (
            <form onSubmit={handlePhoneSubmit}>
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--color-panel-card)',
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'rgba(21, 22, 21, 0.04)',
                      color: 'var(--color-ink)',
                      fontWeight: 'var(--weight-semibold)',
                      borderRight: '1px solid var(--color-panel-border)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10 digit number"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--color-ink)',
                      fontWeight: 'var(--weight-medium)',
                      fontSize: 'var(--text-base)',
                    }}
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={phone.length < 10}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-cta)',
                  color: 'var(--color-cta-text)',
                  padding: '14px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 'var(--weight-semibold)',
                  fontSize: 'var(--text-base)',
                  border: 'none',
                  cursor: phone.length >= 10 ? 'pointer' : 'not-allowed',
                  opacity: phone.length >= 10 ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color var(--duration-fast)',
                }}
              >
                <span>Continue</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* Simulator Action Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(254, 138, 112, 0.15)',
                  borderRadius: '10px',
                  border: '1px solid rgba(250, 127, 98, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Landmark size={15} color="#D95436" />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#151615' }}>
                    Live Bank Core Running
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBankConsoleOpen(true)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#151615',
                    color: '#FAF9F5',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={11} />
                  <span>Create Bank A/C</span>
                </button>
              </div>

              {/* Render either live accounts or fallback cards */}
              {(liveAccounts.length > 0 ? liveAccounts : MOCK_CARDS).map((acc: any) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleCardSelect(acc.id)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--color-panel-card)',
                    border: '1px solid var(--color-panel-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    transition: 'border-color var(--duration-fast)',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(250, 127, 98, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CreditCard size={20} color="#D95436" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-ink)', fontSize: 'var(--text-sm)' }}>
                      {acc.name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)' }}>
                      {acc.account_number || acc.number}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-coral-deep)', fontWeight: 'var(--weight-medium)' }}>
                        {acc.bank_name || acc.bank}
                      </span>
                      {acc.current_balance !== undefined && (
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-ink)' }}>
                          ₹{acc.current_balance.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 'var(--weight-bold)',
                      backgroundColor: 'rgba(21, 22, 21, 0.08)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-ink-soft)',
                    }}
                  >
                    LIVE DEMO
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: 'var(--space-6)',
                }}
              >
                {enteredOtp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    style={{
                      width: '46px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: '#151615',
                      backgroundColor: '#FFFFFF',
                      border: digit ? '2px solid #FA7F62' : '2px solid rgba(21, 22, 21, 0.35)',
                      borderRadius: '12px',
                      outline: 'none',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const chars = otp.split('');
                    setEnteredOtp(chars);
                    if (otp.length === 6) {
                      setTimeout(() => {
                        onLogin();
                      }, 250);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    backgroundColor: '#FA7F62',
                    color: '#151615',
                    border: 'none',
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(250, 127, 98, 0.35)',
                  }}
                >
                  ⚡ Auto-Fill Test OTP ({otp})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEnteredOtp(['', '', '', '', '', '']);
                    otpRefs.current[0]?.focus();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-coral-deep)',
                    cursor: 'pointer',
                  }}
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Mock Bank Simulator Action Button */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100 }}>
        <button
          type="button"
          onClick={() => setIsBankConsoleOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#151615',
            color: '#FAF9F5',
            padding: '10px 16px',
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: 700,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
          title="Open Mock Bank Core Server & Real-time Scenario Simulator"
        >
          <Landmark size={16} color="#FE8A70" />
          <span>🏦 Mock Bank Simulator</span>
          <span
            style={{
              backgroundColor: '#145A19',
              color: '#FFFFFF',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
            }}
          >
            Live Core
          </span>
        </button>
      </div>

      {/* Mock Bank Simulator Modal */}
      <MockBankConsole
        isOpen={isBankConsoleOpen}
        onClose={() => setIsBankConsoleOpen(false)}
        selectedAccountId={liveAccounts[0]?.id}
        initialPhone={phone}
      />
    </div>
  );
};
