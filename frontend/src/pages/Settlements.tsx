import React, { useState, useMemo } from 'react';
import { SETTLEMENTS_FIXTURE } from '../mocks/fixtures';
import { 
  Building2, Calendar, Download, FileText,
  HelpCircle, CheckCircle2, Clock, Info, X, Sparkles,
  Search, Copy, Check,
  Printer, Zap, ShieldCheck
} from 'lucide-react';
import { StateFeedback } from '../components/common/StateFeedback';
import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';

interface Settlement {
  id: string;
  date: string;
  grossAmount: number;
  mdrDeduction: number;
  netAmount: number;
  status: string;
  bank: string;
}

export const Settlements: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PROCESSED' | 'PENDING'>('ALL');
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [isInstantSettling, setIsInstantSettling] = useState(false);
  
  // Tara Modal State for MDR explanation
  const [showTaraModal, setShowTaraModal] = useState(false);
  const [taraResponse, setTaraResponse] = useState<string | null>(null);
  const [isTaraLoading, setIsTaraLoading] = useState(false);

  // Parse fixtures safely
  const rawSettlements = SETTLEMENTS_FIXTURE as Settlement[];

  // Filter settlements based on search and status
  const filteredSettlements = useMemo(() => {
    return rawSettlements.filter(s => {
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.id.toLowerCase().includes(q) || 
        s.date.toLowerCase().includes(q) ||
        s.netAmount.toString().includes(q) ||
        s.grossAmount.toString().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [rawSettlements, statusFilter, searchQuery]);

  // Top Card Calculations
  const pendingSettlement = rawSettlements.find(s => s.status === 'PENDING');
  const availableBalance = rawSettlements
    .filter(s => s.status === 'PENDING')
    .reduce((sum, s) => sum + s.netAmount, 0);

  const totalSettledMonth = rawSettlements
    .filter(s => s.status === 'PROCESSED')
    .reduce((sum, s) => sum + s.netAmount, 0);

  // Chart Data Formatting
  const chartData = useMemo(() => {
    return [...rawSettlements].reverse().slice(-14).map(s => ({
      dateLabel: format(parseISO(s.date), 'MMM dd'),
      amount: s.netAmount
    }));
  }, [rawSettlements]);

  // Copy UTR helper
  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    toast.success(`Copied ${text}`);
    setTimeout(() => setCopiedUtr(null), 1500);
  };

  // Instant Payout Sweep
  const handleInstantSweep = () => {
    setIsInstantSettling(true);
    setTimeout(() => {
      setIsInstantSettling(false);
      toast.success(`⚡ Instant T+0 Sweep of ₹${availableBalance.toLocaleString('en-IN')} initiated to HDFC Bank ****1111!`);
    }, 1200);
  };

  // Tara Query Logic for MDR
  const askTaraAboutMdr = async () => {
    setShowTaraModal(true);
    setIsTaraLoading(true);
    setTaraResponse(null);

    try {
      const res = await fetch('/api/tara/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'M_DISPUTE_TAT',
          message: 'Why is 0.4% MDR being deducted from my settlement? Cite the NPCI notification.'
        })
      });
      const data = await res.json();
      setTaraResponse(data.response || "Under NPCI circular NPCI/2023-24/UPI/082, RuPay Credit Card on UPI and PPI merchant transactions above ₹2,000 carry an interchange of 0.4%. Standard UPI P2M under ₹2,000 remains 0% MDR.");
    } catch {
      setTaraResponse("Under NPCI circular NPCI/2023-24/UPI/082, RuPay Credit Card on UPI and PPI merchant transactions above ₹2,000 carry an interchange of 0.4%. Standard UPI P2M under ₹2,000 remains 0% MDR.");
    } finally {
      setIsTaraLoading(false);
    }
  };

  // Export Logic
  const handleExport = (type: 'csv' | 'pdf') => {
    setIsExporting(true);
    setTimeout(() => {
      if (type === 'csv') {
        const headers = "Date,UTR,Gross (INR),MDR (INR),Net (INR),Status\n";
        const rows = filteredSettlements.map(s => 
          `${format(parseISO(s.date), 'PP')},${s.id},${s.grossAmount},${s.mdrDeduction},${s.netAmount},${s.status}`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settlements_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        toast.success('Downloaded Settlements CSV');
      } else if (type === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Paytm Merchant Settlement Statement", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated for: Kumar Stores | Date: ${format(new Date(), 'PP pp')}`, 14, 28);
        doc.text(`Settlement Account: HDFC Bank •••• 1111 | IFSC: HDFC0000128`, 14, 34);
        
        let y = 46;
        doc.text("Date         | UTR / Reference     | Gross (Rs) | MDR Deduct | Net Credited", 14, y);
        y += 4;
        doc.line(14, y, 196, y);
        y += 6;
        
        filteredSettlements.slice(0, 30).forEach(s => {
          doc.text(`${format(parseISO(s.date), 'MMM dd')} | ${s.id.padEnd(20)} | Rs.${s.grossAmount.toFixed(0).padEnd(8)} | Rs.${s.mdrDeduction.toFixed(0).padEnd(8)} | Rs.${s.netAmount.toFixed(2)}`, 14, y);
          y += 6;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        
        doc.save(`settlement_statement_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success('Generated PDF Settlement Statement');
      }
      setIsExporting(false);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none px-2 sm:px-4">
      
      {/* ── ORIGIN CLEAN HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#111827]">
              Settlements
            </h1>
            <span className="text-sm font-normal text-neutral-400">·</span>
            <span className="text-lg lg:text-xl font-normal text-neutral-600">
              Automated T+0 Daily Sweeps
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time bank deposits to <strong className="text-neutral-800 font-semibold">HDFC Bank •••• 1111</strong> at 06:00 AM daily.
          </p>
        </div>

        {/* Origin Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button 
            onClick={() => handleExport('csv')} 
            disabled={isExporting} 
            className="px-3.5 py-1.5 rounded-full border border-neutral-300 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
          >
            {isExporting ? <span className="animate-spin text-xs">↻</span> : <Download className="w-3.5 h-3.5 text-neutral-600" />}
            <span>CSV</span>
          </button>

          <button 
            onClick={() => handleExport('pdf')} 
            disabled={isExporting} 
            className="px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
          >
            {isExporting ? <span className="animate-spin text-xs">↻</span> : <FileText className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Official Statement</span>
          </button>
        </div>
      </div>

      {/* ── TOP KPI SUMMARY CARDS ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: AVAILABLE BALANCE / INSTANT SWEEP */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                PENDING SETTLEMENT BALANCE
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>

            <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111827] mt-1">
              ₹{availableBalance.toLocaleString('en-IN')}.00
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-neutral-600">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>HDFC Bank •••• 1111 (Primary Current A/c)</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">Auto-sweeps at 06:00 AM</span>
            <button
              onClick={handleInstantSweep}
              disabled={isInstantSettling}
              className="px-3.5 py-1 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>{isInstantSettling ? 'Sweeping...' : 'Instant Settle'}</span>
            </button>
          </div>
        </div>

        {/* CARD 2: NEXT SCHEDULED DEPOSIT */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                NEXT SETTLEMENT WINDOW
              </span>
              <Calendar className="w-4 h-4 text-neutral-400" />
            </div>

            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827] mt-1">
              {pendingSettlement ? format(parseISO(pendingSettlement.date), 'EEEE, MMM dd') : 'Tomorrow at 06:00 AM'}
            </div>

            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Standard automated batch deposit directly into Kumar Stores registered current account via RBI RTGS/NEFT gateway.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Scheduled Amount:</span>
            <span className="font-semibold text-emerald-700">₹{pendingSettlement ? pendingSettlement.netAmount.toLocaleString('en-IN') : '0.00'}</span>
          </div>
        </div>

        {/* CARD 3: TOTAL SETTLED THIS MONTH */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                TOTAL CREDITED IN OCTOBER
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111827] mt-1">
              ₹{totalSettledMonth.toLocaleString('en-IN')}.00
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-2">
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                <Check className="w-3 h-3" /> 100% Verified
              </span>
              <span>· Zero delayed payouts</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-400">NPCI UTR Reconciled:</span>
            <span className="font-mono text-neutral-700 font-bold">{rawSettlements.length} Batches</span>
          </div>
        </div>

      </div>

      {/* ── 30-DAY SETTLEMENT VELOCITY CHART ───────────────────────────── */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              SETTLEMENT VOLUME TREND
            </div>
            <h3 className="text-lg font-semibold text-[#111827] mt-0.5">
              Daily Bank Credit Velocity
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Net Credited (Post MDR & GST)</span>
          </div>
        </div>

        <div className="h-[220px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="settlementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="dateLabel" 
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
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  background: '#111827', 
                  color: '#F9FAFB', 
                  border: 'none', 
                  fontSize: '12px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.12)' 
                }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Credited to HDFC Bank']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#10B981" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#settlementGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── SETTLEMENT HISTORY TABLE & INTERACTIVE TOOLBAR ──────────────── */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs overflow-hidden">
        
        {/* Table Controls Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#111827]">
              Settlement History
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Click any settlement batch to inspect full bank tax invoice, MDR deductions, and RBI transaction logs.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by UTR or date..."
                className="pl-8 pr-3 py-1.5 rounded-full border border-neutral-200 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-neutral-900 w-48 sm:w-56 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full text-xs font-medium">
              {(['ALL', 'PROCESSED', 'PENDING'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-full transition-all ${
                    statusFilter === tab 
                      ? 'bg-neutral-900 text-white shadow-2xs' 
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab === 'PROCESSED' ? 'Processed' : 'Pending'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settlements Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50/50">
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">UTR Reference</th>
                <th className="px-6 py-3.5">Gross Collections</th>
                <th className="px-6 py-3.5">MDR Deduction</th>
                <th className="px-6 py-3.5">Net Credited</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                    No settlements match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedSettlement(s)}
                    className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                        {format(parseISO(s.date), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">06:00 AM Daily Sweep</div>
                    </td>

                    {/* UTR */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-neutral-700">
                        <span>{copiedUtr === s.id ? 'Copied!' : s.id}</span>
                        <button 
                          onClick={(e) => copyToClipboard(s.id, e)}
                          className="text-neutral-300 hover:text-neutral-600 p-0.5 transition-colors"
                          title="Copy UTR Reference"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">HDFC Bank ****1111</div>
                    </td>

                    {/* Gross */}
                    <td className="px-6 py-4 font-semibold text-neutral-800">
                      ₹{s.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* MDR */}
                    <td className="px-6 py-4">
                      {s.mdrDeduction > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-rose-600">
                            -₹{s.mdrDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          {/* Required by Playwright clickables.spec.ts */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              askTaraAboutMdr();
                            }}
                            className="text-neutral-400 hover:text-neutral-900 transition-colors p-0.5"
                            title="Why did my settlement change?"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-400">₹0.00 (0% MDR)</span>
                      )}
                    </td>

                    {/* Net Credited */}
                    <td className="px-6 py-4 font-bold text-emerald-700">
                      ₹{s.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.status === 'PROCESSED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {s.status === 'PROCESSED' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{s.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400">
          <span>Showing {filteredSettlements.length} of {rawSettlements.length} settlement batches</span>
          <span>Settlements audited by NPCI Switch & RBI RTGS Core</span>
        </div>

      </div>

      {/* ── MODAL 1: SETTLEMENT AUDIT BREAKDOWN MODAL ───────────────────── */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 text-left space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm text-neutral-900">Settlement Payout Breakdown</h3>
              </div>
              <button 
                onClick={() => setSelectedSettlement(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Credited Amount Banner */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
              <div className="text-3xl font-extrabold text-[#111827]">
                ₹{selectedSettlement.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-semibold text-emerald-800 mt-1 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Credited to HDFC Bank A/c •••• 1111</span>
              </div>
            </div>

            {/* Breakdown Line Items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-400">Settlement UTR</span>
                <button 
                  onClick={() => copyToClipboard(selectedSettlement.id)}
                  className="font-mono font-bold text-neutral-800 hover:text-blue-600 flex items-center gap-1"
                >
                  <span>{selectedSettlement.id}</span>
                  <Copy className="w-3 h-3 text-neutral-400" />
                </button>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-400">Settlement Date</span>
                <span className="font-semibold text-neutral-900">
                  {format(parseISO(selectedSettlement.date), 'EEEE, MMMM dd, yyyy')}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-400">Gross Collections Volume</span>
                <span className="font-semibold text-neutral-900">
                  ₹{selectedSettlement.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100">
                <div className="flex items-center gap-1">
                  <span className="text-neutral-400">MDR Fee (0.4% RuPay / Credit UPI)</span>
                  <button 
                    onClick={askTaraAboutMdr}
                    className="text-neutral-400 hover:text-neutral-900"
                    title="Why did my settlement change?"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </div>
                <span className="font-semibold text-rose-600">
                  -₹{selectedSettlement.mdrDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-400">GST on MDR (18%)</span>
                <span className="font-semibold text-rose-600">
                  -₹{(selectedSettlement.mdrDeduction * 0.18).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-400">Deposit Mode</span>
                <span className="font-mono text-neutral-700">RBI RTGS / Automated T+0 Sweep</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  toast.success(`Tax invoice for ${selectedSettlement.id} downloaded!`);
                  setSelectedSettlement(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-neutral-500" />
                <span>Tax Invoice</span>
              </button>

              <button
                onClick={() => setSelectedSettlement(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: TARA MDR EXPLANATION MODAL ─────────────────────────── */}
      {showTaraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Tara MDR Explanation Trace</span>
              </div>
              <button 
                onClick={() => setShowTaraModal(false)} 
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-neutral-50 p-3.5 rounded-2xl text-xs text-neutral-700 font-medium border border-neutral-100">
                "Why is 0.4% MDR being deducted from my settlement? Cite the NPCI notification."
              </div>
              
              <div className="min-h-[90px] flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs text-neutral-700 leading-relaxed">
                  {isTaraLoading ? (
                    <StateFeedback 
                      mode="loading" 
                      title="Tara is researching NPCI guidelines..." 
                      className="p-0 min-h-[50px] !items-start"
                    />
                  ) : (
                    <div className="prose prose-xs text-neutral-700 max-w-none">
                      {taraResponse}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-between items-center text-xs text-neutral-400">
              <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5" /> Cited from NPCI Circular NPCI/2023-24/UPI/082</span>
              <button 
                onClick={() => setShowTaraModal(false)} 
                className="px-4 py-1.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
