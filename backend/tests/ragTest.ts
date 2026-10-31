import { retrievePolicy } from '../src/rag/store';
import { handleIntent } from '../src/services/handlers';

async function run() {
  console.log('--- Testing retrievePolicy directly ---');
  const query = 'what happens if my refund is late';
  console.log(`Query: "${query}"`);
  
  const results = await retrievePolicy(query);
  console.log('\nRetrieved Chunks:');
  results.forEach((r, i) => {
    console.log(`\n[${i+1}] Source: ${r.source}`);
    console.log(`Text: ${r.text}`);
  });

  console.log('\n--- Testing handleIntent integration ---');
  const result = await handleIntent('dispute', query);
  console.log('\nFinal Augmented Response:');
  console.log(result.response);
  console.log('\nReasoning Trace:');
  console.log(result.reasoning);
}

run().catch(console.error);
