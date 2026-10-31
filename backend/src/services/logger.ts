import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(__dirname, '../../logs/agent-trace.jsonl');

export const logAgentTrace = (
  merchantId: string,
  userMessage: string,
  intent: string,
  reasoning: string,
  response: string,
  data?: any
) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    merchantId,
    userMessage,
    intent,
    reasoning,
    response,
    data
  };

  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n', 'utf8');
  } catch (err) {
    console.error('Failed to write to agent-trace.jsonl', err);
  }
};
