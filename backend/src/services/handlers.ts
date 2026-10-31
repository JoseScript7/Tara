import { Intent } from './intentRouter';
import { 
  globalMetrics, 
  activeMerchants
} from '../fixtures';
import { retrievePolicy } from '../rag/store';
import { maskPII } from '../utils/piiMasker';
import { generateResponse } from '../llm/localClient';
import { validateRupeeFigures } from '../utils/guardrails';
import { draftCompensationCredit } from './tools';

export const handleIntent = async (intent: Intent, message: string, merchantId: string): Promise<{ response: string, reasoning: string, data: any }> => {
  // Simulate DB lookup delay
  await new Promise(res => setTimeout(res, 300));
  
  // Mask PII in the user's message
  const maskedMessage = maskPII(message);

  let fallbackResponse = "";
  let reasoning = "";
  let contextData: any = {};
  let contextStringForGuardrail = "";

  const merchantData = activeMerchants[merchantId] || activeMerchants['M_STANDARD'];

  switch (intent) {
    case 'transaction_query': {
      const recent = merchantData.transactions.slice(0, 2);
      const totalAmount = merchantData.transactions.reduce((acc: any, t: any) => acc + t.amount, 0);
      contextData = { recent, metrics: globalMetrics, totalAmount };
      contextStringForGuardrail = JSON.stringify(contextData);
      reasoning = "Looked up recent transactions and applied MDR calculation logic from pitch deck.";
      fallbackResponse = `You've processed ${merchantData.transactions.length} transactions recently totaling ₹${totalAmount}. Note that from ${globalMetrics.mdrPolicyDate}, transactions above ₹${globalMetrics.mdrThreshold} carry a ${globalMetrics.mdrRate * 100}% MDR.`;
      break;
    }
    
    case 'settlement_query': {
      const settled = merchantData.settlements.find((s: any) => s.status === 'PROCESSED');
      const pending = merchantData.settlements.find((s: any) => s.status === 'PENDING');
      
      const policies = await retrievePolicy(maskedMessage);
      const policyText = policies.length > 0 ? ` According to the ${policies[0].source}: ${policies[0].text}` : '';
      
      contextData = { settlements: merchantData.settlements, policies };
      contextStringForGuardrail = JSON.stringify(contextData);
      reasoning = "Looked up settlement batches and TAT logic, augmented with local RAG policy.";
      fallbackResponse = `Your last settlement of ₹${settled?.amount || 0} (T+1) was processed. You have a pending settlement of ₹${pending?.amount || 0} under T+5 Turn Around Time.${policyText}`;
      break;
    }

    case 'device_status': {
      contextData = merchantData.deviceTelemetry;
      contextStringForGuardrail = JSON.stringify(contextData);
      reasoning = "Checked device telemetry for Soundbox and POS.";
      fallbackResponse = `Your Soundbox is ${merchantData.deviceTelemetry.soundbox.status} (${merchantData.deviceTelemetry.soundbox.battery}% battery) and POS is ${merchantData.deviceTelemetry.pos.status} (${merchantData.deviceTelemetry.pos.battery}% battery).`;
      break;
    }

    case 'dispute': {
      const openDispute = merchantData.disputes.find((d: any) => d.status === 'OPEN');
      const policies = await retrievePolicy(maskedMessage);
      const policyText = policies.length > 0 ? ` Based on the ${policies[0].source}: ${policies[0].text}` : '';
      
      contextData = { openDispute, policies };
      contextStringForGuardrail = JSON.stringify(contextData);
      reasoning = "Queried active dispute records, augmented with local RAG policy.";
      fallbackResponse = `You have no open disputes.${policyText}`;
      
      if (openDispute) {
        // Proactively draft a compensation credit due to the open dispute (simulating a TAT breach or customer satisfaction gesture)
        const proposedAction = draftCompensationCredit(100, `Proactive compensation for delayed dispute: ${openDispute.id}`);
        
        contextData = { ...contextData, approvalId: proposedAction.id, proposedAction };
        contextStringForGuardrail = JSON.stringify(contextData);
        
        reasoning += ` [TOOL_CALL: draftCompensationCredit(${proposedAction.payload.amount}) -> PENDING_APPROVAL]`;
        fallbackResponse = `You have an open dispute for ₹${openDispute.amount}: "${openDispute.description}". I have drafted a compensation credit for ₹${proposedAction.payload.amount} due to the delay. Please approve it.${policyText}`;
      }
      break;
    }

    case 'offer_query': {
      contextData = merchantData.loanEligibility;
      contextStringForGuardrail = JSON.stringify(contextData);
      reasoning = "Checked loan eligibility engine.";
      fallbackResponse = "You don't have any current offers.";
      if (merchantData.loanEligibility.eligible) {
        fallbackResponse = `Great news! You are eligible for a business loan up to ₹${merchantData.loanEligibility.maxAmount.toLocaleString()} because of your ${merchantData.loanEligibility.reason}`;
      }
      break;
    }

    case 'support_escalation': {
      contextData = { ticketCreated: true, escalationPolicy: "Escalate to a human agent who will call the user shortly." };
      contextStringForGuardrail = JSON.stringify(contextData);
      reasoning = "Identified frustration or explicit agent request. Escalating ticket.";
      fallbackResponse = "I understand you need more help. I am escalating this to a human agent who will call you shortly.";
      break;
    }

    case 'general':
    default: {
      contextData = { metrics: globalMetrics, capabilities: ["transactions", "settlements", "device status", "disputes", "loans"] };
      contextStringForGuardrail = JSON.stringify(contextData);
      reasoning = "No specific intent matched. Sending general greeting.";
      fallbackResponse = `Hello! I'm Tara, supporting ${globalMetrics.totalMerchants} merchants like you. I can help with transactions, settlements, device status, disputes, or loans!`;
      break;
    }
  }

  // Generate response using LLM
  const llmResult = await generateResponse(intent, contextData, maskedMessage, fallbackResponse);
  let finalResponse = llmResult.response;

  // Apply Guardrail
  if (!llmResult.usedFallback) {
    const isValid = validateRupeeFigures(finalResponse, contextStringForGuardrail);
    if (!isValid) {
      reasoning += " [GUARDRAIL TRIGGERED: Hallucinated currency figure detected. Falling back to template.]";
      finalResponse = fallbackResponse;
    } else {
      reasoning += " [LLM generation passed guardrails.]";
    }
  } else {
    reasoning += " [LLM failed, used template.]";
  }

  return { response: finalResponse, reasoning, data: contextData };
};
