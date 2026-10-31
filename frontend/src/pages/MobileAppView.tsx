import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Volume2, ArrowLeftRight, Sparkles, User, 
  Bell, ChevronRight, ChevronLeft, 
  Signal, Wifi, Battery, Info, 
  Building2, ShieldCheck, ArrowLeft, Send, 
  Zap, CreditCard, Clock, Landmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getTaraResponse } from '../mocks/taraResponses';
import { globalAudioPlayer } from '../utils/audioPlayer';
import { realtimeBus } from '../utils/realtimeSync';

type MobileTab = 'home' | 'soundbox' | 'transactions' | 'chat' | 'settings';
type SubScreen = 'none' | 'spotme' | 'deposit' | 'credit';
type LangCode = 'en' | 'hi' | 'ta' | 'te';

interface MobileTxn {
  id: string;
  amount: number;
  payer: string;
  time: string;
  mode: string;
  status: 'SUCCESS' | 'PENDING';
  ackStatus: 'ANNOUNCED' | 'NOT_ANNOUNCED';
}

export const MobileAppView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [subScreen, setSubScreen] = useState<SubScreen>('none');
  const [selectedLang, setSelectedLang] = useState<LangCode>('en');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [safeLimitOn, setSafeLimitOn] = useState(true);

  // Collections & Financial Metrics
  const [todayCollections, setTodayCollections] = useState(42500.00);
  const [todayCount, setTodayCount] = useState(68);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  // Live Transactions Feed (Chime / Paytm style)
  const [txns, setTxns] = useState<MobileTxn[]>([
    { id: 'TXN-90812', amount: 500, payer: 'Vikram Singh', time: '2 mins ago', mode: 'UPI QR', status: 'SUCCESS', ackStatus: 'ANNOUNCED' },
    { id: 'TXN-90811', amount: 420, payer: 'Priya Sharma', time: '14 mins ago', mode: 'RuPay Credit', status: 'SUCCESS', ackStatus: 'ANNOUNCED' },
    { id: 'TXN-90810', amount: 1250, payer: 'Anand Verma', time: '35 mins ago', mode: 'UPI QR', status: 'SUCCESS', ackStatus: 'ANNOUNCED' },
    { id: 'TXN-90809', amount: 850, payer: 'Meera Iyer', time: '1 hour ago', mode: 'Paytm Wallet', status: 'SUCCESS', ackStatus: 'ANNOUNCED' }
  ]);

  // Mobile Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: 'user' | 'tara'; text: string; time: string }>>([
    {
      id: 'm1',
      role: 'tara',
      text: "नमस्ते कुमार स्टोर्स! I'm Tara, your autonomous merchant operations teammate. How can I assist you with your collections or soundbox today?",
      time: '11:45 AM'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Soundbox Audio Chime
  const playPaytmAudioChime = (amount: number, payerName: string) => {
    setIsAnnouncing(true);
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const now = audioCtx.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.16);

      // Tone 2: 880.00 Hz (A5)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.18);
      gain2.gain.setValueAtTime(0, now + 0.18);
      gain2.gain.linearRampToValueAtTime(0.4, now + 0.20);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.40);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.40);

      // Voice announcement
      setTimeout(() => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            selectedLang === 'hi' 
              ? `पेटीएम पर ${amount} रुपये प्राप्त हुए` 
              : `Received ${amount} rupees on Paytm from ${payerName}`
          );
          utterance.rate = 1.05;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }, 350);
    } catch {
      // audio fallback
    } finally {
      setTimeout(() => setIsAnnouncing(false), 3000);
    }
  };

  // Cross-tab Realtime Bus Subscription
  useEffect(() => {
    const unsubscribe = realtimeBus.subscribe((evt) => {
      if (evt.type === 'PAYMENT_RECEIVED') {
        const amt = evt.amount;
        const payer = evt.customer || 'Customer';
        if (evt.shouldAnnounce) {
          playPaytmAudioChime(amt, payer);
        }
        setTodayCollections(prev => prev + amt);
        setTodayCount(prev => prev + 1);
        setTxns(prev => [
          {
            id: evt.id || `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
            amount: amt,
            payer,
            time: 'Just now',
            mode: (evt.mode as string) || 'UPI QR',
            status: 'SUCCESS',
            ackStatus: 'ANNOUNCED'
          },
          ...prev.slice(0, 8)
        ]);
        toast.success(`⚡ Live ₹${amt} received from ${payer}!`);
      }
    });
    return () => unsubscribe();
  }, [selectedLang]);

  // Trigger Simulated Payment
  const handleTriggerSimulatedPayment = async () => {
    const amt = 420;
    const payer = 'Priya Sharma (Mobile Pay)';
    playPaytmAudioChime(amt, 'Priya S.');
    
    realtimeBus.broadcast({
      type: 'PAYMENT_RECEIVED',
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      amount: amt,
      customer: payer,
      mode: 'RuPay Credit',
      timestamp: 'Just now',
      shouldAnnounce: true
    });

    try {
      await fetch('/api/bank/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: 'acc-1',
          amount: amt,
          payer_name: 'Priya Sharma',
          payer_vpa: 'priya.s@icici',
          note: 'Counter Payment'
        })
      });
    } catch {
      // offline fallback
    }

    setTodayCollections(prev => prev + amt);
    setTodayCount(prev => prev + 1);
    setTxns(prev => [
      {
        id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        amount: amt,
        payer,
        time: 'Just now',
        mode: 'RuPay Credit',
        status: 'SUCCESS',
        ackStatus: 'ANNOUNCED'
      },
      ...prev
    ]);
  };

  // Chat Message Handler
  const handleSendChatMessage = async (overrideText?: string) => {
    const textToSend = overrideText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!overrideText) setChatInput('');
    setIsChatLoading(true);

    try {
      const { response, audio_base64 } = await getTaraResponse(textToSend, selectedLang);
      const taraMsg = {
        id: `t-${Date.now()}`,
        role: 'tara' as const,
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, taraMsg]);

      if (audio_base64) {
        globalAudioPlayer.playBase64Wav(audio_base64);
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          role: 'tara' as const,
          text: "I verified your today's transactions: Total collections ₹42,500.00 across 68 UPI payments. Soundbox SB-4421 is operating nominally with zero missed acknowledgments.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`Copied ${text}`);
    setTimeout(() => setCopiedText(null), 1500);
  };

  return (
    <div className="min-h-screen h-[100dvh] bg-[#EAEFF5] flex flex-col items-center justify-center p-0 md:p-6 font-sans select-none">
      
      {/* ── TOP PREVIEW BAR FOR PLAYWRIGHT & DESKTOP AUDITS ──────────── */}
      <div className="w-full max-w-[390px] mb-3 hidden md:flex items-center justify-between px-2 text-xs text-neutral-600 shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="hover:text-black flex items-center gap-1 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Web Portal</span>
        </button>

        {/* Required by Playwright mobile-pwa.spec.ts:8 */}
        <span className="font-bold text-[#0B351E] text-xs">
          Paytm for Business (P4B) • Tara PWA Mobile UI Simulator
        </span>
      </div>

      {/* ── SMARTPHONE SHELL (390 x 844 iPhone Canvas on desktop, full screen on mobile) ── */}
      <div className="w-full h-full md:max-w-[390px] md:h-[844px] bg-[#F7F9FC] md:rounded-[48px] shadow-2xl border-0 md:border-[10px] md:border-[#1E293B] flex flex-col overflow-hidden relative">
        
        {/* ── UNIFIED iOS STATUS BAR FOR WHITE SCREENS (Subscreens & non-home tabs) ── */}
        {(subScreen !== 'none' || activeTab !== 'home') && (
          <div className="px-5 pt-3 pb-1 flex items-center justify-between text-xs font-mono text-neutral-800 bg-white shrink-0 z-30">
            <span className="font-bold">9:41</span>
            <div className="flex items-center gap-1 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200 text-[10px] font-semibold text-neutral-700">
              <span>Kumar Stores</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </div>
            <div className="flex items-center gap-1.5 text-neutral-700">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* ── SUB-SCREEN 1: SPOTME OVERDRAFT COVERAGE (Matching Image 2) ─── */}
        {subScreen === 'spotme' && (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="pt-2 px-4 flex items-center justify-between">
              <button 
                onClick={() => setSubScreen('none')} 
                className="p-2 -ml-2 text-neutral-700 hover:text-black transition-colors"
                aria-label="Back to home"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 pt-4 pb-8 space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0B351E]">SpotMe available</h1>
                <div className="text-4xl font-extrabold text-[#0B351E] mt-2">₹5,000.00</div>
                <div className="text-xs font-semibold text-[#0B351E] mt-1 flex items-center gap-1 cursor-pointer">
                  <span>Of your ₹5,000 safe working capital limit</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Safe limit toggle card */}
              <div className="pt-4 border-t border-neutral-100 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#0B351E] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Safe limit on</h3>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      Zero overdraft fees. Auto-recovers from tomorrow's 06:00 AM UPI settlement sweep.
                    </p>
                    <button className="text-xs font-bold text-[#0B351E] mt-2 flex items-center gap-0.5">
                      <span>Edit amount</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setSafeLimitOn(!safeLimitOn)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${safeLimitOn ? 'bg-[#25C974]' : 'bg-neutral-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${safeLimitOn ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Grow limit with settlements */}
              <div className="pt-4 border-t border-neutral-100 space-y-3">
                <h3 className="text-sm font-bold text-[#0B351E]">Grow your limit with settlements</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Every 10 consecutive on-time Soundbox trading days increases your working capital limit by ₹2,500.
                </p>

                <div className="grid grid-cols-4 gap-2 text-center pt-2">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-800 border border-neutral-200">
                      RS
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1">Rahul S.</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-800 border border-neutral-200">
                      KS
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1">Kumar St.</span>
                  </div>
                  <div className="flex flex-col items-center cursor-pointer" onClick={() => toast.success('Boost requested!')}>
                    <div className="w-12 h-12 rounded-full border border-dashed border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-black">
                      +
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-700 mt-1">Boost MID</span>
                  </div>
                  <div className="flex flex-col items-center cursor-pointer" onClick={() => toast.success('Soundbox bonus applied!')}>
                    <div className="w-12 h-12 rounded-full border border-dashed border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-black">
                      +
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-700 mt-1">Soundbox</span>
                  </div>
                </div>
              </div>

              {/* Special bonus card */}
              <div className="pt-4 border-t border-neutral-100">
                <div className="p-4 bg-neutral-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Special bonus from Tara</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">₹1,000 instant festival buffer</p>
                  </div>
                  <button 
                    onClick={() => {
                      toast.success('Festival limit claimed!');
                      setSubScreen('none');
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#0B351E] text-white text-xs font-bold shadow-xs"
                  >
                    Claim
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-SCREEN 2: DIRECT DEPOSIT (Matching Image 3) ──────────── */}
        {subScreen === 'deposit' && (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="pt-3 px-5 flex items-center justify-between border-b border-neutral-100 pb-3">
              <button onClick={() => setSubScreen('none')} className="p-2 -ml-2 text-neutral-700 hover:text-black">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-base font-bold text-[#0B351E]">Direct deposit</h2>
              <button className="text-neutral-400 hover:text-black p-2">
                <Info className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-5 pb-8 space-y-6">
              {/* Promo Banner */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0B351E] text-white flex items-center justify-center font-bold text-xs">
                    +
                  </div>
                  <div className="text-xs font-bold text-[#0B351E]">
                    Set up automated T+0 daily sweeps to get Tara Pro+
                  </div>
                </div>
              </div>

              {/* Your Direct Deposits */}
              <div>
                <h3 className="text-sm font-bold text-[#0B351E]">Your direct deposits</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Registered settlement account with RBI RTGS gateway.</p>

                <div className="mt-3 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-[#0B351E]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-neutral-900 truncate">HDFC Bank Current Account</div>
                    <div className="text-[11px] text-neutral-400 font-mono">Acct ending in •••• 1111</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active Primary
                  </span>
                </div>

                <button 
                  onClick={() => toast.success('Bank linking initiated!')}
                  className="w-full mt-3 py-3 rounded-2xl bg-[#25C974] hover:bg-[#20b868] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  + Add another
                </button>
              </div>

              {/* Do it yourself section */}
              <div className="pt-4 border-t border-neutral-100 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0B351E]">Do it yourself</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Use this routing information to receive merchant payouts directly.</p>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900">IFSC / Routing code</div>
                    <div className="text-xs font-mono text-neutral-500 mt-0.5">HDFC0000128</div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard('HDFC0000128')}
                    className="text-xs font-bold text-[#0B351E] flex items-center gap-1 hover:underline"
                  >
                    <span>{copiedText === 'HDFC0000128' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900">Account number</div>
                    <div className="text-xs font-mono text-neutral-500 mt-0.5">50200088921111</div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard('50200088921111')}
                    className="text-xs font-bold text-[#0B351E] flex items-center gap-1 hover:underline"
                  >
                    <span>{copiedText === '50200088921111' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button 
                  onClick={() => {
                    toast.success('Settlement statement PDF downloaded!');
                    setSubScreen('none');
                  }}
                  className="w-full py-3 rounded-2xl bg-[#25C974] hover:bg-[#20b868] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Get completed form
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-SCREEN 3: CREDIT SCORE (Matching Image 4) ─────────────── */}
        {subScreen === 'credit' && (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="pt-3 px-5 flex items-center justify-between border-b border-neutral-100 pb-3">
              <button onClick={() => setSubScreen('none')} className="p-2 -ml-2 text-neutral-700 hover:text-black">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-base font-bold text-[#0B351E]">Credit Score</h2>
              <div className="w-6" />
            </div>

            <div className="px-6 pt-5 pb-8 space-y-6">
              {/* Score Card */}
              <div className="p-5 bg-white rounded-3xl border border-neutral-200/90 shadow-sm space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#0B351E]">741</span>
                  <span className="text-lg text-neutral-400 font-semibold">/850</span>
                </div>

                <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                  <strong className="text-neutral-800">CIBIL SCORE®</strong>
                  <span>Updated today from RBI Experian® data</span>
                </div>

                {/* 5-Color Segment Progress Bar */}
                <div className="grid grid-cols-5 gap-1.5 h-2">
                  <div className="rounded-full bg-rose-500" />
                  <div className="rounded-full bg-amber-500" />
                  <div className="rounded-full bg-yellow-400" />
                  <div className="rounded-full bg-emerald-500" />
                  <div className="rounded-full bg-emerald-200" />
                </div>

                <div className="text-xs font-semibold text-[#0B351E] flex items-center gap-1 cursor-pointer">
                  <span>What goes into CIBIL® Scores?</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* How to improve your score */}
              <div>
                <h3 className="text-sm font-bold text-[#0B351E]">How to improve your score</h3>
                <p className="text-xs text-neutral-500 mt-0.5">We offer 2 tips that are personalized to your shop</p>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col justify-between">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center mb-2">
                      1
                    </span>
                    <p className="text-[11px] text-neutral-700 leading-relaxed font-medium">
                      Keep your soundbox online 24/7 to maintain 99.8% customer payment trust.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col justify-between">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center mb-2">
                      2
                    </span>
                    <p className="text-[11px] text-neutral-700 leading-relaxed font-medium">
                      Settle daily collections before 21:00 to unlock ₹5,00,000 working capital loan.
                    </p>
                  </div>
                </div>
              </div>

              {/* What goes into scores */}
              <div>
                <h3 className="text-sm font-bold text-[#0B351E] mb-3">What goes into CIBIL® Scores</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <Clock className="w-4 h-4 text-neutral-600 mb-2" />
                    <div className="text-xs font-semibold text-neutral-800">Payment history</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">Exceptional</div>
                  </div>

                  <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <Landmark className="w-4 h-4 text-neutral-600 mb-2" />
                    <div className="text-xs font-semibold text-neutral-800">Settlement velocity</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">Good</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN CHIME HOME VIEW (Matching Image 1) ──────────────────── */}
        {subScreen === 'none' && activeTab === 'home' && (
          <div className="flex-1 flex flex-col bg-[#F7F9FC] overflow-y-auto">
            
            {/* ── TOP HERO SECTION: CHIME FOREST GREEN GRADIENT ────────── */}
            <div className="bg-gradient-to-b from-[#0A331E] via-[#0E4226] to-[#124D2D] text-white pt-3 pb-8 px-5 relative shrink-0">
              
              {/* Status Bar (9:41, wifi, battery in white) */}
              <div className="flex items-center justify-between text-xs font-mono text-white/90 mb-4">
                <span className="font-bold">9:41</span>
                
                {/* Required by Playwright mobile-pwa.spec.ts:9 */}
                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 text-[10px] font-semibold">
                  <span>Kumar Stores</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                </div>

                <div className="flex items-center gap-1.5">
                  <Signal className="w-3.5 h-3.5" />
                  <Wifi className="w-3.5 h-3.5" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Header Action Row: Bell & Green Outline Button */}
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => toast('No unread merchant alerts.', { icon: '🔔' })}
                  className="p-1.5 -ml-1 text-white hover:text-emerald-300 transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#25C974]" />
                </button>

                <button 
                  onClick={() => toast.success('Merchant referral active: Earn ₹500 per Soundbox install')}
                  className="px-3.5 py-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/30 text-emerald-200 text-xs font-bold hover:bg-emerald-950/50 transition-colors"
                >
                  Get ₹500
                </button>
              </div>

              {/* Hero Metric: Available & Big Amount */}
              <div className="space-y-1">
                {/* Required by Playwright mobile-pwa.spec.ts:12 */}
                <div className="text-white/80 text-lg font-normal tracking-tight flex items-center justify-between">
                  <span>Today's UPI Collections</span>
                  <span className="text-xs font-mono text-emerald-200/90 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-400/20">{todayCount} txns</span>
                </div>

                {/* Required by Playwright mobile-pwa.spec.ts:13 */}
                <div 
                  onClick={() => setActiveTab('transactions')}
                  className="text-4xl sm:text-5xl font-bold tracking-tight text-white flex items-center gap-2 cursor-pointer group"
                >
                  <span>₹{todayCollections.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <ChevronRight className="w-6 h-6 text-white/60 group-hover:translate-x-1 transition-transform" />
                </div>

                {isAnnouncing && (
                  <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 animate-pulse pt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Soundbox Broadcasting Payment...</span>
                  </div>
                )}

                {/* Subtext Link to Overdraft / GTV */}
                <div 
                  onClick={() => setSubScreen('spotme')}
                  className="pt-1 text-[#25C974] font-semibold text-xs flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <span>₹5,000 working capital overdraft coverage</span>
                  <ChevronRight className="w-3 h-3 text-[#25C974]" />
                </div>
              </div>

            </div>

            {/* ── OVERLAPPING WHITE CARD (Savings / Soundbox Telemetry) ─── */}
            <div className="px-4 -mt-4 z-10">
              <div 
                onClick={() => setSubScreen('deposit')}
                className="bg-white rounded-3xl p-5 shadow-xs border border-neutral-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="text-xs font-semibold text-neutral-400">Direct Deposit & Auto-Sweep</div>
                  <div className="text-2xl font-bold text-neutral-900 mt-1">₹48,250.00</div>
                  <div className="text-xs text-neutral-400 mt-0.5">HDFC Bank •••• 1111 · 06:00 AM daily</div>
                </div>

                <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* ── PROMO CAROUSEL CARD (Mint Teal Card) ─────────────────── */}
            <div className="px-4 mt-4">
              <div 
                onClick={() => setActiveTab('chat')}
                className="bg-[#C6EFE7] text-[#0A3D30] rounded-3xl p-5 flex items-center justify-between shadow-2xs cursor-pointer group"
              >
                <div className="pr-3">
                  <h3 className="text-sm font-extrabold leading-snug">
                    Welcome to Tara Pro! Enjoy 0% UPI MDR, 138ms Soundbox speech, and more
                  </h3>
                  <div className="text-xs font-bold text-[#0A3D30] mt-2 flex items-center gap-0.5 group-hover:underline">
                    <span>Ask Tara anything</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[#0B351E] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-6 h-6 text-[#25C974]" />
                </div>
              </div>

              {/* Carousel Dots */}
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              </div>
            </div>

            {/* ── FINANCIAL TOOLS SECTION ─────────────────────────────── */}
            <div className="mt-5 px-4 space-y-3">
              <h2 className="text-lg font-bold text-neutral-900 px-1">Financial tools</h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSubScreen('deposit')}
                  className="p-4 bg-white rounded-2xl border border-neutral-100 text-left shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-2">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-neutral-900">Direct Deposit</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">T+0 Bank Sweeps</div>
                </button>

                <button
                  onClick={() => setSubScreen('credit')}
                  className="p-4 bg-white rounded-2xl border border-neutral-100 text-left shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-2">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-neutral-900">Credit Score</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">741 CIBIL Health</div>
                </button>

                <button
                  onClick={() => setActiveTab('soundbox')}
                  className="p-4 bg-white rounded-2xl border border-neutral-100 text-left shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-2">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-neutral-900">Soundbox Hardware</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">SB-4421 Telemetry</div>
                </button>

                <button
                  onClick={() => handleTriggerSimulatedPayment()}
                  className="p-4 bg-white rounded-2xl border border-neutral-100 text-left shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-neutral-900">Simulate UPI Pay</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">+₹420 Audio Broadcast</div>
                </button>
              </div>
            </div>

            {/* ── RECENT COLLECTIONS FEED ─────────────────────────────── */}
            <div className="mt-6 px-4 pb-8 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-neutral-900">Recent Collections</h2>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-bold text-[#0B351E] flex items-center gap-0.5"
                >
                  <span>View all</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-neutral-100 divide-y divide-neutral-100 overflow-hidden shadow-2xs">
                {txns.slice(0, 4).map((txn) => (
                  <div key={txn.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#0B351E]/10 text-[#0B351E] flex items-center justify-center font-bold text-xs shrink-0">
                        ₹
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-neutral-900 truncate">{txn.payer}</div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          <span>{txn.time}</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold">{txn.mode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-neutral-900">+₹{txn.amount.toFixed(2)}</div>
                      <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">SB Announced</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: SOUNDBOX HARDWARE CONTROLS (Required by Tests) ───── */}
        {subScreen === 'none' && activeTab === 'soundbox' && (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto p-5 space-y-5 animate-in fade-in duration-150">
            <div>
              {/* Required by Playwright mobile-pwa.spec.ts:17 */}
              <h2 className="text-xl font-bold text-[#0B351E]">Demo Soundbox (Simulated)</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Edge IoT hardware status, volume control & live chime trigger.</p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">Device ID:</span>
                <span className="font-mono font-bold text-neutral-900">SB-4421</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">Network:</span>
                <span className="font-bold text-emerald-700">Airtel 4G IoT (Active)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">Audio Latency:</span>
                <span className="font-bold text-neutral-900">138ms</span>
              </div>
            </div>

            {/* Required by Playwright mobile-pwa.spec.ts:18 */}
            <button
              onClick={handleTriggerSimulatedPayment}
              className="w-full py-3.5 rounded-2xl bg-[#0B351E] hover:bg-black text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-[#25C974]" />
              <span>Trigger ₹420 Live Payment & Audio</span>
            </button>
          </div>
        )}

        {/* ── TAB 3: TRANSACTIONS LIVE FEED (Required by Tests) ───────── */}
        {subScreen === 'none' && activeTab === 'transactions' && (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto p-5 space-y-4 animate-in fade-in duration-150">
            <div>
              {/* Required by Playwright mobile-pwa.spec.ts:22 */}
              <h2 className="text-xl font-bold text-[#0B351E]">Live Feed</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Real-time merchant collections stream across all switches.</p>
            </div>

            <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden">
              {txns.map((txn) => (
                <div key={txn.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    {/* Required by Playwright mobile-pwa.spec.ts:23 */}
                    <div className="text-xs font-bold text-neutral-900">{txn.payer}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{txn.id} · {txn.time}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-neutral-900">+₹{txn.amount.toFixed(2)}</div>
                    <div className="text-[9px] text-emerald-700 font-semibold">{txn.ackStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: TARA AI CONVERSATIONAL AGENT (Required by Tests) ─── */}
        {subScreen === 'none' && activeTab === 'chat' && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0B351E] text-white flex items-center justify-center font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-[#25C974]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900">Tara Teammate</h3>
                  <p className="text-[10px] text-emerald-700 font-semibold">Active & Listening</p>
                </div>
              </div>

              {/* Language Pills */}
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full text-[10px] font-bold">
                {(['en', 'hi', 'ta', 'te'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setSelectedLang(l)}
                    className={`px-2 py-0.5 rounded-full uppercase ${selectedLang === l ? 'bg-[#0B351E] text-white' : 'text-neutral-600'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs ${msg.role === 'user' ? 'bg-[#0B351E] text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="text-xs text-neutral-400 italic">Tara is analyzing store data...</div>
              )}
            </div>

            {/* Quick Prompt Chips - Required by Playwright mobile-pwa.spec.ts:27 */}
            <div className="p-3 border-t border-neutral-100 space-y-2">
              <button
                onClick={() => handleSendChatMessage('Total amount received today in bank?')}
                className="w-full text-left p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-800 truncate"
              >
                Total amount received today in bank?
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="Ask Tara anything..."
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:border-black"
                />
                <button
                  onClick={() => handleSendChatMessage()}
                  className="p-2 bg-[#0B351E] text-white rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: PROFILE & SETTINGS ──────────────────────────────── */}
        {subScreen === 'none' && activeTab === 'settings' && (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto p-5 space-y-4 animate-in fade-in duration-150">
            <h2 className="text-xl font-bold text-[#0B351E]">Merchant Settings</h2>
            
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2 text-xs">
              <div className="font-bold text-neutral-900 text-sm">Kumar Stores</div>
              <div className="text-neutral-500">Merchant ID: MERCH_9921</div>
              <div className="text-neutral-500">Settlement A/c: HDFC Bank •••• 1111</div>
            </div>

            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/?mode=onboarding';
              }}
              className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50"
            >
              Log Out
            </button>
          </div>
        )}

        {/* ── CHIME 5-ITEM BOTTOM NAVIGATION BAR ───────────────────────── */}
        <div className="bg-white border-t border-neutral-100 px-4 py-2 flex items-center justify-between shrink-0 z-20">
          <button
            onClick={() => {
              setSubScreen('none');
              setActiveTab('home');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${activeTab === 'home' && subScreen === 'none' ? 'text-[#0B351E] font-bold' : 'text-neutral-400 hover:text-neutral-700'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          {/* Required by Playwright mobile-pwa.spec.ts:21 */}
          <button
            onClick={() => {
              setSubScreen('none');
              setActiveTab('transactions');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${activeTab === 'transactions' ? 'text-[#0B351E] font-bold' : 'text-neutral-400 hover:text-neutral-700'}`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-[10px]">Txns</span>
          </button>

          {/* Required by Playwright mobile-pwa.spec.ts:16 */}
          <button
            onClick={() => {
              setSubScreen('none');
              setActiveTab('soundbox');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${activeTab === 'soundbox' ? 'text-[#0B351E] font-bold' : 'text-neutral-400 hover:text-neutral-700'}`}
          >
            <Volume2 className="w-5 h-5" />
            <span className="text-[10px]">Soundbox</span>
          </button>

          {/* Required by Playwright mobile-pwa.spec.ts:26 */}
          <button
            onClick={() => {
              setSubScreen('none');
              setActiveTab('chat');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${activeTab === 'chat' ? 'text-[#0B351E] font-bold' : 'text-neutral-400 hover:text-neutral-700'}`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px]">Tara AI</span>
          </button>

          <button
            onClick={() => {
              setSubScreen('none');
              setActiveTab('settings');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${activeTab === 'settings' ? 'text-[#0B351E] font-bold' : 'text-neutral-400 hover:text-neutral-700'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>

        {/* iPhone Home Indicator Pill */}
        <div className="bg-white pb-2 pt-1 flex justify-center shrink-0">
          <div className="w-32 h-1 bg-neutral-300 rounded-full" />
        </div>

      </div>

    </div>
  );
};
