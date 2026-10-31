import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface DerivedDevice {
  id: string;
  name: string;
  type: string;
  status: 'ONLINE' | 'OFFLINE';
  health_grade: string;
  battery_pct: number;
  network: string;
  last_ping_sec_ago: number;
  last_ping_iso: string;
  firmware: string;
  is_stale: boolean;
  triage_recommendation: string | null;
}

export interface DailyTrend {
  date: string;
  full_date: string;
  is_today: boolean;
  amount: number;
}

export interface OpenCase {
  case_id: string;
  type: string;
  title: string;
  entity_id: string;
  tier: number;
  state: string;
  current_step: string;
  time_open_hours: number;
  sla_remaining_hours: number;
  tat_deadline_iso: string;
  evidence: Record<string, any>;
}

export interface DerivedState {
  merchant_id: string;
  business_name: string;
  owner_name: string;
  timestamp: string;
  today_str: string;
  all_systems_active: boolean;
  system_status: {
    status_label: string;
    color: 'green' | 'amber' | 'red';
    subtext: string;
  };
  devices: DerivedDevice[];
  financials: {
    last_30_days_gtv_inr: number;
    formatted_gtv_lakhs: string;
    today_volume_inr: number;
    success_rate_pct: number;
    mom_growth_pct: number;
    settlement_pending_inr: number;
    available_balance_inr: number;
    payment_mix: {
      upi_pct: number;
      card_pct: number;
      wallet_pct: number;
    };
  };
  daily_trends: DailyTrend[];
  open_cases: OpenCase[];
  tara_greeting: string;
  offers_governance: {
    suppressed: boolean;
    reason: string;
  };
}

// Canonical fallback state matching single source of truth
const FALLBACK_STATE: DerivedState = {
  merchant_id: 'M_DISPUTE_TAT',
  business_name: 'Kumar Stores',
  owner_name: 'Rahul Sharma',
  timestamp: new Date().toISOString(),
  today_str: new Date().toISOString().split('T')[0],
  all_systems_active: false,
  system_status: {
    status_label: '1 Device Needs Attention',
    color: 'red',
    subtext: 'Soundbox SB-4421 is offline (12% battery, last seen 6.5h ago)'
  },
  devices: [
    {
      id: 'SB-4421',
      name: 'Paytm Soundbox 2.0',
      type: 'Soundbox',
      status: 'OFFLINE',
      health_grade: 'CRITICAL',
      battery_pct: 12,
      network: '4G - Disconnected',
      last_ping_sec_ago: 23400,
      last_ping_iso: new Date(Date.now() - 6.5 * 3600 * 1000).toISOString(),
      firmware: 'v2.4.1',
      is_stale: true,
      triage_recommendation: 'Tier 1: Connect device to 5V USB-C charger. Telemetry indicates discharge lockup.'
    },
    {
      id: 'POS-9982',
      name: 'Paytm All-in-One POS',
      type: 'EDC Machine',
      status: 'ONLINE',
      health_grade: 'OPTIMAL',
      battery_pct: 85,
      network: 'Wi-Fi Store_5G',
      last_ping_sec_ago: 45,
      last_ping_iso: new Date(Date.now() - 45 * 1000).toISOString(),
      firmware: 'v4.1.0',
      is_stale: false,
      triage_recommendation: null
    }
  ],
  financials: {
    last_30_days_gtv_inr: 482500,
    formatted_gtv_lakhs: '₹4.8L',
    today_volume_inr: 34850,
    success_rate_pct: 94.8,
    mom_growth_pct: 14.2,
    settlement_pending_inr: 12400,
    available_balance_inr: 35850,
    payment_mix: {
      upi_pct: 82,
      card_pct: 12,
      wallet_pct: 6
    }
  },
  daily_trends: [
    { date: 'Oct 29', full_date: '2026-10-29', is_today: true, amount: 29294.64 }
  ],
  open_cases: [
    {
      case_id: 'CASE-SND-4421-OFFLINE',
      type: 'DEVICE_DISCHARGED',
      title: 'Soundbox Discharged & Offline',
      entity_id: 'SB-4421',
      tier: 1,
      state: 'WAITING_ON_MERCHANT',
      current_step: 'Awaiting Merchant: Plug device into USB-C power source',
      time_open_hours: 6.5,
      sla_remaining_hours: 17.5,
      tat_deadline_iso: new Date(Date.now() + 17.5 * 3600 * 1000).toISOString(),
      evidence: {
        last_battery: '12%',
        mqtt_socket: 'DISCONNECTED',
        last_seen: '6.5 hours ago'
      }
    }
  ],
  tara_greeting: 'Hi Rahul 👋 Attention needed: Your Soundbox (SB-4421) is offline with 12% battery. Please connect it to a charger so audio payment announcements can resume.',
  offers_governance: {
    suppressed: true,
    reason: 'Tara is holding loan and upgrade offers while your Soundbox requires attention.'
  }
};

interface DerivedStateContextType {
  state: DerivedState;
  loading: boolean;
  error: string | null;
  refreshDerivedState: () => Promise<void>;
}

const DerivedStateContext = createContext<DerivedStateContextType>({
  state: FALLBACK_STATE,
  loading: false,
  error: null,
  refreshDerivedState: async () => {}
});

export const DerivedStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DerivedState>(FALLBACK_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDerivedState = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/derived-state');
      if (!res.ok) {
        throw new Error(`Failed to fetch derived state: ${res.status}`);
      }
      const data: DerivedState = await res.json();
      setState(data);
      setError(null);
    } catch (err: any) {
      console.warn('Using fallback derived state:', err?.message || err);
      setError(err?.message || 'Error fetching derived state');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDerivedState();
    // Poll every 15 seconds to keep all screens live and synchronized
    const interval = setInterval(fetchDerivedState, 15000);
    return () => clearInterval(interval);
  }, [fetchDerivedState]);

  return (
    <DerivedStateContext.Provider value={{ state, loading, error, refreshDerivedState: fetchDerivedState }}>
      {children}
    </DerivedStateContext.Provider>
  );
};

export const useDerivedState = () => useContext(DerivedStateContext);
