import React, { useState, useMemo } from 'react';
import { OFFERS_FIXTURE } from '../mocks/fixtures';
import { useDerivedState } from '../context/DerivedStateContext';
import { 
  Box, QrCode, Sparkles, ChevronRight, 
  CheckCircle2, ShieldCheck, ArrowRight, X, ShieldAlert
} from 'lucide-react';
import { StateFeedback } from '../components/common/StateFeedback';

interface Offer {
  id: string;
  type: string;
  title: string;
  amount: number;
  rate: string;
  status: string;
  description: string;
}

export const OffersLoans: React.FC = () => {
  const { state } = useDerivedState();
  const [offers, setOffers] = useState<Offer[]>(OFFERS_FIXTURE as Offer[]);
  
  // Loan State
  const [loanTenure, setLoanTenure] = useState<number>(12);
  const loanOffer = offers.find(o => o.id === 'LN-01')!;
  
  // EMI Calculation: P * R * (1+R)^N / ((1+R)^N - 1)
  const emi = useMemo(() => {
    const P = loanOffer.amount;
    const R = 0.015; // 1.5% monthly
    const N = loanTenure;
    const emiCalc = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    return Math.round(emiCalc);
  }, [loanOffer.amount, loanTenure]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [eSignChecked, setESignChecked] = useState(false);
  
  // Tara State
  const [taraContext, setTaraContext] = useState<string | null>(null);
  const [isTaraLoading, setIsTaraLoading] = useState(false);

  const getTaraExplanation = async () => {
    if (taraContext) return;
    setIsTaraLoading(true);
    
    // Canonical values from single source of truth
    const gtvFormatted = state.financials.formatted_gtv_lakhs;
    const gtvExact = state.financials.last_30_days_gtv_inr.toLocaleString('en-IN');
    const dynamicFallback = `Based on your verified 30-day GTV of ${gtvFormatted} (₹${gtvExact}) and consistent settlement history, you qualify for this pre-approved ₹5,00,000 working capital line.`;

    try {
      const res = await fetch('/api/tara/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'M_DISPUTE_TAT',
          message: 'Why am I eligible for this 5L loan? Explain using my recent GTV and dispute rates.'
        })
      });
      const data = await res.json();
      setTaraContext(data.response || dynamicFallback);
    } catch (e) {
      setTaraContext(dynamicFallback);
    } finally {
      setIsTaraLoading(false);
    }
  };

  const submitLoanApplication = () => {
    setOffers(prev => prev.map(o => o.id === 'LN-01' ? { ...o, status: 'APPLIED' } : o));
    setModalStep(3);
  };

  const applyHardwareOffer = (id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'SHIPPING_SOON' } : o));
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setModalStep(1);
      setESignChecked(false);
    }, 300);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pb-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy mb-2">Offers & Loans</h1>
        <p className="text-navy/70">Pre-approved financing and hardware upgrades tailored for your business.</p>
      </div>

      {/* TARA AUTONOMOUS GOVERNANCE BANNER */}
      {state.offers_governance.suppressed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-sm" data-testid="offers-governance-banner">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-amber-900 font-bold text-sm">Autonomous Offer Governance Active</h3>
            <p className="text-amber-800 text-xs mt-0.5">
              {state.offers_governance.reason} Pre-approved loans and hardware discounts will unlock once healthy telemetry resumes.
            </p>
          </div>
        </div>
      )}

      {/* LOAN HERO CARD */}
      <div className="bg-gradient-to-br from-navy to-[#0F172A] rounded-2xl shadow-xl overflow-hidden mb-8 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-paytm-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10">
          <div className="flex-1 text-white-panel">
            <div className="inline-flex items-center gap-1.5 bg-white-panel/10 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white-panel/20">
              <Sparkles className="w-3.5 h-3.5 text-paytm-blue" />
              Pre-Approved Offer
            </div>
            <h2 className="text-4xl font-bold mb-2">₹{loanOffer.amount.toLocaleString('en-IN')}</h2>
            <p className="text-white-panel/70 text-lg mb-6">Instant Business Loan • No Collateral</p>
            
            <button 
              onClick={getTaraExplanation}
              className="text-paytm-blue text-sm font-bold hover:underline flex items-center gap-1.5 mb-4"
            >
              Why am I eligible? <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* TARA CONTEXT BOX */}
            {(taraContext || isTaraLoading) && (
              <div className="bg-white-panel/10 border border-white-panel/20 rounded-xl p-4 text-sm leading-relaxed max-w-md animate-in fade-in slide-in-from-top-2">
                {isTaraLoading ? (
                  <StateFeedback 
                    mode="loading" 
                    title="Tara is analyzing your ledger..." 
                    className="p-0 min-h-0 text-white-panel !items-start"
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-paytm-blue shrink-0 mt-0.5" />
                    <p>{taraContext}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="w-full md:w-[400px] bg-white-panel rounded-xl p-6 shadow-2xl z-10 text-navy">
            {loanOffer.status === 'APPLIED' ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Application Submitted!</h3>
                <p className="text-navy/70 text-sm">Your funds will be disbursed to HDFC Bank ****4021 within 24 hours.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-6 border-b border-soft-border pb-4">Customize your loan</h3>
                
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-sm font-bold text-navy/70">Tenure</label>
                    <span className="text-lg font-bold text-navy">{loanTenure} Months</span>
                  </div>
                  <input 
                    type="range" 
                    min="6" max="24" step="6"
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(parseInt(e.target.value))}
                    className="w-full h-2 bg-light-bg rounded-lg appearance-none cursor-pointer accent-paytm-blue"
                  />
                  <div className="flex justify-between text-xs text-navy/40 font-bold mt-2">
                    <span>6m</span>
                    <span>12m</span>
                    <span>18m</span>
                    <span>24m</span>
                  </div>
                </div>

                <div className="bg-light-bg rounded-xl p-4 mb-6 border border-soft-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-navy/70 font-medium">Monthly EMI</span>
                    <span className="text-xl font-bold text-navy">₹{emi.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-navy/70 font-medium">Interest Rate</span>
                    <span className="text-sm font-bold text-navy">1.5% / month</span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-paytm-blue hover:bg-navy text-white-panel py-3 rounded-xl font-bold transition-colors shadow-md shadow-paytm-blue/20"
                >
                  Apply Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-navy mb-4">Hardware & Collateral</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* HARDWARE OFFERS */}
        {offers.filter(o => o.type !== 'LOAN').map(offer => (
          <div key={offer.id} className="bg-white-panel rounded-xl shadow-sm border border-soft-border p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-light-bg rounded-xl flex items-center justify-center">
                {offer.type === 'HARDWARE' ? <Box className="w-6 h-6 text-navy" /> : <QrCode className="w-6 h-6 text-navy" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">{offer.title}</h3>
                <p className="text-sm text-navy/60">{offer.description}</p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-soft-border flex justify-between items-center">
              <span className="text-lg font-bold text-navy">
                {offer.amount === 0 ? 'FREE' : `₹${offer.amount}`}
              </span>
              {offer.status === 'AVAILABLE' ? (
                <button 
                  onClick={() => applyHardwareOffer(offer.id)}
                  className="text-sm font-bold text-paytm-blue hover:text-navy transition-colors flex items-center gap-1"
                >
                  Order Now <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-xs font-bold uppercase tracking-wide bg-green-100 text-green-700 px-3 py-1.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {offer.status.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* LOAN APPLICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div className="bg-white-panel rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 flex justify-between items-center border-b border-soft-border">
              <h3 className="font-bold text-navy">Complete Application</h3>
              {modalStep < 3 && (
                <button onClick={resetModal} className="text-navy/50 hover:text-navy transition-colors"><X className="w-5 h-5" /></button>
              )}
            </div>

            <div className="p-6">
              {/* STEP 1: CONFIRM */}
              {modalStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h4 className="text-xl font-bold text-navy mb-4">Confirm Loan Details</h4>
                  <div className="bg-light-bg rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-navy/60">Amount</span>
                      <span className="text-sm font-bold text-navy">₹{loanOffer.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-navy/60">Tenure</span>
                      <span className="text-sm font-bold text-navy">{loanTenure} Months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-navy/60">Monthly EMI</span>
                      <span className="text-sm font-bold text-navy">₹{emi.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <button onClick={() => setModalStep(2)} className="w-full bg-paytm-blue hover:bg-navy text-white-panel py-3 rounded-xl font-bold transition-colors">
                    Proceed to E-Sign
                  </button>
                </div>
              )}

              {/* STEP 2: E-SIGN */}
              {modalStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <div className="w-12 h-12 bg-paytm-blue/10 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-paytm-blue" />
                  </div>
                  <h4 className="text-xl font-bold text-navy mb-2">Sign Agreement</h4>
                  <p className="text-sm text-navy/70 mb-6">By signing below, you agree to the auto-deduction of EMIs from your daily settlements.</p>
                  
                  <label className="flex items-start gap-3 p-4 border border-soft-border rounded-xl cursor-pointer hover:bg-light-bg/50 transition-colors mb-6">
                    <input 
                      type="checkbox" 
                      checked={eSignChecked} 
                      onChange={(e) => setESignChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-paytm-blue rounded focus:ring-paytm-blue"
                    />
                    <span className="text-sm text-navy font-medium leading-snug">
                      I have read and agree to the Key Fact Statement (KFS) and authorize daily EMI deductions.
                    </span>
                  </label>

                  <div className="flex gap-3">
                    <button onClick={() => setModalStep(1)} className="flex-1 bg-light-bg hover:bg-soft-border text-navy py-3 rounded-xl font-bold transition-colors">Back</button>
                    <button 
                      onClick={submitLoanApplication}
                      disabled={!eSignChecked}
                      className="flex-[2] bg-paytm-blue hover:bg-navy text-white-panel py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:hover:bg-paytm-blue"
                    >
                      Submit Application
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS */}
              {modalStep === 3 && (
                <div className="text-center py-6 animate-in fade-in zoom-in-95">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-navy mb-2">Loan Approved!</h4>
                  <p className="text-sm text-navy/70 mb-8 max-w-[250px] mx-auto">
                    ₹{loanOffer.amount.toLocaleString('en-IN')} is being transferred to HDFC Bank ****4021.
                  </p>
                  <button onClick={resetModal} className="w-full bg-light-bg hover:bg-soft-border text-navy py-3 rounded-xl font-bold transition-colors">
                    Back to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
