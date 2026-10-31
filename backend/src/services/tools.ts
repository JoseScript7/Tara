import { mockApprovals, ApprovalAction } from '../fixtures';
import { randomUUID } from 'crypto';

/**
 * Mocks the drafting of a compensation credit.
 * Creates a PENDING_APPROVAL record instead of executing immediately.
 */
export const draftCompensationCredit = (amount: number, reason: string): ApprovalAction => {
  const action: ApprovalAction = {
    id: randomUUID(),
    type: 'CREDIT_COMPENSATION',
    payload: { amount, reason },
    status: 'PENDING_APPROVAL',
    createdAt: new Date().toISOString()
  };
  mockApprovals.push(action);
  return action;
};

/**
 * Mocks raising a device replacement request.
 */
export const raiseDeviceReplacement = (deviceId: string, reason: string): ApprovalAction => {
  const action: ApprovalAction = {
    id: randomUUID(),
    type: 'DEVICE_REPLACEMENT',
    payload: { deviceId, reason },
    status: 'PENDING_APPROVAL',
    createdAt: new Date().toISOString()
  };
  mockApprovals.push(action);
  return action;
};

/**
 * Mocks flagging a TAT (Turn Around Time) breach.
 */
export const flagTATBreach = (transactionId: string): ApprovalAction => {
  const action: ApprovalAction = {
    id: randomUUID(),
    type: 'FLAG_TAT_BREACH',
    payload: { transactionId },
    status: 'PENDING_APPROVAL',
    createdAt: new Date().toISOString()
  };
  mockApprovals.push(action);
  return action;
};
