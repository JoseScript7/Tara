import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import { classifyIntent } from './src/services/intentRouter';
import { handleIntent } from './src/services/handlers';
import { logAgentTrace } from './src/services/logger';

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Tara Backend is running' });
});

app.post('/api/tara/ask', async (req: Request, res: Response) => {
  try {
    const { merchantId, message } = req.body;
    
    if (!merchantId || !message) {
      res.status(400).json({ error: 'Missing merchantId or message' });
      return;
    }

    // 1. Intent Classification
    const intent = classifyIntent(message);

    // 2. Handler execution
    const result = await handleIntent(intent, message, merchantId);

    // 3. Trace Logging
    logAgentTrace(merchantId, message, intent, result.reasoning, result.response, result.data);

    // 4. Response
    res.json({
      intent,
      response: result.response,
      reasoning: result.reasoning
    });
  } catch (error) {
    console.error('Error handling /api/tara/ask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { mockApprovals, resetFixtures } from './src/fixtures';

app.get('/api/approvals', (req: Request, res: Response) => {
  res.json(mockApprovals);
});

app.post('/api/approvals/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // 'APPROVE' or 'REJECT'

  const approval = mockApprovals.find(a => a.id === id);
  if (!approval) {
    res.status(404).json({ error: 'Approval not found' });
    return;
  }

  if (action === 'APPROVE') {
    approval.status = 'APPROVED';
  } else if (action === 'REJECT') {
    approval.status = 'REJECTED';
  } else {
    res.status(400).json({ error: 'Invalid action. Must be APPROVE or REJECT' });
    return;
  }

  res.json(approval);
});

app.post('/api/reset', (req: Request, res: Response) => {
  resetFixtures();
  res.json({ status: 'ok', message: 'Demo data reset successfully.' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
