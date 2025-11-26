import type { ActivityFormData, Recommendation, OutputFormat } from '../../shared/types';

/**
 * Options for generating recommendations
 */
export interface GenerateOptions {
  /** Output format preference */
  outputFormat?: OutputFormat;
}

/**
 * Base interface for LLM providers
 */
export interface LLMProvider {
  /**
   * Generate activity recommendations based on form data
   */
  generateRecommendations(
    formData: ActivityFormData,
    options?: GenerateOptions
  ): Promise<Recommendation[]>;

  /**
   * Check if this provider supports web search
   */
  supportsWebSearch(): boolean;

  /**
   * Get the model name being used
   */
  getModelName(): string;

  /**
   * Get the provider identifier
   */
  getProviderId(): string;
}

