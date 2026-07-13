import { groq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export class AIProviderService {
  /**
   * Returns the initialized AI model for the `@ai-sdk` generateText/streamText functions.
   */
  static getModel(provider: string, modelName: string) {
    if (provider === 'groq') {
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is missing');
      }
      return groq(modelName || 'llama-3.3-70b-versatile');
    }

    if (provider === 'gemini') {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is missing');
      }
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      return google(modelName || 'gemini-1.5-pro');
    }

    if (provider === 'ollama' || provider === 'openai' || provider === 'claude') {
      throw new Error(`Provider ${provider} is coming in a future update.`);
    }

    // Default fallback
    throw new Error(`Unsupported AI Provider: ${provider}`);
  }
}
