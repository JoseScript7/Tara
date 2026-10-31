import OpenAI from 'openai';

// Ollama OpenAI-compatible endpoint
const OLLAMA_BASE_URL = 'http://localhost:11434/v1';
const DEFAULT_MODEL = 'llama3.2:3b'; // Default model per user instructions

const openai = new OpenAI({
  apiKey: 'ollama', // API key is not required for local Ollama, but OpenAI client expects a string
  baseURL: OLLAMA_BASE_URL,
});

// Startup check: verify Ollama is running
const checkOllamaStatus = async () => {
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    if (!res.ok) throw new Error('Ollama endpoint returned non-200');
  } catch (error) {
    console.error('\n======================================================');
    console.error('ERROR: Ollama is not running or unreachable.');
    console.error('Please run the following command to start the model:');
    console.error(`  ollama serve`);
    console.error('And ensure the model is pulled:');
    console.error(`  ollama run ${DEFAULT_MODEL}`);
    console.error('======================================================\n');
  }
};

// Execute check on module load
checkOllamaStatus();

/**
 * Exact same function signature as the old Claude/OpenAI client 
 * for a drop-in replacement.
 */
export const generateResponse = async (
  intent: string,
  contextData: any,
  userMessage: string,
  fallbackTemplate: string
): Promise<{ response: string; usedFallback: boolean }> => {
  try {
    const contextString = typeof contextData === 'string' ? contextData : JSON.stringify(contextData, null, 2);

    const systemPrompt = `You are Tara, an AI teammate for Paytm merchants. Only state figures that appear in the provided context. Never invent a compensation amount or policy detail.

Context for answering the merchant's query:
${contextString}

Address the merchant's query concisely and directly based ONLY on the context above.`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2, // Low temperature for factual responses
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    if (response) {
      return { response, usedFallback: false };
    }
  } catch (error) {
    console.error("Error calling local Ollama model:", error);
  }

  // Fallback if API fails or returns empty
  return { response: fallbackTemplate, usedFallback: true };
};
