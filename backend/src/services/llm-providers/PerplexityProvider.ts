import type { ActivityFormData, Recommendation } from '../../shared/types';
import type { LLMProvider, GenerateOptions } from './types';
import { DEBUG_LOGGING, LLM_MAX_TOKENS } from '../../shared/config';
import { buildPrompt, parseRecommendations } from './prompt';
import { ProviderError } from '../../shared/errors';
import { logger } from '../../shared/logger';

interface PerplexityResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/**
 * Perplexity Provider implementation
 * Uses Perplexity's chat completions API with search-enabled models
 * Reads model configuration from environment variables (.env file)
 */
export class PerplexityProvider implements LLMProvider {
  private apiKey: string;
  /** API model identifier (e.g., 'sonar') - read from PERPLEXITY_API_MODEL env var */
  private modelName: string;
  private readonly apiUrl = 'https://api.perplexity.ai/chat/completions';
  /** Display name for UI (e.g., 'Perplexity Sonar') - read from PERPLEXITY_MODEL_NAME env var */
  private displayName: string;

  constructor() {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;

    const apiModel = process.env.PERPLEXITY_API_MODEL || 'sonar';
    if (!apiModel || typeof apiModel !== 'string' || apiModel.trim().length === 0) {
      throw new Error('PERPLEXITY_API_MODEL environment variable must be a non-empty string');
    }
    this.modelName = apiModel.trim();

    const displayModel = process.env.PERPLEXITY_MODEL_NAME || 'Perplexity Sonar';
    if (!displayModel || typeof displayModel !== 'string' || displayModel.trim().length === 0) {
      throw new Error('PERPLEXITY_MODEL_NAME environment variable must be a non-empty string');
    }
    this.displayName = displayModel.trim();
  }

  async generateRecommendations(
    formData: ActivityFormData,
    _options?: GenerateOptions
  ): Promise<Recommendation[]> {
    const prompt = buildPrompt(formData);

    logger.info('Calling Perplexity API with web search');

    try {
      // AbortController ensures the connection is closed when the outer withTimeout fires
      const controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), 55000);

      let response: Response;
      try {
        response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.modelName,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: LLM_MAX_TOKENS,
          }),
        });
      } finally {
        clearTimeout(abortTimeout);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: { message?: string } };
        if (response.status === 401 || response.status === 403) {
          throw new ProviderError('Perplexity authentication failed — check PERPLEXITY_API_KEY', 'perplexity', 'AUTH', 401);
        }
        if (response.status === 429) {
          throw new ProviderError('Perplexity rate limit exceeded', 'perplexity', 'RATE_LIMIT', 429);
        }
        throw new ProviderError(
          `Perplexity API error: ${errorData.error?.message || response.statusText}`,
          'perplexity', 'UNAVAILABLE'
        );
      }

      const data = await response.json() as PerplexityResponse;
      logger.info('Perplexity API response received');

      const responseText = data.choices?.[0]?.message?.content || '';

      if (DEBUG_LOGGING) {
        logger.debug({ responseText, length: responseText.length }, 'Full Perplexity response');
      }

      if (!responseText) {
        throw new Error('Empty response from Perplexity API');
      }

      const recommendations = parseRecommendations(responseText, 'PERPLEXITY');

      logger.info({ count: recommendations.length }, 'Parsed recommendations');

      if (recommendations.length === 0) {
        throw new Error('Unable to parse recommendations from Perplexity response');
      }

      return recommendations;
    } catch (error) {
      logger.error({ err: error }, 'Perplexity API error');
      if (error instanceof ProviderError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderError('Perplexity request timed out', 'perplexity', 'TIMEOUT');
      }
      if (error instanceof Error) throw error;
      throw new ProviderError('Unknown error calling Perplexity API', 'perplexity', 'UNKNOWN');
    }
  }

  supportsWebSearch(): boolean {
    return true;
  }

  getModelName(): string {
    return this.displayName;
  }

  getProviderId(): string {
    return 'perplexity';
  }
}
