import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyIntent } from '../src/services/intentRouter';

describe('Intent Router', () => {
  it('classifies transaction queries', () => {
    assert.equal(classifyIntent('I want to view my recent transactions'), 'transaction_query');
    assert.equal(classifyIntent('what is the mdr rate for a ticket of 2500?'), 'transaction_query');
  });

  it('classifies settlement queries', () => {
    assert.equal(classifyIntent('Check my settlements'), 'settlement_query');
    assert.equal(classifyIntent('When will the money be deposited in my bank?'), 'settlement_query');
  });

  it('classifies device status queries', () => {
    assert.equal(classifyIntent('Is my Soundbox online?'), 'device_status');
    assert.equal(classifyIntent('The battery on my POS is dying'), 'device_status');
  });

  it('classifies dispute queries', () => {
    assert.equal(classifyIntent('I need to resolve disputes'), 'dispute');
    assert.equal(classifyIntent('A customer is asking for a refund for fraud'), 'dispute');
  });

  it('classifies offer queries', () => {
    assert.equal(classifyIntent('View my offers'), 'offer_query');
    assert.equal(classifyIntent('Am I eligible for a loan?'), 'offer_query');
  });

  it('classifies support escalation queries', () => {
    assert.equal(classifyIntent('Get support'), 'support_escalation');
    assert.equal(classifyIntent('I want to speak to a human agent now'), 'support_escalation');
  });

  it('defaults to general for unknown inputs', () => {
    assert.equal(classifyIntent('Hello Tara'), 'general');
    assert.equal(classifyIntent('What is your name?'), 'general');
  });
});
