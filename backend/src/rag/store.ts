import { pipeline, env } from '@xenova/transformers';
import { policyDocuments } from './documents';

// Disable remote models to force local execution (optional, but good for privacy)
// However, first run needs to download the model from HuggingFace to the cache.
// env.allowLocalModels = true;

type DocumentChunk = {
  text: string;
  source: string;
  embedding?: number[];
};

let vectorStore: DocumentChunk[] = [];
let extractor: any = null;

// Cosine similarity utility
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const initRAG = async () => {
  if (extractor) return;
  
  console.log('Initializing local RAG layer. Loading Xenova/all-MiniLM-L6-v2...');
  // Use the lightweight feature extraction pipeline
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  
  console.log('Chunking and embedding documents...');
  for (const doc of policyDocuments) {
    // Basic chunking: split by sentences or keep as paragraphs (our docs are short enough to be single chunks)
    const chunks = [doc.text]; // In a larger system, we'd chunk here.
    
    for (const text of chunks) {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      // Output is a Tensor. We need to convert it to a standard JS array
      const embedding = Array.from(output.data) as number[];
      
      vectorStore.push({
        text,
        source: doc.source,
        embedding
      });
    }
  }
  console.log(`Vector store initialized with ${vectorStore.length} chunks.`);
};

export const retrievePolicy = async (query: string, topK: number = 3): Promise<{ text: string, source: string }[]> => {
  if (!extractor) {
    await initRAG();
  }
  
  // Embed the query
  const output = await extractor(query, { pooling: 'mean', normalize: true });
  const queryEmbedding = Array.from(output.data) as number[];
  
  // Calculate similarities
  const scoredChunks = vectorStore.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding!)
  }));
  
  // Sort by highest score first
  scoredChunks.sort((a, b) => b.score - a.score);
  
  // Return top K, omitting the raw embeddings
  return scoredChunks.slice(0, topK).map(c => ({ text: c.text, source: c.source }));
};
