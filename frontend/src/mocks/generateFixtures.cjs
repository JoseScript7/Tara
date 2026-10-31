const fs = require('fs');
const path = require('path');

const generateTransactions = () => {
  const transactions = [];
  const names = ['Rahul Sharma', 'Sneha Gupta', 'Ankit Verma', 'Priya Desai', 'Vikram Singh', 'Neha Patil', 'Karan Mehta', 'Pooja Reddy', 'Amit Patel', 'Divya Kumar'];
  const modes = ['UPI', 'Credit Card', 'Wallet'];
  const upiHandles = ['@ybl', '@okaxis', '@okhdfcbank', '@paytm', '@icici'];
  
  const now = new Date();
  
  for (let i = 0; i < 45; i++) {
    const daysAgo = Math.floor(Math.random() * 14); // 0 to 13 days ago
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    // Randomize hours and minutes
    date.setHours(Math.floor(Math.random() * 12) + 8); // 8 AM to 8 PM
    date.setMinutes(Math.floor(Math.random() * 60));
    
    const id = `TXN-${9900 + i}`;
    const customer = names[Math.floor(Math.random() * names.length)];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const amount = Math.floor(Math.random() * 15000) + 100;
    
    let status = 'SUCCESS';
    let settlementStatus = 'SETTLED';
    
    const statusRand = Math.random();
    if (statusRand > 0.85) {
      status = 'FAILED';
      settlementStatus = 'UNSETTLED';
    } else if (statusRand > 0.75) {
      status = 'PENDING';
      settlementStatus = 'UNSETTLED';
    }
    
    if (status === 'SUCCESS' && daysAgo === 0) {
       // Today's successful txns might be pending settlement
       if (Math.random() > 0.3) {
         settlementStatus = 'PENDING';
       }
    }
    
    let maskedAccount = '';
    if (mode === 'UPI') {
       const firstLetter = customer.split(' ')[0][0].toLowerCase();
       const handle = upiHandles[Math.floor(Math.random() * upiHandles.length)];
       maskedAccount = `${firstLetter}u***${handle}`;
    } else if (mode === 'Credit Card') {
       maskedAccount = `**** ${Math.floor(Math.random() * 8999) + 1000}`;
    } else {
       maskedAccount = 'Wallet Balance';
    }

    const hasDispute = status === 'SUCCESS' && Math.random() > 0.95;
    const disputeId = hasDispute ? `DSP00${Math.floor(Math.random() * 9) + 1}` : undefined;
    
    // Create timeline
    const timeline = [];
    timeline.push({ status: 'Initiated', time: date.toISOString(), completed: true });
    
    const processDate = new Date(date);
    processDate.setSeconds(processDate.getSeconds() + 3);
    
    if (status === 'SUCCESS') {
      timeline.push({ status: 'Processed', time: processDate.toISOString(), completed: true });
      if (settlementStatus === 'SETTLED') {
        const settleDate = new Date(date);
        settleDate.setHours(settleDate.getHours() + 12);
        timeline.push({ status: 'Settled', time: settleDate.toISOString(), completed: true });
      } else {
        timeline.push({ status: 'Settlement Pending', completed: false });
      }
    } else if (status === 'FAILED') {
      timeline.push({ status: 'Failed', time: processDate.toISOString(), completed: true, error: 'Bank declined transaction' });
    } else {
      timeline.push({ status: 'Processing...', completed: false });
    }

    transactions.push({
      id,
      customer,
      amount,
      mode,
      status,
      settlementStatus,
      timestamp: date.toISOString(),
      maskedAccount,
      timeline,
      hasDispute,
      disputeId
    });
  }
  
  // Sort by newest first
  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return transactions;
};

const txns = generateTransactions();
const fixturesPath = path.join(__dirname, 'fixtures.ts');
let content = fs.readFileSync(fixturesPath, 'utf8');

// Replace TRANSACTIONS_FIXTURE
const replaceRegex = /export const TRANSACTIONS_FIXTURE = \[[\s\S]*?\];/;
const newStr = `export const TRANSACTIONS_FIXTURE = ${JSON.stringify(txns, null, 2)};`;

content = content.replace(replaceRegex, newStr);
fs.writeFileSync(fixturesPath, content);
console.log('Successfully updated fixtures.ts');
