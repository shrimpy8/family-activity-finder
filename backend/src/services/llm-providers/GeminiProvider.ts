import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ActivityFormData, Recommendation } from '../../shared/types';
import type { LLMProvider, GenerateOptions } from './types';
import { DEBUG_LOGGING } from '../../shared/config';
import { buildPrompt, parseRecommendations } from './prompt';

/**
 * Gemini Provider implementation
 * Uses Google's Gemini API for generating recommendations
 * Reads model configuration from environment variables (.env file)
 */
export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  /** API model identifier (e.g., 'gemini-2.5-flash') - read from GEMINI_API_MODEL env var */
  private modelName: string;
  /** Display name for UI (e.g., 'Gemini 2.0 Flash') - read from GEMINI_MODEL_NAME env var */
  private displayName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);

    const apiModel = process.env.GEMINI_API_MODEL || 'gemini-2.5-flash';
    if (!apiModel || typeof apiModel !== 'string' || apiModel.trim().length === 0) {
      throw new Error('GEMINI_API_MODEL environment variable must be a non-empty string');
    }
    this.modelName = apiModel.trim();

    const displayModel = process.env.GEMINI_MODEL_NAME || 'Gemini 2.0 Flash';
    if (!displayModel || typeof displayModel !== 'string' || displayModel.trim().length === 0) {
      throw new Error('GEMINI_MODEL_NAME environment variable must be a non-empty string');
    }
    this.displayName = displayModel.trim();
  }

  async generateRecommendations(
    formData: ActivityFormData,
    _options?: GenerateOptions
  ): Promise<Recommendation[]> {
    const prompt = buildPrompt(formData);

    console.log('🔍 Calling Gemini API...');

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(prompt);

      console.log('✅ Gemini API response received');

      const response = result.response;
      const responseText = response.text();

      if (DEBUG_LOGGING) {
        console.log('\n========== FULL GEMINI RESPONSE ==========');
        console.log(responseText);
        console.log('========== END RESPONSE (length:', responseText.length, 'chars) ==========\n');
      }

      if (!responseText) {
        throw new Error('Empty response from Gemini API');
      }

      const recommendations = parseRecommendations(responseText, 'GEMINI');

      console.log(`📊 Parsed ${recommendations.length} recommendations`);

      if (recommendations.length === 0) {
        throw new Error('Unable to parse recommendations from Gemini response');
      }

      return recommendations;
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error calling Gemini API');
    }
  }

  supportsWebSearch(): boolean {
    return false;
  }

  getModelName(): string {
    return this.displayName;
  }

  getProviderId(): string {
    return 'gemini';
  }
}
