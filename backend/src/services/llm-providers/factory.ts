import type { LLMProvider } from './types';
import type { LLMProvider as LLMProviderType } from '../../shared/types';
import { AnthropicProvider } from './AnthropicProvider';
import { PerplexityProvider } from './PerplexityProvider';
import { GeminiProvider } from './GeminiProvider';

// Providers are stateless after construction — cache to avoid repeated allocations per request
const providerCache = new Map<string, LLMProvider>();

/**
 * Return a cached provider instance for the given identifier.
 * Instantiates on first call, reuses on subsequent calls.
 */
export function createProvider(provider: LLMProviderType): LLMProvider {
  const cached = providerCache.get(provider);
  if (cached) return cached;

  let instance: LLMProvider;
  switch (provider) {
    case 'anthropic':
      instance = new AnthropicProvider();
      break;
    case 'perplexity':
      instance = new PerplexityProvider();
      break;
    case 'gemini':
      instance = new GeminiProvider();
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  providerCache.set(provider, instance);
  return instance;
}

/**
 * Check if a provider is available (has API key configured).
 */
export function isProviderAvailable(provider: LLMProviderType): boolean {
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
}

/**
 * Return the list of providers that have an API key configured.
 */
export function getAvailableProviders(): LLMProviderType[] {
  const providers: LLMProviderType[] = ['anthropic', 'perplexity', 'gemini'];
  return providers.filter(isProviderAvailable);
}
