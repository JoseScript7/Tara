import React, { useState, useEffect } from 'react';
import { Landmark, Plus, ArrowUpRight, ArrowDownLeft, Volume2, RefreshCw, Sparkles, X } from 'lucide-react';

export interface BankAccount {
  id: string;
  name: string;
  shop_name: string;
  phone: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  branch: string;
  current_balance: number;
  unsettled_balance: number;
  status: string;
  soundbox_id: string;
  transaction_count?: number;
}

export interface BankTransaction {
  id: string;
  account_id: string;
  amount: number;
  type: string;
  payer_name: string;
  payer_vpa: string;
  note?: string;
  soundbox_announced: boolean;
  announcement_text?: string | null;
  timestamp: number;
  status: string;
}

interface MockBankConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccountId?: string;
  onSelectAccount?: (account: BankAccount) => void;
  initialPhone?: string;
}

export const MockBankConsole: React.FC<MockBankConsoleProps> = ({
  isOpen,
  onClose,
  selectedAccountId,
  onSelectAccount,
  initialPhone,
}) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [activeAccId, setActiveAccId] = useState<string>(selectedAccountId || 'acc-1');
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New Account Form State
  const [newName, setNewName] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newBankName, setNewBankName] = useState('HDFC Bank');
  const [newInitialBalance, setNewInitialBalance] = useState('50000');
  const [newPhone, setNewPhone] = useState(initialPhone || '9876543210');
  const [smsNotificationStatus, setSmsNotificationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (initialPhone) {
      setNewPhone(initialPhone);
    }
  }, [initialPhone]);

  // Live Soundbox Chime state
  const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(null);

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/bank/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        if (!activeAccId && data.accounts?.length > 0) {
          setActiveAccId(data.accounts[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch bank accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transactions for active account
  const fetchTransactions = async (accId: string) => {
    try {
      const res = await fetch(`/api/bank/accounts/${accId}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeAccId) {
      fetchTransactions(activeAccId);
    }
  }, [activeAccId]);

  // Real-time EventSource listener
  useEffect(() => {
    if (!isOpen) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/bank/stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'TRANSACTION_PROCESSED') {
            const txn: BankTransaction = payload.transaction;
            if (txn.soundbox_announced && txn.announcement_text) {
              setLastAnnouncement(txn.announcement_text);
              setTimeout(() => setLastAnnouncement(null), 5000);
            }
            // Update active account balance
            setAccounts((prev) =>
              prev.map((acc) =>
                acc.id === payload.account_id
                  ? { ...acc, current_balance: payload.new_balance }
                  : acc
              )
            );
            if (txn.account_id === activeAccId) {
              setTransactions((prev) => [txn, ...prev]);
            }
          } else if (payload.type === 'ACCOUNT_CREATED') {
            setAccounts((prev) => [payload.account, ...prev]);
          }
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };
    } catch (e) {
      console.error('SSE connection failed, falling back to polling:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isOpen, activeAccId]);

  // Create new account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newShopName) return;

    const payloadPhone = newPhone.trim() || initialPhone || '9876543210';
    const formattedPhone = payloadPhone.startsWith('+') ? payloadPhone : `+91${payloadPhone}`;

    try {
      const res = await fetch('/api/bank/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          shop_name: newShopName,
          bank_name: newBankName,
          phone: formattedPhone,
          initial_balance: parseFloat(newInitialBalance) || 25000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveAccId(data.account.id);
        setIsCreating(false);
        setNewName('');
        setNewShopName('');
        fetchAccounts();
        if (onSelectAccount) {
          onSelectAccount(data.account);
        }

        // Send AWS SNS SMS Notification
        try {
          await fetch('/api/sms/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber: formattedPhone,
              message: `Dear ${newName}, your ${newBankName} account (...${data.account.account_number?.slice(-4) || '****'}) for ${newShopName} has been linked to Tara AI Teammate. Real-time settlements and Soundbox failover are active.`
            })
          });
          setSmsNotificationStatus(`📱 SMS confirmation dispatched to ${formattedPhone} via AWS SNS`);
          setTimeout(() => setSmsNotificationStatus(null), 8000);
        } catch (e) {
          console.warn('SMS dispatch error:', e);
        }
      }
    } catch (err) {
      console.error('Failed to create bank account:', err);
    }
  };

  // Simulate instant transaction
  const handleSimulatePayment = async (amount: number, payerName: string) => {
    if (!activeAccId) return;

    try {
      const res = await fetch('/api/bank/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: activeAccId,
          amount,
          type: 'UPI_CREDIT',
          payer_name: payerName,
          payer_vpa: `${payerName.toLowerCase().replace(/\s+/g, '')}@upi`,
          note: 'Store counter QR scan',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const txn = data.transaction;
        if (txn.announcement_text) {
          setLastAnnouncement(txn.announcement_text);
          setTimeout(() => setLastAnnouncement(null), 5000);
        }
        fetchAccounts();
        fetchTransactions(activeAccId);
      }
    } catch (err) {
      console.error('Transaction simulation error:', err);
    }
  };

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a.id === activeAccId) || accounts[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(21, 22, 21, 0.55)',
        backdropFilter: 'blur(6px)',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-ui, sans-serif)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          backgroundColor: 'var(--color-panel, #FAF9F5)',
          borderRadius: '24px',
          border: '1px solid rgba(21, 22, 21, 0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(21, 22, 21, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(254, 138, 112, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Landmark size={22} color="#D95436" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#151615' }}>
                Mock Bank Core Simulator
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#5E625A' }}>
                Live real-time accounts & UPI switch · Updates balance instantaneously
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={fetchAccounts}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(21, 22, 21, 0.12)',
                background: 'transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#151615',
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                color: '#5E625A',
                borderRadius: '50%',
              }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* SMS Notification Toast */}
        {smsNotificationStatus && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: '#E8F5E9',
              borderBottom: '1px solid #A5D6A7',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#145A19',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <span>{smsNotificationStatus}</span>
          </div>
        )}

        {/* Live Soundbox Chime Toast */}
        {lastAnnouncement && (
          <div
            style={{
              padding: '10px 24px',
              backgroundColor: '#E8F5E9',
              borderBottom: '1px solid #C8E6C9',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#145A19',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Volume2 size={18} className="animate-pulse" />
            <span>Soundbox Audio Broadcast:</span>
            <span style={{ fontStyle: 'italic', color: '#151615' }}>"{lastAnnouncement}"</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.8 }}>Live Event</span>
          </div>
        )}

        {/* Content Body: Split View */}
        <div style={{ display: 'flex', flex: 1, minHeight: '440px', overflow: 'hidden' }}>
          {/* Left Column: Bank Accounts List */}
          <div
            style={{
              width: '340px',
              borderRight: '1px solid rgba(21, 22, 21, 0.08)',
              backgroundColor: '#FAF9F5',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(21, 22, 21, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#5E625A' }}>
                Bank Accounts ({accounts.length})
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#FA7F62',
                  color: '#151615',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={12} />
                <span>New Account</span>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {accounts.map((acc) => {
                const isActive = acc.id === activeAccId;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setActiveAccId(acc.id);
                      setIsCreating(false);
                      if (onSelectAccount) onSelectAccount(acc);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                      border: isActive ? '1.5px solid #FA7F62' : '1px solid rgba(21, 22, 21, 0.06)',
                      boxShadow: isActive ? '0 4px 12px rgba(250, 127, 98, 0.15)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#151615' }}>{acc.name}</div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#EFF2E9',
                          color: '#151615',
                        }}
                      >
                        {acc.bank_name.split(' ')[0]}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#5E625A', marginTop: '2px' }}>{acc.shop_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#5E625A' }}>
                        ...{acc.account_number.slice(-4)}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#151615' }}>
                        ₹{acc.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Account Detail & Real-Time Simulator */}
          <div style={{ flex: 1, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {isCreating ? (
              /* Create New Bank Account Form */
              <div style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#151615' }}>
                  Open New Merchant Bank Account (Demo)
                </h3>
                <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E625A', marginBottom: '4px' }}>
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(21, 22, 21, 0.15)',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E625A', marginBottom: '4px' }}>
                      Store / Enterprise Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                      placeholder="e.g. Patel Provisions & Kirana"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(21, 22, 21, 0.15)',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E625A', marginBottom: '4px' }}>
                      Merchant Phone Number (for AWS SNS SMS notifications)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(21, 22, 21, 0.15)', borderRadius: '8px', overflow: 'hidden' }}>
                      <span style={{ padding: '10px 12px', background: 'rgba(21, 22, 21, 0.04)', fontWeight: 600, fontSize: '13px', color: '#151615', borderRight: '1px solid rgba(21, 22, 21, 0.15)' }}>
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={newPhone.replace(/^\+91/, '')}
                        onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="e.g. 9876543210"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: 'none',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#145A19', fontWeight: 600 }}>
                      ⚡ When created, an instant account link confirmation is dispatched to this phone via AWS SNS.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E625A', marginBottom: '4px' }}>
                        Partner Bank
                      </label>
                      <select
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(21, 22, 21, 0.15)',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          background: '#FAF9F5',
                          outline: 'none',
                        }}
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="State Bank of India">State Bank of India</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Punjab National Bank">Punjab National Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E625A', marginBottom: '4px' }}>
                        Initial Demo Balance (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={newInitialBalance}
                        onChange={(e) => setNewInitialBalance(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(21, 22, 21, 0.15)',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#FA7F62',
                        color: '#151615',
                        fontWeight: 700,
                        fontSize: '13px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Create Bank Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'transparent',
                        color: '#5E625A',
                        fontWeight: 600,
                        fontSize: '13px',
                        borderRadius: '8px',
                        border: '1px solid rgba(21, 22, 21, 0.15)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : currentAccount ? (
              /* Account Dashboard & Live Simulator */
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Balance Card (Adapted Nuvo styling) */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #FE8A70 0%, #FA7F62 100%)',
                    color: '#151615',
                    boxShadow: '0 8px 24px rgba(250, 127, 98, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>
                      Live Bank Balance · {currentAccount.bank_name}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(21, 22, 21, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '100px',
                      }}
                    >
                      ✓ Linked to {currentAccount.soundbox_id}
                    </span>
                  </div>

                  <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    ₹{currentAccount.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>

                  <div style={{ display: 'flex', gap: '18px', fontSize: '12px', fontWeight: 600, opacity: 0.9 }}>
                    <div>A/C: {currentAccount.account_number}</div>
                    <div>IFSC: {currentAccount.ifsc}</div>
                    <div>Unsettled: ₹{currentAccount.unsettled_balance.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Instant Simulation Action Bar */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: '#FAF9F5',
                    border: '1px solid rgba(21, 22, 21, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Sparkles size={16} color="#D95436" />
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#151615' }}>
                      Real-Time Scenario Simulator
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment(500, 'Karan Mehta')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#151615',
                        color: '#FAF9F5',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>⚡ Simulate UPI +₹500</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulatePayment(1250, 'Divya Patel')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#151615',
                        color: '#FAF9F5',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span>⚡ Simulate UPI +₹1,250</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulatePayment(20, 'Tea Customer')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#151615',
                        color: '#FAF9F5',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span>⚡ Chai UPI +₹20</span>
                    </button>
                  </div>
                </div>

                {/* Live Transactions Feed */}
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#151615' }}>
                    Live Transaction Stream ({transactions.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {transactions.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#5E625A', fontSize: '13px' }}>
                        No transactions recorded yet. Click a simulation button above to generate a live payment.
                      </div>
                    ) : (
                      transactions.slice(0, 10).map((tx) => (
                        <div
                          key={tx.id}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(21, 22, 21, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#FAF9F5',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: tx.amount > 0 ? '#E8F5E9' : '#FFEBEE',
                                display: 'flex',
                                alignItems: 'center',
                                justifySelf: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {tx.amount > 0 ? (
                                <ArrowDownLeft size={16} color="#145A19" />
                              ) : (
                                <ArrowUpRight size={16} color="#A71313" />
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#151615' }}>
                                {tx.payer_name}
                              </div>
                              <div style={{ fontSize: '10px', color: '#5E625A' }}>
                                {tx.payer_vpa} · {new Date(tx.timestamp * 1000).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 800,
                                color: tx.amount > 0 ? '#145A19' : '#A71313',
                              }}
                            >
                              +{`₹${tx.amount.toFixed(2)}`}
                            </div>
                            {tx.soundbox_announced && (
                              <div style={{ fontSize: '10px', color: '#D95436', fontWeight: 600 }}>
                                🔊 Announced
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
