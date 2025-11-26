/**
 * Security utilities for sanitizing user input and error messages
 */

/**
 * Sanitize user input to prevent prompt injection attacks
 * Removes or escapes characters that could be used for prompt injection
 * @param input - User input string to sanitize
 * @returns Sanitized string safe for use in LLM prompts
 */
export function sanitizeForPrompt(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove common prompt injection patterns
  let sanitized = input
    // Remove newlines and carriage returns (can break prompt structure)
    .replace(/[\r\n]+/g, ' ')
    // Remove multiple consecutive spaces
    .replace(/\s+/g, ' ')
    // Remove or escape backticks (used for code blocks in prompts)
    .replace(/`/g, "'")
    // Remove or escape triple backticks (markdown code blocks)
    .replace(/```/g, "'''")
    // Remove control characters except spaces
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim();

  // Limit length to prevent extremely long inputs
  const MAX_LENGTH = 500;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

/**
 * Sanitize error messages before sending to client
 * Removes sensitive information and stack traces
 * @param error - Error object or message string
 * @param includeDetails - Whether to include error details (default: false for production)
 * @returns Sanitized error message safe for client consumption
 */
export function sanitizeErrorMessage(
  error: unknown,
  includeDetails: boolean = false
): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // If it's already a string, sanitize it
  if (typeof error === 'string') {
    // Remove file paths (common in error messages)
    let sanitized = error
      .replace(/\/[^\s]+/g, '[path]') // Remove file paths
      .replace(/at\s+[^\s]+\s+\([^)]+\)/g, '[stack trace]') // Remove stack trace lines
      .replace(/Error:\s*/gi, '') // Remove "Error:" prefix
      .trim();

    // Limit length
    const MAX_LENGTH = 200;
    if (sanitized.length > MAX_LENGTH) {
      sanitized = sanitized.substring(0, MAX_LENGTH) + '...';
    }

    return sanitized || 'An unexpected error occurred. Please try again.';
  }

  // If it's an Error object
  if (error instanceof Error) {
    let message = error.message || 'An unexpected error occurred. Please try again.';

    // Remove sensitive patterns
    message = message
      .replace(/API[_\s]?KEY/gi, '[API_KEY]')
      .replace(/password/gi, '[password]')
      .replace(/secret/gi, '[secret]')
      .replace(/token/gi, '[token]')
      .replace(/\/[^\s]+/g, '[path]')
      .trim();

    // Only include error name/details if explicitly requested (for debugging)
    if (includeDetails && error.name) {
      return `${error.name}: ${message}`;
    }

    return message;
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
}

