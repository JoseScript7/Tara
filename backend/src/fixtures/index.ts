export const globalMetrics = {
  totalMerchants: "1.17 crore",
  mdrPolicyDate: "2026-10-15",
  mdrThreshold: 2000,
  mdrRate: 0.004, // 0.4%
};

export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type ApprovalAction = {
  id: string;
  type: string;
  payload: any;
  status: ApprovalStatus;
  createdAt: string;
};

// Initial state template for cloning
const INITIAL_STATE = {
  approvals: [] as ApprovalAction[],
  merchants: {
    M_STANDARD: {
      transactions: [
        { id: "tx_201", amount: 150, date: "2026-09-15T10:00:00Z", status: "SUCCESS" },
        { id: "tx_202", amount: 300, date: "2026-09-15T11:00:00Z", status: "SUCCESS" },
      ],
      settlements: [
        { batchId: "set_101", amount: 450, type: "T+1", status: "PROCESSED" },
      ],
      deviceTelemetry: {
        soundbox: { status: "ONLINE", battery: 90, lastPing: "2026-09-16T12:00:00Z" },
        pos: { status: "ONLINE", battery: 80, lastPing: "2026-09-16T12:00:00Z" },
      },
      disputes: [],
      loanEligibility: { eligible: false, maxAmount: 0, reason: "Insufficient volume" }
    },
    M_DISPUTE_TAT: { // The Golden Path Demo Profile
      transactions: [
        { id: "tx_101", amount: 45, date: "2026-09-15T10:00:00Z", status: "SUCCESS" },
        { id: "tx_102", amount: 80, date: "2026-09-15T10:05:00Z", status: "SUCCESS" },
        { id: "tx_103", amount: 65, date: "2026-09-15T10:10:00Z", status: "SUCCESS" },
        { id: "tx_104", amount: 2500, date: "2026-09-15T10:15:00Z", status: "SUCCESS" },
      ],
      settlements: [
        { batchId: "set_001", amount: 45000, type: "T+1", status: "PROCESSED" },
        { batchId: "set_002", amount: 12000, type: "T+5", status: "PENDING" },
      ],
      deviceTelemetry: {
        soundbox: { status: "ONLINE", battery: 85, lastPing: "2026-09-16T12:00:00Z" },
        pos: { status: "ONLINE", battery: 60, lastPing: "2026-09-16T12:00:00Z" },
      },
      disputes: [
        { id: "disp_991", amount: 450, reason: "DOUBLE_CHARGE", status: "OPEN", description: "Customer requested refund for double charge." },
      ],
      loanEligibility: {
        eligible: true,
        maxAmount: 500000, // 5 Lakhs
        reason: "Consistent transaction volume exceeding minimum threshold",
      }
    },
    M_NEW: {
      transactions: [],
      settlements: [],
      deviceTelemetry: {
        soundbox: { status: "OFFLINE", battery: 0, lastPing: "Never" },
        pos: { status: "OFFLINE", battery: 0, lastPing: "Never" },
      },
      disputes: [],
      loanEligibility: { eligible: false, maxAmount: 0, reason: "New merchant" }
    }
  }
};

// Mutable active state
export let mockApprovals: ApprovalAction[] = [];
export let activeMerchants = JSON.parse(JSON.stringify(INITIAL_STATE.merchants));

export const resetFixtures = () => {
  mockApprovals = [];
  activeMerchants = JSON.parse(JSON.stringify(INITIAL_STATE.merchants));
};
