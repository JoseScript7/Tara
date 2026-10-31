export type Intent = 
  | 'transaction_query'
  | 'settlement_query'
  | 'device_status'
  | 'dispute'
  | 'offer_query'
  | 'support_escalation'
  | 'general';

export const classifyIntent = (message: string): Intent => {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.match(/(transaction|payment|sale|ticket|mdr)/)) {
    return 'transaction_query';
  }
  if (lowerMsg.match(/(settlement|bank|transfer|money|deposited|tat)/)) {
    return 'settlement_query';
  }
  if (lowerMsg.match(/(device|soundbox|pos|battery|online|offline|broken)/)) {
    return 'device_status';
  }
  if (lowerMsg.match(/(dispute|refund|chargeback|fraud)/)) {
    return 'dispute';
  }
  if (lowerMsg.match(/(offer|loan|credit|borrow)/)) {
    return 'offer_query';
  }
  if (lowerMsg.match(/(support|agent|human|help|escalate|call)/)) {
    return 'support_escalation';
  }

  return 'general';
};
