import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Ensure the OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set in the environment. LLM calls will fail.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      model: 'gpt-4o-mini', // or 'gpt-3.5-turbo', whichever is standard for this key. GPT-4o-mini is standard and fast.
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
    console.error("Error calling OpenAI API:", error);
  }

  // Fallback if API fails or returns empty
  return { response: fallbackTemplate, usedFallback: true };
};
