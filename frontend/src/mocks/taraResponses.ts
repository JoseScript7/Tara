export interface TaraApiResponse {
  response: string;
  approvalId?: string;
  traceId?: string;
  traceUrl?: string;
  guardrailsApplied?: string[];
  audio_base64?: string;
}

export const getTaraResponse = async (input: string, language: string = 'en'): Promise<TaraApiResponse> => {
  try {
    const res = await fetch('/api/tara/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        merchantId: 'M_DISPUTE_TAT',
        message: input,
        language
      })
    });

    if (!res.ok) {
      throw new Error('API request failed');
    }

    const data = await res.json();
    return {
      response: data.response,
      approvalId: data.data?.approvalId,
      traceId: data.data?.traceId,
      traceUrl: data.data?.traceUrl,
      guardrailsApplied: data.data?.guardrailsApplied,
      audio_base64: data.audio_base64,
    };
  } catch (error) {
    console.error('Error fetching Tara response:', error);
    return {
      response: "I'm having trouble connecting to the server right now. Please try again later."
    };
  }
};
