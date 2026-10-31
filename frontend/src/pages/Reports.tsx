import React, { useState, useMemo } from 'react';
import { TRANSACTIONS_FIXTURE } from '../mocks/fixtures';
import { useDerivedState } from '../context/DerivedStateContext';
import { 
  TrendingUp, PieChart as PieChartIcon, 
  Download, Sparkles, CalendarDays, Activity
} from 'lucide-react';
import { format, parseISO, getDay, getHours } from 'date-fns';
import { jsPDF } from 'jspdf';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

export const Reports: React.FC = () => {
  const { state } = useDerivedState();
  const [isExporting, setIsExporting] = useState(false);
  
  // LLM Summary State
  const [llmSummary, setLlmSummary] = useState<string | null>(null);
  const [isLlmLoading, setIsLlmLoading] = useState(false);

  // === DATA AGGREGATION FROM SINGLE SOURCE OF TRUTH ===
  
  // 1. Total GTV (Canonical 30-Day GTV)
  const totalGTV = state.financials.last_30_days_gtv_inr;
  const momGrowth = state.financials.mom_growth_pct;

  // 2. GTV Trend Chart (Group by Date from Derived State, dynamic relative to today)
  const gtvByDate = useMemo(() => {
    if (state.daily_trends && state.daily_trends.length > 0) {
      return state.daily_trends.map(t => ({ date: t.date, amount: t.amount }));
    }
    return [
      { date: 'Oct 29', amount: totalGTV }
    ];
  }, [state.daily_trends, totalGTV]);

  // 3. Payment Mode Split (Pie Chart)
  const modeSplit = useMemo(() => {
    const mix = state.financials.payment_mix;
    return [
      { name: 'UPI', value: Math.round((totalGTV * mix.upi_pct) / 100) },
      { name: 'Card', value: Math.round((totalGTV * mix.card_pct) / 100) },
      { name: 'Wallet', value: Math.round((totalGTV * mix.wallet_pct) / 100) },
    ];
  }, [state.financials.payment_mix, totalGTV]);

  const COLORS = ['#FE8A70', '#2C3426', '#889064'];

  // 4. Heatmap Data (Day of Week vs Time Blocks)
  const heatmapData = useMemo(() => {
    // 7 days (0=Sun, 6=Sat) x 4 time blocks (Morning 6-12, Afternoon 12-18, Evening 18-24, Night 0-6)
    const matrix = Array(7).fill(0).map(() => Array(4).fill(0));
    
    TRANSACTIONS_FIXTURE.forEach(t => {
      const date = parseISO(t.timestamp);
      const day = getDay(date);
      const hour = getHours(date);
      
      let block = 3; // Night
      if (hour >= 6 && hour < 12) block = 0; // Morning
      else if (hour >= 12 && hour < 18) block = 1; // Afternoon
      else if (hour >= 18) block = 2; // Evening
      
      matrix[day][block]++;
    });

    // Find max for scaling opacity
    let max = 0;
    matrix.forEach(row => row.forEach(val => { if (val > max) max = val; }));
    
    return { matrix, max: max || 1 }; // avoid div by zero
  }, []);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const blocks = ['Morning (6-12)', 'Afternoon (12-18)', 'Evening (18-24)', 'Night (0-6)'];

  // === ACTIONS ===

  const generateLLMSummary = async () => {
    setIsLlmLoading(true);
    setLlmSummary(null);

    // Context payload
    const upiShare = modeSplit.find(m => m.name === 'UPI')?.value || 0;
    const upiPercent = Math.round((upiShare / totalGTV) * 100);
    
    const contextPrompt = `Write a 3-sentence executive summary for the merchant. 
      Total GTV was ₹${totalGTV}. 
      MoM growth is ${momGrowth}%. 
      UPI accounts for ${upiPercent}% of volume. 
      Keep it professional, encouraging, and write it in the first-person as Tara.`;

    try {
      const res = await fetch('/api/tara/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'M_DISPUTE_TAT',
          message: contextPrompt
        })
      });
      const data = await res.json();
      setLlmSummary(data.response || `I've analyzed your performance this month. Your total Gross Transaction Value reached ₹${totalGTV.toLocaleString('en-IN')}, representing a solid ${momGrowth}% month-over-month growth. UPI continues to dominate your payment mix at ${upiPercent}%, suggesting your counter QR codes are performing exceptionally well.`);
    } catch (e) {
      setLlmSummary(`I've analyzed your performance this month. Your total Gross Transaction Value reached ₹${totalGTV.toLocaleString('en-IN')}, representing a solid ${momGrowth}% month-over-month growth. UPI continues to dominate your payment mix at ${upiPercent}%, suggesting your counter QR codes are performing exceptionally well.`);
    } finally {
      setIsLlmLoading(false);
    }
  };

  const exportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("Merchant Executive Summary", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${format(new Date(), 'PP pp')} by Tara`, 14, 30);
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Key Metrics", 14, 45);
      doc.setFontSize(12);
      doc.text(`Total GTV: Rs.${totalGTV}`, 14, 55);
      doc.text(`MoM Growth: +${momGrowth}%`, 14, 63);
      
      if (llmSummary) {
        doc.setFontSize(14);
        doc.text("AI Insights", 14, 80);
        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(llmSummary, 180);
        doc.text(splitText, 14, 90);
      }
      
      doc.save(`merchant_summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      setIsExporting(false);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col pb-10">
      
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">Reports & Insights</h1>
          <p className="text-navy/70">Analyze your transaction trends and discover peak hours.</p>
        </div>
        <button 
          onClick={exportPDF} 
          disabled={isExporting} 
          className="bg-paytm-blue text-white-panel px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-navy transition-colors disabled:opacity-50"
        >
          {isExporting ? <span className="animate-spin">↻</span> : <Download className="w-4 h-4" />} Download PDF
        </button>
      </div>

      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* TOTAL GTV CARD */}
        <div className="bg-white-panel p-6 rounded-xl shadow-sm border border-soft-border flex items-center justify-between">
          <div>
            <p className="text-navy/60 text-sm font-medium mb-1">Total GTV (30 Days)</p>
            <h2 className="text-3xl font-bold text-navy">₹{totalGTV.toLocaleString('en-IN')}</h2>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold mb-1">
              <TrendingUp className="w-4 h-4" /> +{momGrowth}%
            </div>
            <p className="text-xs text-navy/50">vs last month</p>
          </div>
        </div>

        {/* LLM GENERATOR CARD */}
        <div className="bg-gradient-to-r from-paytm-blue/10 to-transparent p-6 rounded-xl border border-paytm-blue/20 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-navy flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-paytm-blue" />
              Executive Summary
            </h3>
            <p className="text-sm text-navy/70 max-w-sm">Have Tara analyze your charts and write a natural-language report.</p>
          </div>
          <button 
            onClick={generateLLMSummary}
            disabled={isLlmLoading}
            className="bg-white-panel text-paytm-blue border border-paytm-blue/30 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-light-bg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {isLlmLoading ? <span className="animate-spin">↻</span> : <Sparkles className="w-4 h-4" />}
            Generate Insights
          </button>
        </div>
      </div>

      {/* LLM OUTPUT DISPLAY */}
      {llmSummary && (
        <div className="bg-navy text-white-panel p-6 rounded-xl mb-6 shadow-xl animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-paytm-blue/30 rounded-full blur-3xl"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-white-panel/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-paytm-blue" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-paytm-blue uppercase tracking-wider mb-2">Tara's Analysis</h3>
              <p className="text-base leading-relaxed text-white-panel/90">
                {llmSummary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* LINE CHART */}
        <div className="bg-white-panel p-6 rounded-xl shadow-sm border border-soft-border lg:col-span-2">
          <h3 className="text-lg font-bold text-navy mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-navy/50" /> Daily GTV Trend</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gtvByDate} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748B' }} 
                  minTickGap={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'GTV']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#FE8A70" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#FE8A70', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#FE8A70', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="bg-white-panel p-6 rounded-xl shadow-sm border border-soft-border flex flex-col">
          <h3 className="text-lg font-bold text-navy mb-4 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-navy/50" /> Payment Modes</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modeSplit}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {modeSplit.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Volume']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center gap-4 mt-2">
            {modeSplit.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs font-bold text-navy">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HEATMAP */}
      <div className="bg-white-panel p-6 rounded-xl shadow-sm border border-soft-border">
        <h3 className="text-lg font-bold text-navy mb-6 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-navy/50" /> Peak Store Hours</h3>
        
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header row (Time blocks) */}
            <div className="grid grid-cols-5 gap-2 mb-2">
              <div className="col-span-1"></div> {/* Empty top-left */}
              {blocks.map(b => (
                <div key={b} className="text-center text-xs font-bold text-navy/50 uppercase">{b}</div>
              ))}
            </div>
            
            {/* Grid */}
            <div className="flex flex-col gap-2">
              {days.map((dayName, dayIndex) => (
                <div key={dayName} className="grid grid-cols-5 gap-2 items-center">
                  <div className="col-span-1 text-sm font-bold text-navy text-right pr-4">{dayName}</div>
                  
                  {heatmapData.matrix[dayIndex].map((count, blockIndex) => {
                    // Opacity scaling
                    const opacity = count === 0 ? 0.05 : Math.max(0.1, count / heatmapData.max);
                    return (
                      <div 
                        key={`${dayIndex}-${blockIndex}`} 
                        className="h-12 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-[1.02]"
                        style={{ 
                          backgroundColor: `rgba(0, 186, 242, ${opacity})`,
                          color: opacity > 0.5 ? '#fff' : '#0F172A',
                          border: count === 0 ? '1px dashed #E2E8F0' : 'none'
                        }}
                        title={`${count} transactions`}
                      >
                        {count > 0 ? count : '-'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
