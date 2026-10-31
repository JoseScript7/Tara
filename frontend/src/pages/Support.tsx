import React, { useState } from 'react';
import { SUPPORT_TICKETS_FIXTURE } from '../mocks/fixtures';
import { 
  LifeBuoy, Sparkles, ChevronDown, ChevronUp, 
  AlertCircle, CheckCircle2, MessageSquare, Clock 
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const CATEGORIES = ['Payments', 'Settlements', 'Business Loans', 'Devices', 'KYC/Account'];

const FAQS = {
  'Payments': [
    "What is the MDR for UPI transactions?",
    "A customer's money was deducted but the transaction failed. What now?"
  ],
  'Settlements': [
    "What time are daily settlements credited?",
    "Why is there a 0.4% deduction on my settlement?"
  ],
  'Business Loans': [
    "How is the loan EMI deducted?",
    "Can I prepay my business loan?"
  ],
  'Devices': [
    "My Soundbox is not turning on.",
    "How do I order a replacement charger?"
  ],
  'KYC/Account': [
    "How do I update my registered bank account?",
    "What documents are required for re-KYC?"
  ]
};

export const Support: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqAnswers, setFaqAnswers] = useState<Record<string, string>>({});
  const [isFaqLoading, setIsFaqLoading] = useState<Record<string, boolean>>({});

  const tickets = SUPPORT_TICKETS_FIXTURE;

  const handleFaqClick = async (question: string) => {
    if (expandedFaq === question) {
      setExpandedFaq(null);
      return;
    }
    setExpandedFaq(question);

    if (faqAnswers[question]) return; // Already cached

    setIsFaqLoading(prev => ({ ...prev, [question]: true }));
    
    try {
      const res = await fetch('/api/tara/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'M_DISPUTE_TAT',
          message: `Answer this merchant FAQ based on internal policy: ${question}`
        })
      });
      const data = await res.json();
      
      let answer = data.response;
      if (!answer) {
        // Fallback mock responses if backend is unreachable
        if (question.includes('MDR')) answer = "UPI transactions are currently zero MDR. However, starting Oct 15, 2026, NPCI will apply a 0.4% MDR on transactions above ₹2000.";
        else if (question.includes('deducted')) answer = "If money is deducted but the order failed, it will be automatically refunded to the customer within T+3 days as per NPCI guidelines.";
        else if (question.includes('credited')) answer = "Settlements are processed automatically to your linked bank account by 8:00 AM daily.";
        else answer = "This is covered in Section 4 of your Merchant Agreement. Please contact support if you need specific details on your account.";
      }
      
      setFaqAnswers(prev => ({ ...prev, [question]: answer }));
    } catch (e) {
      setFaqAnswers(prev => ({ ...prev, [question]: "I'm sorry, I couldn't connect to the knowledge base right now." }));
    } finally {
      setIsFaqLoading(prev => ({ ...prev, [question]: false }));
    }
  };

  const handleChatWithTara = () => {
    // Dispatch a custom event that TaraPanel can theoretically listen to
    const event = new CustomEvent('open-tara', { detail: { category: activeCategory } });
    window.dispatchEvent(event);
    
    // Fallback alert for the demo just in case TaraPanel isn't wired to listen
    // In a real app this would just slide the panel open.
    console.log(`Opening Tara chat with context: ${activeCategory}`);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pb-10">
      
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">Help & Support</h1>
          <p className="text-navy/70">Manage your support tickets and browse the knowledge base.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: FAQ & Categories */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* CATEGORY TABS */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setExpandedFaq(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-paytm-blue text-white-panel shadow-sm' 
                    : 'bg-white-panel text-navy/60 hover:bg-light-bg border border-soft-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* RAG-POWERED FAQ ACCORDION */}
          <div className="bg-white-panel rounded-xl shadow-sm border border-soft-border overflow-hidden">
            <div className="p-5 border-b border-soft-border bg-light-bg/50">
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-paytm-blue" />
                Frequently Asked Questions ({activeCategory})
              </h3>
            </div>
            
            <div className="divide-y divide-soft-border">
              {FAQS[activeCategory as keyof typeof FAQS]?.map((q, i) => (
                <div key={i} className="group">
                  <button 
                    onClick={() => handleFaqClick(q)}
                    className="w-full p-5 flex justify-between items-center text-left hover:bg-light-bg/30 transition-colors"
                  >
                    <span className="text-sm font-bold text-navy">{q}</span>
                    {expandedFaq === q ? <ChevronUp className="w-4 h-4 text-navy/50 shrink-0" /> : <ChevronDown className="w-4 h-4 text-navy/50 shrink-0" />}
                  </button>
                  
                  {expandedFaq === q && (
                    <div className="px-5 pb-5 pt-1 animate-in slide-in-from-top-2">
                      <div className="bg-light-bg rounded-xl p-4 flex items-start gap-3 border border-soft-border">
                        <div className="w-8 h-8 rounded-full bg-paytm-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4 text-paytm-blue" />
                        </div>
                        <div className="flex-1 text-sm text-navy/80 leading-relaxed">
                          {isFaqLoading[q] ? (
                            <div className="flex items-center gap-2 h-6 text-navy/50">
                              <span className="animate-spin">↻</span> Tara is checking the policy documents...
                            </div>
                          ) : (
                            <p>{faqAnswers[q]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* CHAT WITH TARA CTA */}
            <div className="p-5 border-t border-soft-border bg-light-bg/50 flex justify-between items-center">
              <p className="text-sm text-navy/70">Still need help with {activeCategory}?</p>
              <button 
                onClick={handleChatWithTara}
                className="bg-navy hover:bg-[#0F172A] text-white-panel px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-paytm-blue" /> Chat with Tara
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Ticket History */}
        <div className="md:col-span-1">
          <div className="bg-white-panel rounded-xl shadow-sm border border-soft-border overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-soft-border bg-light-bg/50">
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-navy/50" />
                Recent Tickets
              </h3>
            </div>
            
            <div className="divide-y divide-soft-border flex-1 overflow-y-auto">
              {tickets.map(t => (
                <div key={t.id} className="p-4 hover:bg-light-bg/30 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-paytm-blue">{t.id}</span>
                    <span className="text-[10px] font-bold text-navy/40 uppercase">{t.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-navy mb-3 line-clamp-2">{t.title}</h4>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-navy/50 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDistanceToNow(parseISO(t.openedDate))} ago
                    </div>
                    
                    {t.status === 'ESCALATED_TO_HUMAN' && (
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Escalated
                      </span>
                    )}
                    {t.status === 'OPEN' && (
                      <span className="bg-blue-50 text-paytm-blue border border-blue-100 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Open
                      </span>
                    )}
                    {t.status === 'RESOLVED' && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 border-t border-soft-border text-center">
              <button className="text-xs font-bold text-paytm-blue hover:underline">View All Tickets</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
