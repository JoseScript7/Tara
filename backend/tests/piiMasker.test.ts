import { test } from 'node:test';
import assert from 'node:assert';
import { maskPII } from '../src/utils/piiMasker';

test('maskPII should redact UPI IDs', () => {
  const input = "Send money to rahul.kumar@paytm please.";
  const expected = "Send money to [REDACTED_UPI] please.";
  assert.strictEqual(maskPII(input), expected);
});

test('maskPII should redact PAN cards', () => {
  const input = "My PAN is ABCDE1234F, can you check it?";
  const expected = "My PAN is [REDACTED_PAN], can you check it?";
  assert.strictEqual(maskPII(input), expected);
});

test('maskPII should redact Credit/Debit cards', () => {
  const input1 = "Card number 1234-5678-9012-3456 used.";
  const expected1 = "Card number [REDACTED_CARD] used.";
  assert.strictEqual(maskPII(input1), expected1);

  const input2 = "Card number 1234567890123456 used.";
  const expected2 = "Card number [REDACTED_CARD] used.";
  assert.strictEqual(maskPII(input2), expected2);
});

test('maskPII should handle multiple PIIs', () => {
  const input = "User test@okicici paid with 4111222233334444 and PAN ABCDE9999Z";
  const expected = "User [REDACTED_UPI] paid with [REDACTED_CARD] and PAN [REDACTED_PAN]";
  assert.strictEqual(maskPII(input), expected);
});
