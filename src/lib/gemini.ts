/**
 * Gemini AI Service Layer
 * Securely orchestrates Generative AI calls using the configured GEMINI_API_KEY.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface GeminiResponse {
  text: string;
  error?: string;
}

/**
 * Generate a text response using Gemini
 * @param prompt The user or system prompt
 * @param model Model identifier (default: gemini-2.5-flash)
 */
export async function generateGeminiContent(
  prompt: string,
  model: string = 'gemini-2.5-flash'
): Promise<GeminiResponse> {
  if (!API_KEY) {
    return {
      text: '',
      error: 'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.'
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('Gemini API request failed:', data);
      return {
        text: '',
        error: data.error?.message || `Gemini API request failed with status ${response.status}`
      };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text };
  } catch (err: any) {
    console.error('Gemini error:', err);
    return {
      text: '',
      error: err.message || 'An unexpected error occurred while communicating with Gemini.'
    };
  }
}
