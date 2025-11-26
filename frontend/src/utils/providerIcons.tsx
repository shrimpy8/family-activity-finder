import type { LLMProvider } from '../types/index.ts';

/**
 * Get the appropriate icon/emoji for each AI provider
 */
export function getProviderIcon(provider: LLMProvider): string {
  switch (provider) {
    case 'anthropic':
      return '🧠'; // Brain - represents Claude's intelligence
    case 'perplexity':
      return '🔍'; // Magnifying glass - represents Perplexity's search capabilities
    case 'gemini':
      return '⭐'; // Star - represents Google's Gemini
    case 'all':
      return '🤖'; // Robot - represents all AI providers
    default:
      return '🤖';
  }
}

/**
 * Get provider icon component (can be extended to use SVG icons in the future)
 */
export function ProviderIcon({ provider, className = 'text-xl' }: { provider: LLMProvider; className?: string }) {
  return <span className={className}>{getProviderIcon(provider)}</span>;
}

