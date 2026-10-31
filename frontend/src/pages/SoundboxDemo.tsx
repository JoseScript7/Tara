import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, VolumeX, Wifi, Battery, BatteryLow, Radio, 
  ArrowLeft, Zap, Plane, PlaneTakeoff, ShieldCheck, Landmark
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { globalAudioPlayer } from '../utils/audioPlayer';
import toast from 'react-hot-toast';
import { realtimeBus } from '../utils/realtimeSync';

const MOCK_ACCOUNTS = [
  { id: 'acc-1', name: 'Sharma Kirana & General Store', bank: 'HDFC Bank', number: '•••• 1111' },
  { id: 'acc-2', name: 'Gupta Daily Supermarket', bank: 'ICICI Bank', number: '•••• 4444' },
  { id: 'acc-3', name: 'Verma Medicals & Clinic', bank: 'SBI', number: '•••• 2222' },
  { id: 'acc-4', name: 'Chai & Conversations Café', bank: 'Axis Bank', number: '•••• 0000' },
];

export const SoundboxDemo: React.FC = () => {
  const navigate = useNavigate();

  const [deviceId] = useState('SB-DEMO-7701');
  const [deviceStatus, setDeviceStatus] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('ONLINE');
  const [batteryPct, setBatteryPct] = useState(88);
  const [signalDbm, setSignalDbm] = useState(-68);
  const [volume, setVolume] = useState(8);
  const [isMuted, setIsMuted] = useState(false);
  const [isAirplaneMode, setIsAirplaneMode] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('Ready for live payments');
  const [announcementCount, setAnnouncementCount] = useState(14);
  const [lastAckLatency, setLastAckLatency] = useState<number | null>(68.4);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastPingTime, setLastPingTime] = useState(new Date().toLocaleTimeString());
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('acc-1');

  const wsRef = useRef<WebSocket | null>(null);

  // Play Paytm Two-Tone Chime
  const playPaytmChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
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
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.20);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.38);
    } catch (e) {
      console.warn('Audio chime reproduction failed:', e);
    }
  };

  // Announce payment & mutate the real bank account ledger in the main dashboard!
  const announcePayment = async (amount: number, customerName: string = 'Customer', annId?: string) => {
    const paymentId = `PAY-${Date.now()}`;
    const selectedAcc = MOCK_ACCOUNTS.find(a => a.id === selectedAccountId) || MOCK_ACCOUNTS[0];

    // 1. Post real transaction to Core Bank system (updates Home Dashboard & Transactions feed!)
    try {
      const txnRes = await fetch('/api/bank/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedAccountId,
          amount: amount,
          type: 'UPI_CREDIT',
          payer_name: customerName,
          payer_vpa: `${customerName.toLowerCase().replace(/[^a-z]/g, '')}@paytm`,
          note: `Payment via Soundbox QR (${deviceId})`
        })
      });

      if (txnRes.ok) {
        toast.success(`₹${amount} credited to ${selectedAcc.name}!`);
        // Notify any open dashboard tabs across browser via BroadcastChannel & LocalStorage
        realtimeBus.broadcast({
          type: 'PAYMENT_RECEIVED',
          id: paymentId,
          amount,
          customer: customerName,
          mode: 'UPI_QR',
          timestamp: 'Just now',
          shouldAnnounce: false
        });
        window.dispatchEvent(new CustomEvent('tara:transaction_created', { detail: { amount, customerName } }));
      }
    } catch (e) {
      console.warn('Bank transaction ledger update failed:', e);
    }

    // 2. Dispatch device announcement record
    try {
      await fetch(`/api/devices/announce?payment_id=${paymentId}&amount=${amount}&device_id=${deviceId}&language=hi`, {
        method: 'POST'
      });
    } catch (e) {
      console.warn('Device announcement dispatch failed:', e);
    }

    if (isMuted || isAirplaneMode) {
      if (annId && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ANNOUNCEMENT_ACK',
          announcement_id: annId,
          status: isMuted ? 'muted' : 'failed',
          latency_ms: 0
        }));
      }
      setLastAnnouncement(`₹${amount} SILENT (${isAirplaneMode ? 'Airplane Mode' : 'Muted'})`);
      return;
    }

    const tStart = performance.now();
    setIsSpeaking(true);
    setLastPingTime(new Date().toLocaleTimeString());
    setAnnouncementCount(prev => prev + 1);

    const announcementText = `पेटीएम पर ${amount} रुपये प्राप्त हुए।`;
    setLastAnnouncement(`₹${amount} received (${customerName})`);

    // Play chime immediately (<15ms)
    playPaytmChime();

    // Fetch Indic voice from Sarvam Bulbul TTS
    try {
      const res = await fetch('http://localhost:8000/api/tara/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: announcementText, language: 'hi-IN' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio_base64 && data.audio_base64.length > 100) {
          await new Promise(r => setTimeout(r, 400));
          await globalAudioPlayer.playBase64Wav(data.audio_base64, () => {
            setIsSpeaking(false);
          });

          const measuredLatency = Math.round((performance.now() - tStart) * 10) / 10;
          setLastAckLatency(measuredLatency);

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'ANNOUNCEMENT_ACK',
              announcement_id: annId || paymentId,
              status: 'played',
              latency_ms: measuredLatency
            }));
          }
          return;
        }
      }
    } catch (err) {
      console.warn('TTS announce error:', err);
    }

    // Speech synthesis fallback
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(`Paytm par ${amount} rupees praapt hue.`);
        utterance.rate = 1.05;
        utterance.onend = () => {
          setIsSpeaking(false);
          const measuredLatency = Math.round((performance.now() - tStart) * 10) / 10;
          setLastAckLatency(measuredLatency);
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'ANNOUNCEMENT_ACK',
              announcement_id: annId || paymentId,
              status: 'played',
              latency_ms: measuredLatency
            }));
          }
        };
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }, 400);
    } else {
      setIsSpeaking(false);
    }
  };

  // Screen Wake Lock API
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLockActive(true);
        lock.addEventListener('release', () => setWakeLockActive(false));
        toast.success('Screen wake lock enabled');
      } else {
        toast.error('Wake lock not supported on this device');
      }
    } catch (e) {
      console.info('Wake lock request notice:', e);
    }
  };

  // Cross-tab Realtime Bus Subscription (listens for payments initiated from Web Dashboard or Mobile UI)
  useEffect(() => {
    const unsubscribe = realtimeBus.subscribe((evt) => {
      if (evt.type === 'PAYMENT_RECEIVED' && evt.shouldAnnounce !== false) {
        announcePayment(evt.amount, evt.customer || 'Priya Sharma');
      }
    });
    return () => unsubscribe();
  }, [selectedAccountId, isMuted, isAirplaneMode]);

  // Dedicated WebSocket Channel for Device Telemetry & Presence
  useEffect(() => {
    if (isAirplaneMode) {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Airplane mode activated');
        wsRef.current = null;
      }
      setDeviceStatus('OFFLINE');
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/devices/ws/${deviceId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setDeviceStatus(batteryPct < 20 || signalDbm < -100 ? 'DEGRADED' : 'ONLINE');
      setLastPingTime(new Date().toLocaleTimeString());
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'HEARTBEAT_ACK') {
          setLastPingTime(new Date().toLocaleTimeString());
        } else if (data.type === 'ANNOUNCE_PAYMENT') {
          announcePayment(data.amount, 'Customer', data.announcement_id);
        } else if (data.type === 'DEVICE_COMMAND') {
          if (data.command === 'ping') {
            playPaytmChime();
            toast.success('Ping received from Admin Console');
          } else if (data.command === 'force_offline') {
            setIsAirplaneMode(true);
          } else if (data.command === 'set_volume') {
            setVolume(data.payload?.volume || 8);
          }
        }
      } catch (err) {
        console.warn('WS message parse error:', err);
      }
    };

    ws.onclose = () => {
      setDeviceStatus('OFFLINE');
    };

    wsRef.current = ws;

    // Heartbeat every 5s
    const heartbeatTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN && !isAirplaneMode) {
        ws.send(JSON.stringify({
          type: 'HEARTBEAT',
          device_id: deviceId,
          battery_pct: batteryPct,
          signal_dbm: signalDbm,
          timestamp: Date.now()
        }));
      }
    }, 5000);

    return () => {
      clearInterval(heartbeatTimer);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isAirplaneMode, batteryPct, signalDbm, deviceId]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#151615] flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
      
      {/* Top Bar matching app design */}
      <div className="w-full max-w-md flex items-center justify-between bg-white p-3.5 rounded-2xl border border-soft-border shadow-xs">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#151615] hover:text-[#FE8A70] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            Demo Soundbox (Simulated)
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono">
          <span className={`w-2 h-2 rounded-full ${
            deviceStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' :
            deviceStatus === 'DEGRADED' ? 'bg-amber-500' : 'bg-rose-500'
          }`} />
          <span className="font-bold text-xs">{deviceStatus}</span>
        </div>
      </div>

      {/* Target Merchant Account Selector */}
      <div className="w-full max-w-md bg-white p-3 rounded-2xl border border-soft-border shadow-xs mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-paytm-blue" />
          <span className="font-bold text-[#151615]">Store Account:</span>
        </div>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 font-semibold text-slate-800 outline-none"
        >
          {MOCK_ACCOUNTS.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.bank})
            </option>
          ))}
        </select>
      </div>

      {/* ─── PHYSICAL SOUNDBOX CASING ───────────────────────────────────── */}
      <div className="w-full max-w-md flex flex-col items-center my-4">
        <div className="w-72 sm:w-80 rounded-[2.5rem] bg-gradient-to-b from-[#002970] via-[#001D47] to-[#001433] p-6 shadow-2xl border-4 border-[#00BAF2]/30 flex flex-col items-center relative overflow-hidden">
          
          {/* Subtle Ambient Light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-[#00BAF2]/20 blur-xl pointer-events-none" />

          {/* Device Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 text-white">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-white">Paytm</span>
              <span className="text-[10px] bg-[#00BAF2] text-[#001D47] font-black px-1.5 py-0.2 rounded-xs">
                Soundbox
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] text-white/80 font-mono">
              <span className="flex items-center gap-1">
                {signalDbm < -95 ? <Wifi className="w-3 h-3 text-rose-400" /> : <Wifi className="w-3 h-3 text-[#00BAF2]" />}
                {signalDbm}dBm
              </span>
              <span className="flex items-center gap-1">
                {batteryPct < 20 ? <BatteryLow className="w-3.5 h-3.5 text-amber-400" /> : <Battery className="w-3.5 h-3.5 text-emerald-400" />}
                {batteryPct}%
              </span>
              <span className="hidden sm:inline text-white/50 text-[9px]">
                {lastPingTime}
              </span>
            </div>
          </div>

          {/* Crisp OLED Audio Screen */}
          <div className="w-full mt-5 bg-[#000C1F] rounded-2xl p-4 border border-[#00BAF2]/30 shadow-inner flex flex-col items-center justify-center min-h-[120px]">
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-white/50 mb-1">
              <span className={deviceStatus === 'ONLINE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {deviceStatus === 'ONLINE' ? '● LIVE WEBSOCKET' : '○ DISCONNECTED'}
              </span>
              {lastAckLatency && (
                <span className="font-mono text-emerald-400 font-bold">
                  Ack: {lastAckLatency}ms
                </span>
              )}
            </div>

            <div className="text-center my-1">
              <div className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-md">
                {lastAnnouncement}
              </div>
              <p className="text-[10px] font-mono text-[#00BAF2] mt-0.5">
                Announcements: {announcementCount} · {deviceId}
              </p>
            </div>

            {/* LED Audio Visualizer */}
            <div className="flex items-center gap-1 mt-2">
              {[12, 24, 40, 56, 32, 48, 20, 16].map((h, i) => (
                <div 
                  key={i} 
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isSpeaking 
                      ? 'bg-gradient-to-t from-[#00BAF2] to-[#FE8A70]' 
                      : 'bg-white/20'
                  }`}
                  style={{ height: isSpeaking ? `${Math.max(6, Math.random() * h)}px` : '4px' }}
                />
              ))}
            </div>
          </div>

          {/* Perforated Acoustic Speaker Grille */}
          <div className="w-full mt-5 py-2 flex flex-col items-center justify-center">
            <div className="grid grid-cols-11 gap-1.5 p-3 rounded-2xl bg-black/40 border border-white/5">
              {Array.from({ length: 55 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    isSpeaking 
                      ? i % 2 === 0 ? 'bg-[#00BAF2] shadow-[0_0_4px_#00BAF2]' : 'bg-[#FE8A70]' 
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/30 mt-1.5">
              Dual Acoustic Driver (Simulated)
            </span>
          </div>

          {/* Hardware Tactile Buttons */}
          <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-white">
            <button
              onClick={() => setVolume(v => Math.max(1, v - 1))}
              className="py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all text-center"
            >
              Vol - ({volume})
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                isMuted ? 'bg-rose-500 text-white' : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {isMuted ? 'Muted' : 'Mute'}
            </button>
            <button
              onClick={() => setVolume(v => Math.min(10, v + 1))}
              className="py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all text-center"
            >
              Vol + ({volume})
            </button>
          </div>

        </div>
      </div>

      {/* ─── INTERACTIVE DEMO CONTROLS (Cohesive White Card) ────────────── */}
      <div className="w-full max-w-md bg-white p-4 rounded-3xl border border-soft-border shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs pb-1 border-b border-soft-border">
          <span className="font-bold text-[#151615]">Physical Field Simulator</span>
          <span className={`font-mono text-[11px] font-bold flex items-center gap-1 ${
            deviceStatus === 'ONLINE' ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            <Radio className="w-3 h-3 animate-pulse" />
            {deviceStatus === 'ONLINE' ? 'Channel Open' : 'Socket Severed'}
          </span>
        </div>

        {/* Airplane Mode Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsAirplaneMode(!isAirplaneMode)}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs border ${
              isAirplaneMode
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            {isAirplaneMode ? <Plane className="w-3.5 h-3.5 animate-bounce" /> : <PlaneTakeoff className="w-3.5 h-3.5" />}
            {isAirplaneMode ? 'Airplane Mode ON' : 'Airplane Mode'}
          </button>

          <button
            onClick={() => setBatteryPct(b => b === 88 ? 12 : 88)}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs border ${
              batteryPct === 12
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <BatteryLow className="w-3.5 h-3.5" />
            {batteryPct === 12 ? 'Low Bat (12%)' : 'Simulate Low Bat'}
          </button>
        </div>

        {/* Signal Strength Simulator */}
        <div className="grid grid-cols-1">
          <button
            onClick={() => setSignalDbm(s => s === -68 ? -108 : -68)}
            className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs border ${
              signalDbm === -108
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            {signalDbm === -108 ? 'Weak Signal (-108 dBm Active)' : 'Simulate Weak Cellular Signal (-108 dBm)'}
          </button>
        </div>

        {/* Live Payment Triggers (Updates Main Dashboard!) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => announcePayment(420, 'Priya S.')}
            className="py-2.5 px-3 rounded-xl bg-[#FE8A70] hover:bg-[#FA7F62] text-[#151615] font-black text-xs transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-[#151615]" />
            Pay ₹420 (Live)
          </button>

          <button
            onClick={() => announcePayment(1250, 'Vikram R.')}
            className="py-2.5 px-3 rounded-xl bg-[#00BAF2] hover:bg-[#009FD6] text-[#001D47] font-black text-xs transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Pay ₹1,250 (Live)
          </button>
        </div>

        {/* Screen Wake Lock */}
        <button
          onClick={requestWakeLock}
          className="w-full py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-600 hover:text-slate-900 border border-slate-200 flex items-center justify-center gap-1 font-semibold transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          {wakeLockActive ? 'Wake Lock Active (Screen Kept On)' : 'Enable Screen Wake Lock (Mobile PWA)'}
        </button>
      </div>

    </div>
  );
};
