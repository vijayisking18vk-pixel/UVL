/**
 * Gemini AI Service Layer
 * Securely orchestrates Generative AI calls using VITE_GEMINI_API_KEY.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface GeminiResponse {
  text: string;
  error?: string;
}

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-pro',
  'gemini-1.5-flash'
];

/**
 * Generate a text response using Gemini
 * @param prompt The user or system prompt
 * @param preferredModel Optional model identifier
 */
export async function generateGeminiContent(
  prompt: string,
  preferredModel: string = 'gemini-2.5-flash'
): Promise<GeminiResponse> {
  if (!API_KEY) {
    return {
      text: '',
      error: 'Gemini API key is not configured in .env (VITE_GEMINI_API_KEY).'
    };
  }

  const modelsToTry = [
    preferredModel,
    ...CANDIDATE_MODELS.filter(m => m !== preferredModel)
  ];

  let lastError = '';

  for (const model of modelsToTry) {
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
        lastError = data.error?.message || `Status ${response.status}`;
        // If 403 (leaked key or forbidden), break early since trying another model won't change key auth
        if (response.status === 403) {
          console.warn('Gemini API authorization failure (key may be blocked or restricted):', lastError);
          break;
        }
        // If 404 (model not found), try next model candidate
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) {
        return { text };
      }
    } catch (err: any) {
      lastError = err.message || 'Network error';
    }
  }

  return {
    text: '',
    error: lastError || 'All Gemini model candidates failed.'
  };
}
