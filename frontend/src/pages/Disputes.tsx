import React, { useState, useEffect } from 'react';
import { DISPUTES_FIXTURE } from '../mocks/fixtures';
import { 
  Clock, AlertTriangle, ShieldCheck, Scale, FileSearch, Sparkles, 
  ChevronDown, ChevronUp, Bot, UserRound, Check, X, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNowStrict, parseISO, format } from 'date-fns';

interface ReasoningTrace {
  traceId: string;
  notes: string;
  citation: string;
}

interface Compensation {
  amount: number;
  approvalId: string;
  reason: string;
}

interface Dispute {
  id: string;
  amount: number;
  reason: string;
  status: string;
  source: string;
  tatDeadline: string;
  date: string;
  reasoningTrace: ReasoningTrace;
  compensationProposed: Compensation | null;
}

export const Disputes: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>(DISPUTES_FIXTURE as Dispute[]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});

  // Live countdown ticker
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const getTatStatus = (deadlineISO: string) => {
    const deadline = new Date(deadlineISO).getTime();
    const msLeft = deadline - now;
    const hoursLeft = msLeft / (1000 * 60 * 60);

    if (hoursLeft <= 0) return { color: 'text-red-600 bg-red-100', text: 'TAT Expired', urgency: 'CRITICAL' };
    if (hoursLeft <= 12) return { color: 'text-red-600 bg-red-100', text: `${formatDistanceToNowStrict(deadline)} left`, urgency: 'CRITICAL' };
    if (hoursLeft <= 48) return { color: 'text-amber-600 bg-amber-100', text: `${formatDistanceToNowStrict(deadline)} left`, urgency: 'WARNING' };
    return { color: 'text-green-600 bg-green-100', text: `${formatDistanceToNowStrict(deadline)} left`, urgency: 'SAFE' };
  };

  const handleApprove = async (disputeId: string, _approvalId: string) => {
    setApprovingIds(prev => ({ ...prev, [disputeId]: true }));
    
    try {
      // Simulate API call to resolve the human-in-the-loop gate
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setDisputes(prev => prev.map(d => {
        if (d.id === disputeId) {
          return { ...d, status: 'AUTO_CREDITED', compensationProposed: null };
        }
        return d;
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingIds(prev => ({ ...prev, [disputeId]: false }));
    }
  };

  const handleReject = (disputeId: string) => {
    toast('Compensation proposal rejected. Escalate to manual review.', { icon: '⚠️' });
    setDisputes(prev => prev.map(d => {
      if (d.id === disputeId) {
        return { ...d, status: 'ESCALATED', compensationProposed: null };
      }
      return d;
    }));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col pb-10">
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy mb-2">Disputes & Chargebacks</h1>
        <p className="text-navy/70">Manage chargebacks, resolve disputes, and monitor TAT compliance.</p>
      </div>

      <div className="bg-white-panel rounded-xl shadow-sm border border-soft-border overflow-hidden">
        <div className="p-5 border-b border-soft-border bg-light-bg/50 grid grid-cols-12 gap-4 text-xs font-semibold text-navy/60 uppercase">
          <div className="col-span-3">Dispute & Date</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">T+5 TAT Countdown</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>

        <div className="divide-y divide-soft-border">
          {disputes.map((dispute) => {
            const tat = getTatStatus(dispute.tatDeadline);
            const isExpanded = expandedId === dispute.id;
            const isResolved = dispute.status === 'AUTO_CREDITED' || dispute.status === 'RESOLVED';
            
            return (
              <div key={dispute.id} className="group">
                {/* ROW */}
                <div 
                  onClick={() => toggleExpand(dispute.id)}
                  className={`p-5 grid grid-cols-12 gap-4 items-center cursor-pointer transition-colors ${isExpanded ? 'bg-light-bg/30' : 'hover:bg-light-bg/50'}`}
                >
                  <div className="col-span-3">
                    <div className="text-sm font-bold text-paytm-blue mb-1 flex items-center gap-1.5">
                      {dispute.id}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-sm font-medium text-navy truncate">{dispute.reason}</div>
                    <div className="text-xs text-navy/50">{format(parseISO(dispute.date), 'MMM dd, yyyy')}</div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy/70 bg-light-bg px-2 py-1 rounded-md w-fit">
                      {dispute.source === 'AGENT_DETECTED' ? <Bot className="w-3.5 h-3.5 text-paytm-blue" /> : <UserRound className="w-3.5 h-3.5 text-amber-500" />}
                      {dispute.source.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1 ${
                      isResolved ? 'bg-green-100 text-green-700' :
                      dispute.status === 'ESCALATED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {isResolved ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {dispute.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="col-span-3">
                    {isResolved ? (
                      <span className="text-xs font-bold text-navy/40 uppercase">Resolved</span>
                    ) : (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full w-fit ${tat.color}`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wide">{tat.text}</span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 text-right">
                    <div className="text-sm font-bold text-navy">₹{dispute.amount.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* EXPANDED ACCORDION */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 bg-light-bg/30 border-b border-soft-border">
                    <div className="grid grid-cols-2 gap-6">
                      
                      {/* Left Col: Reasoning Trace */}
                      <div className="bg-white-panel border border-soft-border rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-soft-border">
                          <Sparkles className="w-4 h-4 text-paytm-blue" />
                          <h4 className="text-sm font-bold text-navy">Tara Reasoning Trace</h4>
                          <a href={`http://localhost:3000/trace/${dispute.reasoningTrace.traceId}`} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 text-xs font-medium text-paytm-blue hover:underline">
                            View in Langfuse <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-1">Reflection Notes</p>
                          <p className="text-sm text-navy/80 bg-light-bg p-3 rounded-lg border border-soft-border">
                            {dispute.reasoningTrace.notes}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-1 flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Policy Citation</p>
                          <p className="text-sm font-medium text-navy/90 italic border-l-2 border-paytm-blue pl-3 py-1">
                            {dispute.reasoningTrace.citation}
                          </p>
                        </div>
                      </div>

                      {/* Right Col: Approvals & Context */}
                      <div className="flex flex-col">
                        {dispute.compensationProposed && !isResolved ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex-1 flex flex-col justify-center animate-in fade-in">
                            <div className="flex items-center gap-2 mb-2 text-amber-800">
                              <AlertTriangle className="w-5 h-5" />
                              <h4 className="text-sm font-bold">Action Required: Compensation Proposed</h4>
                            </div>
                            <p className="text-sm text-amber-900/80 mb-4">
                              Tara recommends a credit of <strong>₹{dispute.compensationProposed.amount}</strong>: <br/>
                              "{dispute.compensationProposed.reason}"
                            </p>
                            <div className="flex items-center gap-3 mt-auto">
                              <button 
                                onClick={() => handleApprove(dispute.id, dispute.compensationProposed!.approvalId)}
                                disabled={approvingIds[dispute.id]}
                                className="bg-amber-600 hover:bg-amber-700 text-white-panel px-6 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {approvingIds[dispute.id] ? <span className="animate-spin">↻</span> : <Check className="w-4 h-4" />}
                                Approve Credit
                              </button>
                              <button 
                                onClick={() => handleReject(dispute.id)}
                                className="bg-white-panel text-amber-700 border border-amber-300 hover:bg-amber-100 px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                              >
                                <X className="w-4 h-4" /> Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-light-bg rounded-xl border border-soft-border border-dashed p-5 flex-1 flex flex-col items-center justify-center text-center">
                            <FileSearch className="w-8 h-8 text-navy/20 mb-2" />
                            <h4 className="text-sm font-bold text-navy/40">No Pending Approvals</h4>
                            <p className="text-xs text-navy/40 mt-1 max-w-[200px]">This dispute does not require manual intervention at this stage.</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
