/**
 * Utility for verifying LLM responses to prevent hallucinations.
 */

export const validateRupeeFigures = (llmResponse: string, contextString: string): boolean => {
  // Regex to extract numbers following currency symbols or words
  // e.g., ₹100, Rs 50, INR 2000, 100 rupees
  const amountRegex = /(?:₹|Rs\.?|INR)\s*([\d,]+)|\b([\d,]+)\s*(?:rupees|inr)\b/gi;
  
  let match;
  while ((match = amountRegex.exec(llmResponse)) !== null) {
    // The number can be in group 1 or group 2 depending on the match structure
    let numberStr = match[1] || match[2];
    
    // Remove commas for easier comparison if needed, but for exact string matching we can just check if the string exists
    if (!contextString.includes(numberStr)) {
      console.warn(`[GUARDRAIL WARNING] Model hallucinated a currency figure: ${numberStr}`);
      return false; // Found a number not in the context!
    }
  }

  return true; // All figures validated against the context
};
