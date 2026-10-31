import React, { useState, useEffect, useMemo } from 'react';
import { useDerivedState } from '../context/DerivedStateContext';
import { 
  TrendingUp, 
  Volume2, 
  Radio, 
  Smartphone, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  Landmark, 
  X, 
  Plus, 
  HelpCircle, 
  Gift, 
  Settings,
  CheckCircle2,
  Copy,
  Printer,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';

import { realtimeBus } from '../utils/realtimeSync';

interface LiveTransaction {
  id: string;
  customer: string;
  vpa: string;
  amount: number;
  mode: 'UPI_QR' | 'RUPAY_CREDIT' | 'PAYTM_WALLET';
  device: string;
  ackStatus: 'ANNOUNCED' | 'NOT_ANNOUNCED' | 'MUTED';
  ackLatency: string;
  timestamp: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  rrn?: string;
}

export const HomeDashboard: React.FC = () => {
  const { state } = useDerivedState();
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1W' | '1M' | '3M' | 'YTD' | 'ALL'>('1M');
  const [activeTab, setActiveTab] = useState<'overview' | 'networth'>('overview');
  const [copiedTxnId, setCopiedTxnId] = useState<string | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(31);
  const [todayCollections, setTodayCollections] = useState(42500.00);
  const [todayCount, setTodayCount] = useState(68);

  // Interactive Modals
  const [selectedTxnModal, setSelectedTxnModal] = useState<LiveTransaction | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  
  // Simulation input state
  const [simAmount, setSimAmount] = useState<number>(420);
  const [simCustomer, setSimCustomer] = useState<string>('Priya Sharma');
  const [simMode, setSimMode] = useState<'UPI_QR' | 'RUPAY_CREDIT' | 'PAYTM_WALLET'>('UPI_QR');

  const gtv = state.financials.last_30_days_gtv_inr;
  const successRate = state.financials.success_rate_pct;
  const urgentActionCount = state.open_cases.length;

  // Real-time production transactions ledger
  const [transactions, setTransactions] = useState<LiveTransaction[]>([
    {
      id: 'TXN-982104',
      customer: 'Vikram Singh',
      vpa: 'vikram@okhdfcbank',
      amount: 500,
      mode: 'UPI_QR',
      device: 'SB-4421',
      ackStatus: 'ANNOUNCED',
      ackLatency: '138ms',
      timestamp: '11:42 AM',
      status: 'SUCCESS',
      rrn: '430918239012'
    },
    {
      id: 'TXN-982103',
      customer: 'Priya Sharma',
      vpa: 'priya.s@icici',
      amount: 420,
      mode: 'RUPAY_CREDIT',
      device: 'SB-4421',
      ackStatus: 'ANNOUNCED',
      ackLatency: '142ms',
      timestamp: '11:28 AM',
      status: 'SUCCESS',
      rrn: '430918239011'
    },
    {
      id: 'TXN-982102',
      customer: 'Anand Verma',
      vpa: 'anand.v@paytm',
      amount: 1250,
      mode: 'UPI_QR',
      device: 'SB-4421',
      ackStatus: 'ANNOUNCED',
      ackLatency: '145ms',
      timestamp: '10:55 AM',
      status: 'SUCCESS',
      rrn: '430918239010'
    },
    {
      id: 'TXN-982101',
      customer: 'Meera Iyer',
      vpa: 'meera.iyer@axisbank',
      amount: 850,
      mode: 'PAYTM_WALLET',
      device: 'SB-4421',
      ackStatus: 'ANNOUNCED',
      ackLatency: '129ms',
      timestamp: '10:14 AM',
      status: 'SUCCESS',
      rrn: '430918239009'
    },
    {
      id: 'TXN-982100',
      customer: 'Karthik Rao',
      vpa: 'karthik.r@sbi',
      amount: 320,
      mode: 'UPI_QR',
      device: 'SB-4421',
      ackStatus: 'ANNOUNCED',
      ackLatency: '134ms',
      timestamp: '09:48 AM',
      status: 'SUCCESS',
      rrn: '430918239008'
    }
  ]);

  // Dynamic Chart Data based on selected timeframe
  const chartData = useMemo(() => {
    switch (selectedTimeframe) {
      case '1W':
        return [
          { label: 'Oct 25', volume: 38200 },
          { label: 'Oct 26', volume: 39900 },
          { label: 'Oct 27', volume: 41200 },
          { label: 'Oct 28', volume: 42100 },
          { label: 'Oct 29', volume: 44500 },
          { label: 'Oct 30', volume: 46800 },
          { label: 'Oct 31', volume: 48250 },
        ];
      case '1M':
        return [
          { label: 'Oct 1', volume: 14200 },
          { label: 'Oct 5', volume: 18600 },
          { label: 'Oct 10', volume: 24900 },
          { label: 'Oct 15', volume: 29400 },
          { label: 'Oct 20', volume: 36100 },
          { label: 'Oct 25', volume: 41800 },
          { label: 'Oct 31', volume: 48250 },
        ];
      case '3M':
        return [
          { label: 'Aug', volume: 384000 },
          { label: 'Sep', volume: 421000 },
          { label: 'Oct', volume: 482500 },
        ];
      case 'YTD':
        return [
          { label: 'Q1', volume: 920000 },
          { label: 'Q2', volume: 1140000 },
          { label: 'Q3', volume: 1350000 },
          { label: 'Q4', volume: 1482500 },
        ];
      case 'ALL':
        return [
          { label: '2024', volume: 2400000 },
          { label: '2025', volume: 3800000 },
          { label: '2026', volume: 4825000 },
        ];
    }
  }, [selectedTimeframe]);

  // Dynamic GTV display based on timeframe
  const displayedGTV = useMemo(() => {
    switch (selectedTimeframe) {
      case '1W': return 148200;
      case '1M': return gtv;
      case '3M': return 1287500;
      case 'YTD': return 4892500;
      case 'ALL': return 11025000;
    }
  }, [selectedTimeframe, gtv]);

  // 1. Cross-tab Realtime Bus Subscription
  useEffect(() => {
    const unsubscribe = realtimeBus.subscribe((evt) => {
      if (evt.type === 'PAYMENT_RECEIVED') {
        const newTxn: LiveTransaction = {
          id: evt.id || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          customer: evt.customer || 'Priya Sharma',
          vpa: evt.vpa || `${(evt.customer || 'customer').toLowerCase().replace(/\s+/g, '')}@upi`,
          amount: evt.amount,
          mode: (evt.mode as any) || 'UPI_QR',
          device: 'SB-4421',
          ackStatus: 'ANNOUNCED',
          ackLatency: '138ms',
          timestamp: 'Just now',
          status: 'SUCCESS',
          rrn: `43091${Math.floor(1000000 + Math.random() * 9000000)}`
        };
        setTransactions(prev => [newTxn, ...prev.slice(0, 6)]);
        setTodayCollections(prev => prev + evt.amount);
        setTodayCount(prev => prev + 1);
        toast.success(`⚡ Live ₹${evt.amount} received from ${evt.customer}!`);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen to SSE live events from backend bank
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/bank/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.amount_inr || payload.amount) {
            const amount = payload.amount_inr || payload.amount || 100;
            const newTxn: LiveTransaction = {
              id: payload.id || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
              customer: payload.sender_name || 'Customer Pay',
              vpa: `${(payload.sender_name || 'customer').toLowerCase().replace(/\s+/g, '')}@upi`,
              amount: amount,
              mode: 'UPI_QR',
              device: 'SB-4421',
              ackStatus: 'ANNOUNCED',
              ackLatency: '141ms',
              timestamp: 'Just now',
              status: 'SUCCESS',
              rrn: `43091${Math.floor(1000000 + Math.random() * 9000000)}`
            };
            setTransactions(prev => [newTxn, ...prev.slice(0, 6)]);
            setTodayCollections(prev => prev + amount);
            setTodayCount(prev => prev + 1);
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
    return () => eventSource?.close();
  }, []);

  const copyTxn = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedTxnId(id);
    toast.success(`Copied ${id}`);
    setTimeout(() => setCopiedTxnId(null), 1500);
  };

  const handleSimulatePaymentSubmit = async () => {
    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const vpa = `${simCustomer.toLowerCase().replace(/\s+/g, '')}@upi`;

    // Broadcast across all open browser tabs (Mobile UI + Soundbox Hardware!)
    realtimeBus.broadcast({
      type: 'PAYMENT_RECEIVED',
      id: txnId,
      amount: simAmount,
      customer: simCustomer,
      vpa,
      mode: simMode,
      timestamp: 'Just now',
      shouldAnnounce: true
    });

    try {
      await fetch('/api/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: simAmount, customer: simCustomer, should_announce: true })
      });
    } catch {
      // handled via realtimeBus
    }

    setIsSimulateModalOpen(false);
  };

  const handleSelectCalendarDay = (day: number) => {
    setSelectedDay(day);
    if (day === 31) {
      setTodayCollections(42500.00);
      setTodayCount(68);
    } else {
      const calculatedTotal = Math.round(day * 1380 + (day % 3) * 450);
      setTodayCollections(calculatedTotal);
      setTodayCount(Math.max(12, Math.round(day * 2.2)));
    }
    toast(`Viewing collections for October ${day}`, { icon: '📅' });
  };

  const calendarDays = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none px-2 sm:px-4 relative">
      
      {/* ── ORIGIN CLEAN HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#111827]">
              Today's Overview
            </h1>
            <span className="text-sm font-normal text-neutral-400">·</span>
            <span className="text-lg lg:text-xl font-normal text-neutral-600">
              Good morning, {state.business_name || 'Kumar Stores'}
            </span>
          </div>

          {/* Origin Pill Subtabs */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 bg-neutral-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('networth')}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'networth'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 bg-neutral-100'
              }`}
            >
              Net worth
            </button>
            <button
              onClick={() => navigate('/settlements')}
              className="px-3.5 py-1 rounded-full text-xs font-medium text-neutral-500 hover:text-neutral-900 bg-neutral-100 transition-all"
            >
              Settlements
            </button>
          </div>
        </div>

        {/* Origin Top-Right Action Cluster */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Plus / Trigger Payment Simulator Modal */}
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors shadow-2xs"
            title="Trigger Live Payment Simulator"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Help / Support */}
          <button
            onClick={() => navigate('/support')}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors shadow-2xs"
            title="Merchant Support & FAQ"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Gift / Offers */}
          <button
            onClick={() => navigate('/offers')}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors shadow-2xs"
            title="Merchant Rewards & Loan Offers"
          >
            <Gift className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors shadow-2xs"
            title="Account Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Profile Badge for Kumar Stores */}
          <div 
            onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-full bg-[#002970] text-white flex items-center justify-center text-xs font-bold shadow-2xs cursor-pointer ml-1 hover:ring-2 hover:ring-[#002970]/30 transition-all" 
            title="Kumar Stores Account"
          >
            KS
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN ASYMMETRICAL ORIGIN GRID ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT / MAIN COLUMN (~66% width) ─────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CARD 1: NET WORTH > */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-7 shadow-xs relative overflow-hidden">
            
            {/* Top row */}
            <div className="flex items-center justify-between mb-2">
              <div 
                onClick={() => navigate('/reports')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-700 cursor-pointer transition-colors"
              >
                <span>NET WORTH</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>

              <button
                onClick={() => navigate('/reports')}
                className="text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 px-3.5 py-1 rounded-full flex items-center gap-1 transition-colors"
              >
                <span>Forecast</span>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              </button>
            </div>

            {/* Large Typography Metric */}
            <div className="flex items-baseline justify-between mt-3 mb-4">
              <div>
                <div 
                  className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111827]" 
                  data-testid="canonical-gtv"
                >
                  ₹{displayedGTV.toLocaleString('en-IN')}.00
                </div>
                <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                  <span>Today's Collections: <strong className="text-emerald-700 font-semibold">₹{todayCollections.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                  <span className="text-neutral-300">·</span>
                  <span>{todayCount} UPI Transactions</span>
                </div>
              </div>
              
              <div className="text-right">
                <button
                  onClick={() => navigate('/reports')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  title="View Growth Breakdown"
                >
                  <TrendingUp className="w-3 h-3 text-emerald-600" /> +14.2% MoM
                </button>
              </div>
            </div>

            {/* Silver Gradient Chart with Tooltip Pill */}
            <div className="relative h-[220px] w-full pt-2">
              
              {/* Origin-style Centered Floating Insight Pill */}
              <div 
                onClick={() => navigate('/settlements')}
                className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xs border border-neutral-200/90 shadow-md px-3.5 py-1.5 rounded-full text-[11px] text-neutral-700 font-medium flex items-center gap-2 cursor-pointer hover:bg-white transition-all z-10"
                title="View Settlement Details"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="truncate max-w-[280px] sm:max-w-none">
                  All 68 transactions settled to HDFC Bank A/c •••• 1111 at 06:00 AM
                </span>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="silverArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94A3B8' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      background: '#111827', 
                      color: '#F9FAFB', 
                      border: 'none', 
                      fontSize: '12px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.12)' 
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Volume']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#64748B" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#silverArea)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Time Filter Pills Row (Origin Style) */}
            <div className="flex items-center justify-center gap-1 mt-4 pt-2 border-t border-neutral-100">
              {(['1W', '1M', '3M', 'YTD', 'ALL'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => {
                    setSelectedTimeframe(tf);
                    toast(`Timeframe updated to ${tf}`, { icon: '⏱️' });
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedTimeframe === tf 
                      ? 'bg-neutral-900 text-white shadow-2xs' 
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Bottom Live Payment Action Button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setIsSimulateModalOpen(true)}
                className="px-4 py-2 rounded-full border border-neutral-300 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 flex items-center gap-2 transition-all shadow-2xs"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Trigger ₹420 Live Payment</span>
              </button>
            </div>

          </div>

          {/* CARD 2: COLLECTIONS IN OCTOBER > */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-7 shadow-xs">
            
            {/* Top row */}
            <div className="flex items-center justify-between mb-4">
              <div 
                onClick={() => navigate('/transactions')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-700 cursor-pointer transition-colors"
              >
                <span>COLLECTIONS IN OCTOBER</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>

              <button
                onClick={() => navigate('/transactions')}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 text-sm font-bold transition-colors"
                title="View All Transactions"
              >
                +
              </button>
            </div>

            {/* Sub-layout: Mini Calendar on Left, Recent Txns on Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Big Total + Mini Calendar Grid */}
              <div className="md:col-span-5 space-y-4">
                <div>
                  <div className="text-3xl font-semibold tracking-tight text-[#111827]">
                    ₹{todayCollections.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {todayCount} settled transactions on Oct {selectedDay}
                  </div>
                </div>

                {/* Calendar Days Grid */}
                <div className="bg-neutral-50/70 p-3 rounded-2xl border border-neutral-100">
                  <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-neutral-400 mb-2">
                    <span>S</span>
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {calendarDays.map((day) => {
                      const isSelected = day === selectedDay;
                      return (
                        <button
                          key={day}
                          onClick={() => handleSelectCalendarDay(day)}
                          className={`w-7 h-7 flex items-center justify-center mx-auto text-xs rounded-lg transition-all ${
                            isSelected
                              ? 'bg-[#0091FF] text-white font-bold shadow-xs scale-105'
                              : 'text-neutral-600 hover:bg-neutral-200/60'
                          }`}
                          title={`View October ${day}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#0091FF]" />
                  <span>October {selectedDay} · Click any day to filter</span>
                </div>
              </div>

              {/* Right Column: Recent Transactions Stream */}
              <div className="md:col-span-7 border-t md:border-t-0 md:border-l md:border-neutral-100 md:pl-6 pt-4 md:pt-0 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  <span>RECENT TRANSACTIONS</span>
                  <button 
                    onClick={() => navigate('/transactions')}
                    className="text-neutral-500 hover:text-neutral-900 font-medium normal-case flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="divide-y divide-neutral-100">
                  {transactions.slice(0, 5).map((txn) => (
                    <div 
                      key={txn.id} 
                      onClick={() => setSelectedTxnModal(txn)}
                      className="py-2.5 flex items-center justify-between gap-3 group hover:bg-neutral-50 rounded-xl px-2 -mx-2 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-neutral-200/80 flex items-center justify-center text-neutral-600 shrink-0 transition-colors">
                          {txn.mode === 'PAYTM_WALLET' ? (
                            <Smartphone className="w-4 h-4 text-[#002970]" />
                          ) : (
                            <Radio className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-[#111827] truncate group-hover:text-neutral-900">
                            {txn.customer}
                          </div>
                          <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                            <span>{txn.timestamp}</span>
                            <span>·</span>
                            <span className="text-emerald-700 font-medium">{txn.ackStatus === 'ANNOUNCED' ? 'SB Announced' : 'Logged'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-[#111827]">
                          +₹{txn.amount.toFixed(2)}
                        </div>
                        <button 
                          onClick={(e) => copyTxn(txn.id, e)}
                          className="text-[10px] text-neutral-400 hover:text-neutral-700 font-mono flex items-center gap-0.5 ml-auto transition-colors"
                          title="Copy ID"
                        >
                          <span>{copiedTxnId === txn.id ? 'Copied' : txn.id}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ── RIGHT COLUMN (~34% width Stack) ─────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* RIGHT CARD 1: COMPLETE ONBOARDING (Deep Forest Green Banner) */}
          {!dismissedBanner && (
            <div 
              onClick={() => setIsOnboardingModalOpen(true)}
              className="bg-[#14321A] text-white rounded-3xl p-6 shadow-sm relative overflow-hidden cursor-pointer hover:bg-[#16381d] transition-colors group"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-emerald-200/80 mb-3">
                <span>COMPLETE ONBOARDING</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissedBanner(true);
                  }}
                  className="text-white/60 hover:text-white transition-colors p-1"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 
                className="text-2xl font-normal leading-snug text-white mb-6 group-hover:translate-x-0.5 transition-transform"
                style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
              >
                Make the most of Tara
              </h3>

              {/* 3-segment progress bar */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="h-1.5 rounded-full bg-white" />
                <div className="h-1.5 rounded-full bg-white/20" />
                <div className="h-1.5 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-100/70 font-medium">
                <span>33% complete</span>
                <span className="text-[11px] underline">View 3 steps →</span>
              </div>
            </div>
          )}

          {/* RIGHT CARD 2: PERSONAL RECAP (Tara Operations Brief & Device Alert) */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
              <span>PERSONAL RECAP</span>
              <button 
                onClick={() => navigate('/devices')}
                className="text-neutral-400 hover:text-neutral-600"
                title="View Diagnostics"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Test Invariant Alert if active, else healthy daily brief */}
            {(urgentActionCount > 0 || state.system_status?.status_label === '1 Device Needs Attention' || state.devices?.some(d => d.status === 'OFFLINE')) ? (
              <div>
                <h3 
                  className="text-xl text-[#111827] font-normal mb-1.5"
                  style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
                >
                  {state.system_status?.status_label || '1 Device Needs Attention'}
                </h3>
                <p className="text-xs text-rose-700 font-medium mb-3">
                  {state.system_status?.subtext || 'Soundbox SB-4421 is offline (12% battery, last seen 6.5h ago)'}
                </p>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('tara:open_panel'));
                    toast('Tara AI Co-pilot opening in-place...', { icon: '🤖' });
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                  <span>Resolve with Tara →</span>
                </button>
              </div>
            ) : (
              <div>
                <h3 
                  className="text-xl text-[#111827] font-normal mb-1.5"
                  style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
                >
                  Daily operations brief
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                  Soundbox SB-4421 connected on 4G Airtel. Zero missed audio announcements. All 68 transactions verified across switches.
                </p>
                <button 
                  onClick={() => navigate('/devices')}
                  className="w-full flex items-center justify-between text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-2 rounded-xl border border-emerald-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Autonomous surveillance active</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT CARD 3: BUDGET IN OCTOBER > (Settlements & Cash Sweep) */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs">
            <div 
              onClick={() => navigate('/settlements')}
              className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2 cursor-pointer hover:text-neutral-700 transition-colors"
            >
              <span>BUDGET IN OCTOBER</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            </div>

            <h3 
              className="text-xl text-[#111827] font-normal mb-3"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
            >
              Budget your money.
            </h3>

            <div 
              onClick={() => navigate('/settlements')}
              className="h-1.5 w-full bg-neutral-100 rounded-full mb-2 overflow-hidden cursor-pointer"
            >
              <div className="h-full bg-neutral-900 rounded-full w-0" />
            </div>
            <div className="text-[11px] text-neutral-400 mb-4">
              ₹0 of ₹50,000 sweep cap used
            </div>

            <button
              onClick={() => navigate('/settlements')}
              className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Review Settlements
            </button>
          </div>

          {/* RIGHT CARD 4: CREDIT SCORE > (Soundbox Hardware Fleet) */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs">
            <div 
              onClick={() => navigate('/offers')}
              className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2 cursor-pointer hover:text-neutral-700 transition-colors"
            >
              <span>CREDIT SCORE</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            </div>

            <h3 
              className="text-xl text-[#111827] font-normal mb-2"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
            >
              Track your credit score.
            </h3>

            <div className="text-xs text-neutral-500 leading-relaxed mb-4">
              Monitor merchant pre-approved working capital loan and Soundbox 4G hardware upgrades ({successRate.toFixed(1)}% audible rate).
            </div>

            <button
              onClick={() => navigate('/devices')}
              className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Connect Soundbox Fleet
            </button>
          </div>

        </div>

      </div>

      {/* ── QUICK ENTERPRISE OPERATIONS BAR ───────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        <button
          onClick={() => navigate('/devices')}
          className="p-4 rounded-2xl bg-white border border-neutral-200/80 hover:border-neutral-900 text-left transition-all shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-[#111827]">Soundbox Fleet</div>
          <div className="text-[11px] text-neutral-400">SB-4421 Telemetry & Audio</div>
        </button>

        <button
          onClick={() => navigate('/settlements')}
          className="p-4 rounded-2xl bg-white border border-neutral-200/80 hover:border-neutral-900 text-left transition-all shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-[#111827]">Settlements (T+0)</div>
          <div className="text-[11px] text-neutral-400">HDFC A/c •••• 1111</div>
        </button>

        <button
          onClick={() => navigate('/mobile')}
          className="p-4 rounded-2xl bg-white border border-neutral-200/80 hover:border-neutral-900 text-left transition-all shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-[#111827]">Mobile PWA Shell</div>
          <div className="text-[11px] text-neutral-400">Dedicated Mobile View</div>
        </button>

        <button
          onClick={() => navigate('/integration')}
          className="p-4 rounded-2xl bg-white border border-neutral-200/80 hover:border-neutral-900 text-left transition-all shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-[#111827]">Paytm Architecture</div>
          <div className="text-[11px] text-neutral-400">API Middleware & Blueprint</div>
        </button>
      </div>

      {/* ── MODAL 1: TRANSACTION DETAIL SLIDE-OVER / MODAL ──────────────── */}
      {selectedTxnModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm text-neutral-900">Payment Audit Trail</h3>
              </div>
              <button 
                onClick={() => setSelectedTxnModal(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2 bg-neutral-50 rounded-2xl border border-neutral-100">
              <div className="text-3xl font-extrabold text-[#111827]">
                ₹{selectedTxnModal.amount.toFixed(2)}
              </div>
              <div className="text-xs font-semibold text-emerald-700 mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>NPCI Switch Confirmed & Settled</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-400">Order / Transaction ID</span>
                <button 
                  onClick={() => copyTxn(selectedTxnModal.id)}
                  className="font-mono font-bold text-neutral-800 hover:text-blue-600 flex items-center gap-1"
                >
                  <span>{selectedTxnModal.id}</span>
                  <Copy className="w-3 h-3 text-neutral-400" />
                </button>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-400">Customer Name</span>
                <span className="font-semibold text-neutral-900">{selectedTxnModal.customer}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-400">Virtual Payment Address (VPA)</span>
                <span className="font-mono text-neutral-700">{selectedTxnModal.vpa}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-400">Hardware Soundbox Device</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {selectedTxnModal.device} · {selectedTxnModal.ackLatency}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-400">Bank Reference RRN</span>
                <span className="font-mono text-neutral-600">{selectedTxnModal.rrn || '430918239012'}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  toast.success('Official GST receipt generated!');
                  setSelectedTxnModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-neutral-500" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => {
                  setSelectedTxnModal(null);
                  navigate('/disputes');
                }}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Report Dispute</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: SIMULATE LIVE PAYMENT MODAL ───────────────────────── */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-neutral-900">Simulate Real-Time UPI Payment</h3>
              </div>
              <button 
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              Triggers a live UPI transaction. Synchronizes in real time across this Web Dashboard, the Soundbox Hardware speaker, and the Mobile PWA tab!
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Preset Amounts (₹)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 420, 1250, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSimAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        simAmount === amt
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/70'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={simCustomer}
                  onChange={(e) => setSimCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI_QR', 'RUPAY_CREDIT', 'PAYTM_WALLET'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSimMode(mode)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all ${
                        simMode === mode
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSimulatePaymentSubmit}
                className="w-full py-3 rounded-2xl bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Broadcast ₹{simAmount} Payment Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: ONBOARDING CHECKLIST MODAL ─────────────────────────── */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-900">Merchant Setup Checklist</h3>
              <button 
                onClick={() => setIsOnboardingModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-neutral-900">Step 1: Store & Identity KYC</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Kumar Stores verified with Paytm Payment Gateway.</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-neutral-900">Step 2: 4G Soundbox SB-4421</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Online with low-latency audio acknowledgement active.</div>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-start gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-neutral-900">Step 3: Automated Daily Cash Sweeps</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Configure nightly auto-sweep balance to primary current account.</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setIsOnboardingModalOpen(false);
                  navigate('/settlements');
                }}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-colors text-center"
              >
                Configure Cash Sweep →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
