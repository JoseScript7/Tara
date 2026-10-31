import React, { useEffect, useState } from 'react';
import { Check, X, Clock } from 'lucide-react';

interface Approval {
  id: string;
  type: string;
  payload: any;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export const ApprovalTable: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approvals');
      const data = await res.json();
      setApprovals(data);
    } catch (err) {
      console.error('Error fetching approvals', err);
    }
  };

  useEffect(() => {
    fetchApprovals();
    // Poll every 3 seconds to catch updates from the Tara chat
    const interval = setInterval(fetchApprovals, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await fetch(`/api/approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      fetchApprovals(); // Refresh table immediately
    } catch (err) {
      console.error('Error updating approval', err);
    }
  };

  if (approvals.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
        <h3 className="text-lg font-bold text-navy mb-4">Pending Approvals</h3>
        <p className="text-sm text-gray-500">No actions pending approval.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
      <h3 className="text-lg font-bold text-navy mb-4">Pending Approvals</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-sm font-semibold text-gray-500">Action Type</th>
              <th className="pb-3 text-sm font-semibold text-gray-500">Details</th>
              <th className="pb-3 text-sm font-semibold text-gray-500">Status</th>
              <th className="pb-3 text-sm font-semibold text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((app) => (
              <tr key={app.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="py-4 text-sm font-medium text-navy">
                  {app.type.replace(/_/g, ' ')}
                </td>
                <td className="py-4 text-sm text-gray-600">
                  {app.payload.amount ? `₹${app.payload.amount} - ` : ''}
                  {app.payload.reason || app.payload.transactionId || 'No details'}
                </td>
                <td className="py-4 text-sm">
                  {app.status === 'PENDING_APPROVAL' && (
                    <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded w-fit">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                  {app.status === 'APPROVED' && (
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                      <Check className="w-3 h-3" /> Approved
                    </span>
                  )}
                  {app.status === 'REJECTED' && (
                    <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                      <X className="w-3 h-3" /> Rejected
                    </span>
                  )}
                </td>
                <td className="py-4 text-right">
                  {app.status === 'PENDING_APPROVAL' && (
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleAction(app.id, 'APPROVE')}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleAction(app.id, 'REJECT')}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
