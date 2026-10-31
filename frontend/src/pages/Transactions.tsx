import React, { useState, useMemo } from 'react';
import { TRANSACTIONS_FIXTURE } from '../mocks/fixtures';
import { 
  Search, Filter, Download, CreditCard, Smartphone, Wallet, 
  X, CheckCircle2, XCircle, Clock, AlertTriangle, FileText
} from 'lucide-react';
import { StateFeedback } from '../components/common/StateFeedback';
import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';

interface TimelineEvent {
  status: string;
  time?: string | null;
  completed: boolean;
  error?: string;
}

interface Transaction {
  id: string;
  customer: string;
  amount: number;
  mode: string;
  status: string;
  settlementStatus: string;
  timestamp: string;
  maskedAccount: string;
  timeline: TimelineEvent[];
  hasDispute: boolean;
  disputeId?: string;
}

export const Transactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial load
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Simulate loading on filter change
  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, modeFilter, dateRange]);

  // ── FILTER LOGIC ──
  const filteredTransactions = useMemo(() => {
    return (TRANSACTIONS_FIXTURE as Transaction[]).filter(txn => {
      const matchSearch = txn.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          txn.customer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || txn.status === statusFilter;
      const matchMode = modeFilter === 'ALL' || txn.mode.includes(modeFilter);
      
      let matchDate = true;
      if (dateRange !== 'ALL') {
        const txnDate = new Date(txn.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - txnDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (dateRange === 'TODAY' && diffDays > 1) matchDate = false;
        if (dateRange === '7D' && diffDays > 7) matchDate = false;
        if (dateRange === '14D' && diffDays > 14) matchDate = false;
      }

      return matchSearch && matchStatus && matchMode && matchDate;
    });
  }, [searchTerm, statusFilter, modeFilter, dateRange]);

  // ── SUMMARY METRICS ──
  const metrics = useMemo(() => {
    const successTxns = filteredTransactions.filter(t => t.status === 'SUCCESS');
    const totalCount = filteredTransactions.length;
    const gtv = successTxns.reduce((sum, t) => sum + t.amount, 0);
    const avgTicket = totalCount > 0 ? (gtv / successTxns.length) || 0 : 0;
    
    const settledCount = successTxns.filter(t => t.settlementStatus === 'SETTLED').length;
    const settledPercent = successTxns.length > 0 ? (settledCount / successTxns.length) * 100 : 0;

    return {
      gtv,
      totalCount,
      avgTicket,
      settledPercent
    };
  }, [filteredTransactions]);

  // ── EXPORT LOGIC ──
  const handleExport = (type: 'csv' | 'pdf') => {
    setIsExporting(true);
    setTimeout(() => {
      if (type === 'csv') {
        const headers = "Txn ID,Date,Customer,Mode,Account,Amount,Status,Settlement\n";
        const rows = filteredTransactions.map(t => 
          `${t.id},${format(parseISO(t.timestamp), 'PP pp')},${t.customer},${t.mode},${t.maskedAccount},${t.amount},${t.status},${t.settlementStatus}`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
      } else if (type === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Transaction Statement", 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated on: ${format(new Date(), 'PP pp')}`, 14, 30);
        
        // Very basic PDF table simulation
        let y = 45;
        doc.setFontSize(9);
        doc.text("Txn ID | Date | Amount | Status", 14, y);
        y += 5;
        doc.line(14, y, 196, y);
        y += 5;
        
        filteredTransactions.slice(0, 30).forEach(t => {
          doc.text(`${t.id} | ${format(parseISO(t.timestamp), 'MMM dd')} | Rs.${t.amount} | ${t.status}`, 14, y);
          y += 6;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        if (filteredTransactions.length > 30) {
          doc.text(`... and ${filteredTransactions.length - 30} more rows.`, 14, y + 5);
        }
        
        doc.save(`statement_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      }
      setIsExporting(false);
    }, 800);
  };

  // ── HELPERS ──
  const getModeIcon = (mode: string) => {
    if (mode.includes('UPI')) return <Smartphone className="w-4 h-4" />;
    if (mode.includes('Card')) return <CreditCard className="w-4 h-4" />;
    return <Wallet className="w-4 h-4" />;
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col pb-10 relative">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">Transactions</h1>
          <p className="text-navy/70">Real-time ledger of all payments, refunds, and settlements.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} disabled={isExporting} className="bg-white-panel border border-soft-border text-navy px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-light-bg transition-colors disabled:opacity-50">
            {isExporting ? <span className="animate-spin">↻</span> : <Download className="w-4 h-4" />} CSV
          </button>
          <button onClick={() => handleExport('pdf')} disabled={isExporting} className="bg-paytm-blue text-white-panel px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-navy transition-colors disabled:opacity-50">
            {isExporting ? <span className="animate-spin">↻</span> : <FileText className="w-4 h-4" />} PDF Statement
          </button>
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white-panel p-5 rounded-xl border border-soft-border shadow-sm">
          <p className="text-sm font-medium text-navy/60 mb-1">GTV (Successful)</p>
          <h3 className="text-2xl font-bold text-navy">₹{metrics.gtv.toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-white-panel p-5 rounded-xl border border-soft-border shadow-sm">
          <p className="text-sm font-medium text-navy/60 mb-1">Transaction Count</p>
          <h3 className="text-2xl font-bold text-navy">{metrics.totalCount}</h3>
        </div>
        <div className="bg-white-panel p-5 rounded-xl border border-soft-border shadow-sm">
          <p className="text-sm font-medium text-navy/60 mb-1">Average Ticket Size</p>
          <h3 className="text-2xl font-bold text-navy">₹{Math.round(metrics.avgTicket).toLocaleString('en-IN')}</h3>
        </div>
        <div className="bg-white-panel p-5 rounded-xl border border-soft-border shadow-sm">
          <p className="text-sm font-medium text-navy/60 mb-1">% Settled (of Success)</p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-navy">{metrics.settledPercent.toFixed(1)}%</h3>
            <div className="flex-1 h-2 bg-light-bg rounded-full overflow-hidden mt-1">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${metrics.settledPercent}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white-panel p-4 rounded-t-xl border border-soft-border border-b-0 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-navy/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by Order ID or Customer..." 
            className="w-full pl-9 pr-4 py-2 border border-soft-border rounded-lg text-sm focus:outline-none focus:border-paytm-blue transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 border border-soft-border rounded-lg px-3 py-1.5 bg-light-bg">
          <Filter className="w-4 h-4 text-navy/60" />
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-transparent text-sm font-medium text-navy outline-none cursor-pointer">
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="7D">Last 7 Days</option>
            <option value="14D">Last 14 Days</option>
          </select>
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-soft-border rounded-lg px-3 py-2 text-sm font-medium text-navy focus:outline-none focus:border-paytm-blue bg-light-bg cursor-pointer">
          <option value="ALL">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>

        <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className="border border-soft-border rounded-lg px-3 py-2 text-sm font-medium text-navy focus:outline-none focus:border-paytm-blue bg-light-bg cursor-pointer">
          <option value="ALL">All Modes</option>
          <option value="UPI">UPI</option>
          <option value="Card">Cards</option>
          <option value="Wallet">Wallet</option>
        </select>
      </div>
      
      {/* TABLE */}
      <div className="bg-white-panel rounded-b-xl shadow-sm border border-soft-border overflow-x-auto flex-1 relative min-h-[400px]">
        <table className="w-full text-left">
          <thead className="bg-light-bg border-b border-soft-border sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-navy/60 uppercase">Date & Time</th>
              <th className="px-6 py-4 text-xs font-semibold text-navy/60 uppercase">Txn ID / Customer</th>
              <th className="px-6 py-4 text-xs font-semibold text-navy/60 uppercase">Mode / Account</th>
              <th className="px-6 py-4 text-xs font-semibold text-navy/60 uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-navy/60 uppercase">Txn Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-navy/60 uppercase">Settlement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soft-border">
            {isLoading ? (
              // SKELETON ROWS
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  <td className="px-6 py-4"><div className="h-4 bg-soft-border/50 rounded w-24 mb-2 animate-pulse"></div><div className="h-3 bg-soft-border/50 rounded w-16 animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-soft-border/50 rounded w-28 mb-2 animate-pulse"></div><div className="h-3 bg-soft-border/50 rounded w-20 animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-soft-border/50 rounded w-20 mb-2 animate-pulse"></div><div className="h-3 bg-soft-border/50 rounded w-24 animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-soft-border/50 rounded w-16 animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-soft-border/50 rounded-full w-20 animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-soft-border/50 rounded w-16 animate-pulse"></div></td>
                </tr>
              ))
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <StateFeedback 
                    mode="empty" 
                    title="No transactions found" 
                    message="Try adjusting your filters or search term." 
                    className="py-20"
                  />
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
                <tr 
                  key={txn.id} 
                  onClick={() => setSelectedTxn(txn)}
                  className="hover:bg-light-bg/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-navy">{format(parseISO(txn.timestamp), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-navy/60">{format(parseISO(txn.timestamp), 'hh:mm a')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-paytm-blue group-hover:underline">{txn.id}</div>
                    <div className="text-xs text-navy/70">{txn.customer}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-navy">
                      {getModeIcon(txn.mode)} {txn.mode}
                    </div>
                    <div className="text-xs text-navy/60 tracking-wider mt-0.5">{txn.maskedAccount}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-navy">₹{txn.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1 ${
                      txn.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 
                      txn.status === 'FAILED' ? 'bg-red-100 text-red-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {txn.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                      {txn.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                      {txn.status === 'PENDING' && <Clock className="w-3 h-3" />}
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {txn.status === 'SUCCESS' ? (
                      <span className={`text-[11px] font-bold uppercase tracking-wide ${
                        txn.settlementStatus === 'SETTLED' ? 'text-green-600' : 'text-amber-500'
                      }`}>
                        {txn.settlementStatus}
                      </span>
                    ) : (
                      <span className="text-[11px] text-navy/40 uppercase font-medium">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL DRAWER OVERLAY */}
      {selectedTxn && (
        <div className="absolute inset-0 z-20 flex justify-end overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-navy/20 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedTxn(null)} />
          <div className="w-[400px] h-full bg-light-bg shadow-2xl pointer-events-auto transform transition-transform border-l border-soft-border flex flex-col">
            <div className="p-6 border-b border-soft-border bg-white-panel flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-navy mb-1">{selectedTxn.id}</h2>
                <p className="text-sm text-navy/60">{format(parseISO(selectedTxn.timestamp), 'PPP at pp')}</p>
              </div>
              <button onClick={() => setSelectedTxn(null)} className="p-2 bg-light-bg rounded-full hover:bg-soft-border/50 transition-colors">
                <X className="w-5 h-5 text-navy" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {selectedTxn.hasDispute && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Active Dispute</h4>
                    <p className="text-xs text-red-700 mt-1 mb-2">This transaction has an open chargeback/dispute.</p>
                    <Link to="/disputes" className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors inline-block">
                      View Dispute {selectedTxn.disputeId}
                    </Link>
                  </div>
                </div>
              )}

              <div className="bg-white-panel border border-soft-border rounded-xl p-5 mb-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-soft-border border-dashed">
                  <span className="text-sm text-navy/60">Amount</span>
                  <span className="text-xl font-bold text-navy">₹{selectedTxn.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-navy/60">Customer</span>
                  <span className="text-sm font-bold text-navy">{selectedTxn.customer}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-navy/60">Payment Mode</span>
                  <span className="text-sm font-bold text-navy flex items-center gap-1">
                    {getModeIcon(selectedTxn.mode)} {selectedTxn.mode}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-navy/60">Account</span>
                  <span className="text-sm font-medium text-navy">{selectedTxn.maskedAccount}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 px-1">Transaction Timeline</h3>
              
              <div className="relative pl-6 space-y-6">
                <div className="absolute top-2 bottom-2 left-2.5 w-0.5 bg-soft-border"></div>
                
                {selectedTxn.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-6 w-3 h-3 rounded-full border-2 ${
                      step.completed && step.status === 'Failed' ? 'bg-red-500 border-red-500' :
                      step.completed ? 'bg-green-500 border-green-500' : 
                      'bg-light-bg border-soft-border'
                    }`}></div>
                    <div>
                      <h4 className={`text-sm font-bold ${
                        step.status === 'Failed' ? 'text-red-600' :
                        step.completed ? 'text-navy' : 'text-navy/40'
                      }`}>{step.status}</h4>
                      {step.time && <p className="text-xs text-navy/60 mt-0.5">{format(parseISO(step.time), 'PP pp')}</p>}
                      {step.error && <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded-md inline-block border border-red-100">{step.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
