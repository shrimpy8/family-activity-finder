import Anthropic from '@anthropic-ai/sdk';
import type { ActivityFormData, Recommendation } from '../../shared/types';
import type { LLMProvider, GenerateOptions } from './types';
import { DEBUG_LOGGING, LLM_MAX_TOKENS } from '../../shared/config';
import { buildPrompt, parseRecommendations } from './prompt';

/**
 * Anthropic Claude Provider implementation
 * Reads model configuration from environment variables (.env file)
 */
export class AnthropicProvider implements LLMProvider {
  private anthropic: Anthropic;
  /** API model identifier (e.g., 'claude-sonnet-4-5-20250929') - read from ANTHROPIC_API_MODEL env var */
  private modelName: string;
  /** Display name for UI (e.g., 'Claude Sonnet 4.5') - read from ANTHROPIC_MODEL_NAME env var */
  private displayName: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    this.anthropic = new Anthropic({ apiKey });

    const apiModel = process.env.ANTHROPIC_API_MODEL || 'claude-sonnet-4-5-20250929';
    if (!apiModel || typeof apiModel !== 'string' || apiModel.trim().length === 0) {
      throw new Error('ANTHROPIC_API_MODEL environment variable must be a non-empty string');
    }
    this.modelName = apiModel.trim();

    const displayModel = process.env.ANTHROPIC_MODEL_NAME || 'Claude Sonnet 4.5';
    if (!displayModel || typeof displayModel !== 'string' || displayModel.trim().length === 0) {
      throw new Error('ANTHROPIC_MODEL_NAME environment variable must be a non-empty string');
    }
    this.displayName = displayModel.trim();
  }

  async generateRecommendations(
    formData: ActivityFormData,
    _options?: GenerateOptions
  ): Promise<Recommendation[]> {
    const prompt = buildPrompt(formData);

    console.log('🔍 Calling Claude API with web search...');

    try {
      const message = await this.anthropic.messages.create({
        model: this.modelName,
        max_tokens: LLM_MAX_TOKENS,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 5,
          },
        ],
        messages: [{ role: 'user', content: prompt }],
      });

      console.log('✅ Claude API response received');

      const responseText = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('\n');

      if (DEBUG_LOGGING) {
        console.log('\n========== FULL CLAUDE RESPONSE ==========');
        console.log(responseText);
        console.log('========== END RESPONSE (length:', responseText.length, 'chars) ==========\n');
      }

      if (!responseText) {
        throw new Error('Empty response from Claude API');
      }

      const recommendations = parseRecommendations(responseText, 'ANTHROPIC');

      console.log(`📊 Parsed ${recommendations.length} recommendations`);

      if (recommendations.length === 0) {
        throw new Error('Unable to parse recommendations from Claude response');
      }

      return recommendations;
    } catch (error) {
      console.error('❌ Claude API Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error calling Claude API');
    }
  }

  supportsWebSearch(): boolean {
    return true;
  }

  getModelName(): string {
    return this.displayName;
  }

  getProviderId(): string {
    return 'anthropic';
  }
}
