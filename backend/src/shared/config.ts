/**
 * Shared runtime configuration derived from environment variables.
 * Import from here instead of reading process.env directly in business logic.
 */

export const DEBUG_LOGGING = process.env.DEBUG_LOGGING === 'true';
export const OUTPUT_FORMAT = (process.env.OUTPUT_FORMAT?.toLowerCase() === 'json' ? 'json' : 'markdown') as 'json' | 'markdown';
export const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '60000', 10);
export const LLM_MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS || '2048', 10);
