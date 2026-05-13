import Anthropic from '@anthropic-ai/sdk';
import type { ActivityFormData, Recommendation } from '../../shared/types';
import type { LLMProvider, GenerateOptions } from './types';
import { DEBUG_LOGGING, LLM_MAX_TOKENS } from '../../shared/config';
import { buildPrompt, parseRecommendations } from './prompt';
import { ProviderError } from '../../shared/errors';
import { logger } from '../../shared/logger';

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

    logger.info('Calling Claude API with web search');

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

      logger.info('Claude API response received');

      const responseText = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('\n');

      if (DEBUG_LOGGING) {
        logger.debug({ responseText, length: responseText.length }, 'Full Claude response');
      }

      if (!responseText) {
        throw new Error('Empty response from Claude API');
      }

      const recommendations = parseRecommendations(responseText, 'ANTHROPIC');

      logger.info({ count: recommendations.length }, 'Parsed recommendations');

      if (recommendations.length === 0) {
        throw new Error('Unable to parse recommendations from Claude response');
      }

      return recommendations;
    } catch (error) {
      logger.error({ err: error }, 'Claude API error');
      if (error instanceof ProviderError) throw error;
      if (error instanceof Anthropic.APIError) {
        if (error.status === 401 || error.status === 403) {
          throw new ProviderError('Anthropic authentication failed — check ANTHROPIC_API_KEY', 'anthropic', 'AUTH', 401);
        }
        if (error.status === 429) {
          throw new ProviderError('Anthropic rate limit exceeded', 'anthropic', 'RATE_LIMIT', 429);
        }
        throw new ProviderError(`Anthropic API error: ${error.message}`, 'anthropic', 'UNAVAILABLE');
      }
      if (error instanceof Error) throw error;
      throw new ProviderError('Unknown error calling Claude API', 'anthropic', 'UNKNOWN');
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
