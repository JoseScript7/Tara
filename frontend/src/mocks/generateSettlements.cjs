const fs = require('fs');
const path = require('path');

const generateSettlements = () => {
  const settlements = [];
  
  // Set current date to Oct 20, 2026 to straddle the Oct 15 cutoff
  const currentDate = new Date('2026-10-20T08:00:00.000Z');
  const mdrCutoffDate = new Date('2026-10-15T00:00:00.000Z');
  
  for (let i = 0; i < 40; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    
    // Generate a random gross amount between 15,000 and 65,000
    const grossAmount = Math.floor(Math.random() * 50000) + 15000;
    
    // Apply MDR of 0.4% if on or after Oct 15, 2026
    let mdrDeduction = 0;
    if (date.getTime() >= mdrCutoffDate.getTime()) {
      mdrDeduction = parseFloat((grossAmount * 0.004).toFixed(2));
    }
    
    const netAmount = parseFloat((grossAmount - mdrDeduction).toFixed(2));
    
    // Status is pending for today, processed for past
    const status = i === 0 ? 'PENDING' : 'PROCESSED';
    
    // Unique UTR for processed, none/pending for pending
    const id = i === 0 ? 'PENDING_SETTLEMENT' : `UTR-HDFC-${Math.floor(100000 + Math.random() * 900000)}`;

    settlements.push({
      id,
      date: date.toISOString(),
      grossAmount,
      mdrDeduction,
      netAmount,
      status,
      bank: 'HDFC Bank ****4021'
    });
  }
  
  return settlements;
};

const stls = generateSettlements();
const fixturesPath = path.join(__dirname, 'fixtures.ts');
let content = fs.readFileSync(fixturesPath, 'utf8');

// Replace SETTLEMENTS_FIXTURE
const replaceRegex = /export const SETTLEMENTS_FIXTURE = \[[\s\S]*?\];/;
const newStr = `export const SETTLEMENTS_FIXTURE = ${JSON.stringify(stls, null, 2)};`;

content = content.replace(replaceRegex, newStr);
fs.writeFileSync(fixturesPath, content);
console.log('Successfully updated SETTLEMENTS_FIXTURE in fixtures.ts');
