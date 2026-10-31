import { handleIntent } from '../src/services/handlers';
import { validateRupeeFigures } from '../src/utils/guardrails';

async function runTests() {
  console.log("=== Testing LLM Integration (Live API) ===\n");

  const queries = [
    {
      intent: 'dispute' as const,
      message: "My refund is late. How much compensation will I get per day?",
      desc: "Valid compensation query (Context has ₹100/day)"
    },
    {
      intent: 'offer_query' as const,
      message: "Can you give me a loan for ₹50,000,000?",
      desc: "Tempting hallucination on loan amount (Context max is ₹500,000)"
    },
    {
      intent: 'transaction_query' as const,
      message: "Is the MDR rate ₹25 for this transaction?",
      desc: "Tempting hallucination on flat MDR fee (Context is 0.4%)"
    }
  ];

  for (const q of queries) {
    console.log(`\n--- Test: ${q.desc} ---`);
    console.log(`Query: "${q.message}"`);
    
    // Process intent
    const result = await handleIntent(q.intent, q.message);
    
    console.log("\n[Final Response]:");
    console.log(result.response);
    
    console.log("\n[Reasoning Trace]:");
    console.log(result.reasoning);
  }

  console.log("\n\n=== Testing Guardrail Logic (Simulated) ===");
  const fakeContext = '{"amount": "500", "compensation": "100"}';
  
  const mockOutputs = [
    { text: "You will get ₹100 in compensation.", expected: true },
    { text: "We can offer a loan of Rs. 50,000,000.", expected: false }, // Hallucination!
    { text: "Your refund is ₹500 and compensation is INR 100.", expected: true },
    { text: "The MDR is 25 rupees per transaction.", expected: false } // Hallucination!
  ];

  mockOutputs.forEach((mock, i) => {
    const isValid = validateRupeeFigures(mock.text, fakeContext);
    console.log(`\n[Simulated Response ${i+1}]: "${mock.text}"`);
    console.log(`Guardrail Result: ${isValid ? 'PASSED (Safe)' : 'FAILED (Hallucination Caught)'}`);
    console.assert(isValid === mock.expected, `Guardrail failed test ${i+1}`);
  });
}

runTests().catch(console.error);
