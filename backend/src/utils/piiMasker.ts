/**
 * Utility functions for masking Personally Identifiable Information (PII)
 * before sending data to external APIs like LLMs.
 */

export const maskPII = (text: string): string => {
  let masked = text;

  // Mask UPI IDs: string@bank or string@upi
  // Simple regex matching common UPI patterns
  masked = masked.replace(/[a-zA-Z0-9.\-_]+@[a-zA-Z]+/g, '[REDACTED_UPI]');

  // Mask PAN Cards: 5 letters, 4 numbers, 1 letter
  masked = masked.replace(/[A-Z]{5}[0-9]{4}[A-Z]{1}/g, '[REDACTED_PAN]');

  // Mask Credit/Debit Cards: 16 digits (with or without spaces/dashes)
  // Matching 4 sets of 4 digits, possibly separated by space or dash
  masked = masked.replace(/(?:\d{4}[-\s]?){3}\d{4}/g, '[REDACTED_CARD]');

  return masked;
};
