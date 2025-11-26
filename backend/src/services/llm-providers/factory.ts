import type { LLMProvider } from './types';
import type { LLMProvider as LLMProviderType } from '../../shared/types';
import { AnthropicProvider } from './AnthropicProvider';
import { PerplexityProvider } from './PerplexityProvider';
import { GeminiProvider } from './GeminiProvider';

/**
 * Create a provider instance based on the provider identifier
 */
export function createProvider(provider: LLMProviderType): LLMProvider {
  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'perplexity':
      return new PerplexityProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Check if a provider is available (has API key configured)
 */
export function isProviderAvailable(provider: LLMProviderType): boolean {
  try {
    switch (provider) {
      case 'anthropic':
        return !!process.env.ANTHROPIC_API_KEY;
      case 'perplexity':
        return !!process.env.PERPLEXITY_API_KEY;
      case 'gemini':
        return !!process.env.GEMINI_API_KEY;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Get available providers
 */
export function getAvailableProviders(): LLMProviderType[] {
  const providers: LLMProviderType[] = ['anthropic', 'perplexity', 'gemini'];
  return providers.filter(isProviderAvailable);
}

